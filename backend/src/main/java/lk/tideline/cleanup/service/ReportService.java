package lk.tideline.cleanup.service;

import lk.tideline.cleanup.config.TidelineProperties;
import lk.tideline.cleanup.dto.ReportDtos.*;
import lk.tideline.cleanup.model.*;
import lk.tideline.cleanup.repository.CleanupProjectRepository;
import lk.tideline.cleanup.repository.PollutionReportRepository;
import lk.tideline.cleanup.repository.ReportCommentRepository;
import lk.tideline.cleanup.repository.UserRepository;
import lk.tideline.cleanup.repository.VerificationVoteRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Entities are mapped to DTOs inside the transaction — lazy associations such as the
 * reporter and the photo list cannot be read once the session has closed.
 */
@Service
public class ReportService {

    private final PollutionReportRepository reportRepository;
    private final VerificationVoteRepository voteRepository;
    private final ReportCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final CleanupProjectRepository projectRepository;
    private final ProjectService projectService;
    private final AlertService alertService;
    private final TidelineProperties properties;
    private final DocumentStorageService storage;

    public ReportService(PollutionReportRepository reportRepository,
                         VerificationVoteRepository voteRepository,
                         ReportCommentRepository commentRepository,
                         UserRepository userRepository,
                         CleanupProjectRepository projectRepository,
                         ProjectService projectService,
                         AlertService alertService,
                         TidelineProperties properties,
                         DocumentStorageService storage) {
        this.reportRepository = reportRepository;
        this.voteRepository = voteRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.projectService = projectService;
        this.alertService = alertService;
        this.properties = properties;
        this.storage = storage;
    }

    private int thresholdPercent() {
        return properties.getVerification().getThresholdPercent();
    }

    private ReportResponse toResponse(PollutionReport report) {
        CleanupProject project = projectRepository.findFirstByReportId(report.getId()).orElse(null);
        return ReportResponse.from(report, thresholdPercent(), project);
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> search(ReportStatus status, Severity severity, String province, Pageable pageable) {
        // Approved reports are projects now; they're found through the projects API instead.
        if (status != null && status.becameProject()) {
            return Page.empty(pageable);
        }
        return reportRepository.search(status, ReportStatus.BECAME_PROJECT, severity, province, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ReportResponse view(Long id) {
        return toResponse(get(id));
    }

    private PollutionReport get(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Report " + id + " was not found."));
    }

    @Transactional
    public ReportResponse create(CreateReportRequest request, User reporter) {
        return create(request, List.of(), reporter);
    }

    @Transactional
    public ReportResponse create(CreateReportRequest request, List<MultipartFile> evidence, User reporter) {
        List<DocumentStorageService.CheckedFile> files = storage.checkEvidence(evidence);
        PollutionReport report = new PollutionReport();
        report.setReference("TMP-" + UUID.randomUUID());
        report.setTitle(request.title());
        report.setDescription(request.description());
        report.setSeverity(request.severity());
        report.setLocationName(request.locationName());
        report.setProvince(request.province());
        report.setLatitude(request.latitude());
        report.setLongitude(request.longitude());
        report.setReporter(reporter);
        report.setStatus(ReportStatus.PENDING);

        if (request.photoUrls() != null) {
            for (String url : request.photoUrls()) {
                ReportPhoto photo = new ReportPhoto();
                photo.setReport(report);
                photo.setUrl(url);
                report.getPhotos().add(photo);
            }
        }
        for (DocumentStorageService.CheckedFile file : files) {
            String storedName = storage.saveEvidence(file);
            ReportPhoto photo = new ReportPhoto();
            photo.setReport(report);
            photo.setStoredName(storedName);
            photo.setContentType(file.contentType());
            photo.setUrl("/api/reports/evidence/" + storedName);
            photo.setCaption(file.originalName());
            report.getPhotos().add(photo);
        }

        PollutionReport saved = reportRepository.saveAndFlush(report);
        saved.setReference("SR-" + (2400 + saved.getId()));

        double radius = properties.getAlerts().getInitialRadiusKm();
        saved.setAlertRadiusKm(radius);
        alertService.notifyNearby(saved, radius,
                AlertType.NEW_REPORT_NEARBY,
                "New pollution report near " + saved.getLocationName(),
                saved.getTitle() + " — the community can now confirm or dispute this report.");

        return toResponse(saved);
    }

    /**
     * Records a community vote and recalculates the trust percentage. A report that reaches
     * the configured threshold (75% in the SRS) with enough votes becomes Verified.
     */
    @Transactional
    public ReportResponse vote(Long reportId, User voter, boolean confirmed) {
        PollutionReport report = get(reportId);

        if (report.getStatus() == ReportStatus.REJECTED
                || report.getStatus() == ReportStatus.APPROVED
                || report.getStatus() == ReportStatus.CLEANED) {
            throw new IllegalStateException("Voting is closed for this report.");
        }

        VerificationVote vote = voteRepository.findByReportAndVoter(report, voter)
                .orElseGet(() -> {
                    VerificationVote fresh = new VerificationVote();
                    fresh.setReport(report);
                    fresh.setVoter(voter);
                    return fresh;
                });
        vote.setConfirmed(confirmed);
        voteRepository.saveAndFlush(vote);

        return toResponse(recalculateTrust(report));
    }

    private PollutionReport recalculateTrust(PollutionReport report) {
        int confirm = (int) voteRepository.countByReportAndConfirmed(report, true);
        int dispute = (int) voteRepository.countByReportAndConfirmed(report, false);
        int total = confirm + dispute;
        int percentage = total == 0 ? 0 : Math.round((confirm * 100f) / total);

        report.setConfirmVotes(confirm);
        report.setDisputeVotes(dispute);
        report.setTrustPercentage(percentage);
        report.setUpdatedAt(Instant.now());

        if (report.getStatus() == ReportStatus.PENDING && total > 0) {
            report.setStatus(ReportStatus.VERIFYING);
        }

        boolean threshold = percentage >= thresholdPercent()
                && total >= properties.getVerification().getMinimumVotes();

        if (report.getStatus() == ReportStatus.VERIFYING && threshold) {
            report.setStatus(ReportStatus.VERIFIED);
            report.setVerifiedAt(Instant.now());
            alertService.send(report.getReporter(), AlertType.REPORT_VERIFIED,
                    "Your report was verified",
                    report.getReference() + " passed the " + thresholdPercent()
                            + "% community threshold. An administrator reviews it next.",
                    report.getId(), null, null);
        }

        return report;
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> comments(Long reportId) {
        return commentRepository.findByReportOrderByCreatedAtAsc(get(reportId)).stream()
                .map(CommentResponse::from)
                .toList();
    }

    @Transactional
    public CommentResponse comment(Long reportId, User author, CommentRequest request) {
        PollutionReport report = get(reportId);
        ReportComment comment = new ReportComment();
        comment.setReport(report);
        comment.setAuthor(author);
        comment.setBody(request.body());
        comment.setOfficial(author.getRole() == Role.ADMIN || author.getRole() == Role.AUTHORITY);
        return CommentResponse.from(commentRepository.save(comment));
    }

    /**
     * Module 4 — the administrator approves a report (sending it to the government authority),
     * rejects it, or asks the reporter for more information.
     */
    @Transactional
    public ReportResponse moderate(Long reportId, ModerationRequest request, User admin) {
        PollutionReport report = get(reportId);

        switch (report.getStatus()) {
            case ESCALATED -> throw new IllegalStateException(
                    "This report is with the government authority. Wait for their decision.");
            case APPROVED, CLEANED -> throw new IllegalStateException("This report has already become a project.");
            case REJECTED -> throw new IllegalStateException("This report was rejected and is closed.");
            default -> {
            }
        }

        ReviewDecision decision = request.decision();
        String comment = trimmed(request.comment());
        Instant now = Instant.now();
        String reference = report.getReference();

        switch (decision) {
            case APPROVED -> {
                report.setStatus(ReportStatus.ESCALATED);
                report.setEscalatedAt(now);
                report.setAuthorityDecision(ReviewDecision.PENDING);
                alertService.send(report.getReporter(), AlertType.AUTHORITY_DECISION,
                        "An administrator approved your report",
                        reference + " has been sent to the government authority for a decision.",
                        report.getId(), null, null);
                for (User officer : userRepository.findByRole(Role.AUTHORITY)) {
                    if (officer.isSuspended()) {
                        continue;
                    }
                    alertService.send(officer, AlertType.AUTHORITY_DECISION,
                            "Report escalated for your review",
                            reference + " at " + report.getLocationName() + " — " + report.getTrustPercentage()
                                    + "% community trust. Approve it to create a cleanup project, reject it, or ask for more detail.",
                            report.getId(), null, null);
                }
            }
            case MORE_INFO_REQUESTED -> {
                require(comment, "Say what needs clarifying. The reporter sees your question.");
                postOfficialComment(report, admin, comment);
                alertService.send(report.getReporter(), AlertType.AUTHORITY_DECISION,
                        "More detail needed on your report",
                        reference + ": " + comment, report.getId(), null, null);
            }
            case REJECTED -> {
                require(comment, "Give a reason for rejecting this report. The reporter sees it.");
                report.setStatus(ReportStatus.REJECTED);
                alertService.send(report.getReporter(), AlertType.AUTHORITY_DECISION,
                        "Your report was rejected",
                        reference + ": " + comment, report.getId(), null, null);
            }
            default -> throw new IllegalArgumentException("Choose approve, reject, or request more information.");
        }

        report.setAdminDecision(decision);
        report.setModerationComment(comment);
        report.setAdminReviewedAt(now);
        report.setUpdatedAt(now);
        return toResponse(report);
    }

    /**
     * Module 5 — the government officer approves, rejects, or asks for more information. Approval
     * finishes the report: it becomes a cleanup project owned by the person who reported it.
     */
    @Transactional
    public ReportResponse decideAsAuthority(Long reportId, AuthorityDecisionRequest request, User officer) {
        PollutionReport report = get(reportId);

        if (report.getStatus() != ReportStatus.ESCALATED) {
            throw new IllegalStateException("Only a report an administrator has sent to the authority can be decided.");
        }
        ReviewDecision decision = request.decision();
        if (decision == ReviewDecision.PENDING) {
            throw new IllegalArgumentException("Choose approve, reject, or request more information.");
        }

        String comment = request.comment().trim();
        Instant now = Instant.now();
        String reference = report.getReference();

        report.setAuthorityOfficer(officer);
        report.setAuthorityDecision(decision);
        report.setAuthorityComment(comment);
        report.setDecidedAt(now);
        report.setUpdatedAt(now);

        String adminTitle;
        switch (decision) {
            case APPROVED -> {
                report.setStatus(ReportStatus.APPROVED);
                CleanupProject project = projectService.createFromApprovedReport(report);
                alertService.send(report.getReporter(), AlertType.PROJECT_PLANNED,
                        "Your report is now a project",
                        officer.getFullName() + " approved " + reference + ", so it is now project "
                                + project.getReference() + " and you are its project owner. Their note: " + comment,
                        report.getId(), project.getId(), null);
                adminTitle = "Authority approved " + reference;
            }
            case REJECTED -> {
                report.setStatus(ReportStatus.REJECTED);
                alertService.send(report.getReporter(), AlertType.AUTHORITY_DECISION,
                        "The authority rejected your report",
                        reference + ": " + comment, report.getId(), null, null);
                adminTitle = "Authority rejected " + reference;
            }
            default -> {
                postOfficialComment(report, officer, comment);
                alertService.send(report.getReporter(), AlertType.AUTHORITY_DECISION,
                        "The authority needs more detail",
                        reference + ": " + comment, report.getId(), null, null);
                adminTitle = "Authority requested more information on " + reference;
            }
        }

        // Module 5 — "notify admin about approval status".
        for (User admin : userRepository.findByRole(Role.ADMIN)) {
            alertService.send(admin, AlertType.AUTHORITY_DECISION, adminTitle,
                    officer.getFullName() + ": " + comment, report.getId(), null, null);
        }

        return toResponse(report);
    }

    @Transactional
    public double escalateAlertRadius(Long reportId) {
        return alertService.escalateRadius(get(reportId));
    }

    /** Questions go in the discussion so the reporter can answer where everyone can see it. */
    private void postOfficialComment(PollutionReport report, User author, String body) {
        ReportComment question = new ReportComment();
        question.setReport(report);
        question.setAuthor(author);
        question.setBody(body);
        question.setOfficial(true);
        commentRepository.save(question);
    }

    private static String trimmed(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static void require(String value, String message) {
        if (value == null) {
            throw new IllegalArgumentException(message);
        }
    }
}
