package lk.tideline.cleanup.service;

import lk.tideline.cleanup.config.TidelineProperties;
import lk.tideline.cleanup.dto.ReportDtos.*;
import lk.tideline.cleanup.model.*;
import lk.tideline.cleanup.repository.PollutionReportRepository;
import lk.tideline.cleanup.repository.ReportCommentRepository;
import lk.tideline.cleanup.repository.UserRepository;
import lk.tideline.cleanup.repository.VerificationVoteRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final AlertService alertService;
    private final TidelineProperties properties;

    public ReportService(PollutionReportRepository reportRepository,
                         VerificationVoteRepository voteRepository,
                         ReportCommentRepository commentRepository,
                         UserRepository userRepository,
                         AlertService alertService,
                         TidelineProperties properties) {
        this.reportRepository = reportRepository;
        this.voteRepository = voteRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.alertService = alertService;
        this.properties = properties;
    }

    private int thresholdPercent() {
        return properties.getVerification().getThresholdPercent();
    }

    private ReportResponse toResponse(PollutionReport report) {
        return ReportResponse.from(report, thresholdPercent());
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> search(ReportStatus status, Severity severity, String province, Pageable pageable) {
        return reportRepository.search(status, severity, province, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ReportResponse view(Long id) {
        return toResponse(get(id));
    }

    /** Entity accessor for other services; callers must already be in a transaction. */
    public PollutionReport get(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Report " + id + " was not found."));
    }

    @Transactional
    public ReportResponse create(CreateReportRequest request, User reporter) {
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

        if (report.getStatus() == ReportStatus.REJECTED || report.getStatus() == ReportStatus.CLEANED) {
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
                            + "% community threshold and has moved to Verified.",
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
     * Module 4 — an administrator verifies, rejects, or asks the reporter for clarification
     * (which returns the report to Verifying).
     */
    @Transactional
    public ReportResponse moderate(Long reportId, ModerationRequest request, User admin) {
        PollutionReport report = get(reportId);

        if (report.getStatus() == ReportStatus.ESCALATED) {
            throw new IllegalStateException("This report is with the authority. Wait for their decision before moderating it.");
        }
        if (report.getStatus() == ReportStatus.CLEANED) {
            throw new IllegalStateException("This site has already been cleaned.");
        }

        ReportStatus target = request.status();
        if (target != ReportStatus.VERIFIED && target != ReportStatus.REJECTED && target != ReportStatus.VERIFYING) {
            throw new IllegalArgumentException("An administrator can only verify, reject, or ask for clarification.");
        }

        boolean clarification = target == ReportStatus.VERIFYING;
        String comment = request.comment() == null || request.comment().isBlank() ? null : request.comment().trim();
        if (clarification && comment == null) {
            throw new IllegalArgumentException("Say what needs clarifying. The reporter sees your question.");
        }

        report.setStatus(target);
        report.setModerationComment(comment);
        report.setUpdatedAt(Instant.now());
        if (target == ReportStatus.VERIFIED) {
            report.setVerifiedAt(Instant.now());
        }

        if (clarification) {
            // Posted to the discussion so the reporter can answer where the community can see it.
            ReportComment question = new ReportComment();
            question.setReport(report);
            question.setAuthor(admin);
            question.setBody(comment);
            question.setOfficial(true);
            commentRepository.save(question);
        }

        String title = switch (target) {
            case VERIFIED -> "Your report was verified";
            case REJECTED -> "Your report was rejected";
            default -> "More detail needed on your report";
        };
        String body = clarification
                ? report.getReference() + ": " + comment
                : report.getReference() + " is now " + target.name().toLowerCase() + (comment == null ? "." : ". " + comment);
        alertService.send(report.getReporter(), AlertType.AUTHORITY_DECISION, title, body, report.getId(), null, null);

        return toResponse(report);
    }

    /** Module 5 — a verified report is forwarded to the relevant government body. */
    @Transactional
    public ReportResponse escalate(Long reportId, User actor) {
        PollutionReport report = get(reportId);

        if (report.getStatus() != ReportStatus.VERIFIED && report.getStatus() != ReportStatus.VERIFYING) {
            throw new IllegalStateException("Only a verified report can be escalated to an authority.");
        }

        report.setStatus(ReportStatus.ESCALATED);
        report.setEscalatedAt(Instant.now());
        report.setUpdatedAt(Instant.now());

        alertService.send(report.getReporter(), AlertType.AUTHORITY_DECISION,
                "Your report was escalated",
                report.getReference() + " has been sent to the relevant government authority for review.",
                report.getId(), null, null);

        for (User officer : userRepository.findByRole(Role.AUTHORITY)) {
            if (officer.isSuspended()) {
                continue;
            }
            alertService.send(officer, AlertType.AUTHORITY_DECISION,
                    "Report escalated for your review",
                    report.getReference() + " at " + report.getLocationName() + " — " + report.getTrustPercentage()
                            + "% community trust. Approve or reject the cleanup request.",
                    report.getId(), null, null);
        }

        return toResponse(report);
    }

    /** Module 5 — the authority officer approves or rejects the cleanup request. */
    @Transactional
    public ReportResponse decideAsAuthority(Long reportId, AuthorityDecisionRequest request, User officer) {
        PollutionReport report = get(reportId);

        if (report.getStatus() != ReportStatus.ESCALATED) {
            throw new IllegalStateException("Only an escalated report can be decided by an authority.");
        }

        report.setAuthorityOfficer(officer);
        report.setAuthorityComment(request.comment());
        report.setAuthorityApproved(request.approved());
        report.setDecidedAt(Instant.now());
        report.setUpdatedAt(Instant.now());

        if (!request.approved()) {
            report.setStatus(ReportStatus.REJECTED);
        }

        alertService.send(report.getReporter(), AlertType.AUTHORITY_DECISION,
                request.approved() ? "Cleanup approved by the authority" : "Cleanup request rejected",
                report.getReference() + ": " + request.comment(),
                report.getId(), null, null);

        // Module 5 — "notify admin about approval status".
        String decision = request.approved() ? "approved" : "rejected";
        for (User admin : userRepository.findByRole(Role.ADMIN)) {
            alertService.send(admin, AlertType.AUTHORITY_DECISION,
                    "Authority " + decision + " " + report.getReference(),
                    officer.getFullName() + " " + decision + " the cleanup request: " + request.comment(),
                    report.getId(), null, null);
        }

        return toResponse(report);
    }

    @Transactional
    public double escalateAlertRadius(Long reportId) {
        return alertService.escalateRadius(get(reportId));
    }

    void markCleaned(PollutionReport report) {
        report.setStatus(ReportStatus.CLEANED);
        report.setUpdatedAt(Instant.now());
    }
}
