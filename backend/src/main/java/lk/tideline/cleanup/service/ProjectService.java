package lk.tideline.cleanup.service;

import lk.tideline.cleanup.config.TidelineProperties;
import lk.tideline.cleanup.dto.ProjectDtos.CreateProjectRequest;
import lk.tideline.cleanup.dto.ProjectDtos.ParticipantResponse;
import lk.tideline.cleanup.dto.ProjectDtos.ProjectResponse;
import lk.tideline.cleanup.dto.ProjectDtos.ProjectUpdateRequest;
import lk.tideline.cleanup.model.*;
import lk.tideline.cleanup.repository.CleanupProjectRepository;
import lk.tideline.cleanup.repository.ProjectParticipantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class ProjectService {

    private final CleanupProjectRepository projectRepository;
    private final ProjectParticipantRepository participantRepository;
    private final ReportService reportService;
    private final AlertService alertService;
    private final TidelineProperties properties;

    public ProjectService(CleanupProjectRepository projectRepository,
                          ProjectParticipantRepository participantRepository,
                          ReportService reportService,
                          AlertService alertService,
                          TidelineProperties properties) {
        this.projectRepository = projectRepository;
        this.participantRepository = participantRepository;
        this.reportService = reportService;
        this.alertService = alertService;
        this.properties = properties;
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> list(ProjectStatus status, Long reportId, User viewer) {
        List<CleanupProject> projects = reportId != null
                ? projectRepository.findByReportIdOrderByCreatedAtDesc(reportId)
                : status != null
                    ? projectRepository.findByStatusOrderByCreatedAtDesc(status)
                    : projectRepository.findAllByOrderByCreatedAtDesc();
        return projects.stream()
                .filter(project -> status == null || project.getStatus() == status)
                .map(project -> toResponse(project, viewer))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse view(Long id, User viewer) {
        return toResponse(get(id), viewer);
    }

    private CleanupProject get(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Project " + id + " was not found."));
    }

    private ProjectResponse toResponse(CleanupProject project, User viewer) {
        Boolean joined = viewer == null
                ? null
                : participantRepository.findByProjectAndUser(project, viewer).isPresent();

        // Participants' names are shown only to the people running the cleanup.
        boolean manages = viewer != null
                && (Objects.equals(project.getOwner().getId(), viewer.getId())
                    || viewer.getRole() == Role.ADMIN
                    || viewer.getRole() == Role.AUTHORITY);
        List<ParticipantResponse> participants = manages
                ? participantRepository.findByProjectOrderByJoinedAtAsc(project).stream()
                        .map(ParticipantResponse::from)
                        .toList()
                : null;

        return ProjectResponse.from(project,
                participantRepository.countByProjectAndParticipantRole(project, ParticipantRole.VOLUNTEER),
                participantRepository.countByProjectAndParticipantRole(project, ParticipantRole.DIVER),
                joined,
                participants);
    }

    @Transactional
    public ProjectResponse create(CreateProjectRequest request, User owner) {
        CleanupProject project = new CleanupProject();
        project.setReference("TMP-" + UUID.randomUUID());
        project.setTitle(request.title());
        project.setDescription(request.description());
        project.setOwner(owner);
        project.setLocationName(request.locationName());
        project.setProvince(request.province());
        project.setLatitude(request.latitude());
        project.setLongitude(request.longitude());
        project.setStatus(ProjectStatus.PLANNED);

        PollutionReport report = null;
        if (request.reportId() != null) {
            report = reportService.get(request.reportId());
            requireReadyForCleanup(report);
            project.setReport(report);
            if (project.getLatitude() == null) {
                project.setLatitude(report.getLatitude());
                project.setLongitude(report.getLongitude());
            }
        }

        CleanupProject saved = projectRepository.saveAndFlush(project);
        saved.setReference("CP-" + (100 + saved.getId()));

        Set<Long> excluded = new HashSet<>();
        excluded.add(owner.getId());

        // The proposal's core complaint: people who report pollution never hear back.
        if (report != null && !Objects.equals(report.getReporter().getId(), owner.getId())) {
            User reporter = report.getReporter();
            excluded.add(reporter.getId());
            alertService.send(reporter, AlertType.PROJECT_PLANNED,
                    "A cleanup is planned for your report",
                    owner.getFullName() + " is organising " + saved.getTitle() + " for "
                            + report.getReference() + " at " + report.getLocationName() + ".",
                    report.getId(), saved.getId(), null);
        }

        alertService.notifyProjectNearby(saved, properties.getAlerts().getInitialRadiusKm(),
                "New cleanup planned near " + saved.getLocationName(),
                saved.getTitle() + " — join this cleanup if you can help.",
                excluded);

        return toResponse(saved, owner);
    }

    /** A cleanup needs a community-verified report, and government approval once it has been escalated. */
    private void requireReadyForCleanup(PollutionReport report) {
        if (report.getStatus() == ReportStatus.ESCALATED && !Boolean.TRUE.equals(report.getAuthorityApproved())) {
            throw new IllegalStateException(
                    "This report is waiting for the authority's decision. A cleanup can start once it is approved.");
        }
        if (report.getStatus() != ReportStatus.VERIFIED && report.getStatus() != ReportStatus.ESCALATED) {
            throw new IllegalStateException("A cleanup needs a community-verified report.");
        }
        if (projectRepository.existsByReportId(report.getId())) {
            throw new IllegalStateException("A cleanup is already planned for this report.");
        }
    }

    @Transactional
    public ProjectResponse join(Long projectId, User user, ParticipantRole role) {
        CleanupProject project = get(projectId);

        if (project.getStatus() == ProjectStatus.COMPLETED) {
            throw new IllegalStateException("This cleanup is already complete.");
        }
        if (Objects.equals(project.getOwner().getId(), user.getId())) {
            throw new IllegalStateException("You are leading this cleanup, so you are already part of it.");
        }
        participantRepository.findByProjectAndUser(project, user).ifPresent(existing -> {
            throw new IllegalStateException("You have already joined this cleanup.");
        });

        ParticipantRole resolved = role != null ? role
                : (user.getRole() == Role.DIVER ? ParticipantRole.DIVER : ParticipantRole.VOLUNTEER);

        ProjectParticipant participant = new ProjectParticipant();
        participant.setProject(project);
        participant.setUser(user);
        participant.setParticipantRole(resolved);
        participantRepository.saveAndFlush(participant);

        if (project.getStatus() == ProjectStatus.PLANNED) {
            project.setStatus(ProjectStatus.ACTIVE);
            project.setStartedAt(Instant.now());
        }

        return toResponse(project, user);
    }

    /** Module 8 — the organiser rates each participant (1-5) once the cleanup is complete. */
    @Transactional
    public ProjectResponse mark(Long projectId, Long participantId, int mark, User organiser) {
        CleanupProject project = get(projectId);

        if (!Objects.equals(project.getOwner().getId(), organiser.getId())) {
            throw new IllegalStateException("Only the organiser can rate contributions.");
        }
        if (project.getStatus() != ProjectStatus.COMPLETED) {
            throw new IllegalStateException("Contributions can be rated once the cleanup is complete.");
        }

        ProjectParticipant participant = participantRepository.findById(participantId)
                .filter(p -> Objects.equals(p.getProject().getId(), project.getId()))
                .orElseThrow(() -> new NotFoundException("That person is not part of this cleanup."));

        boolean firstRating = participant.getContributionMark() == null;
        participant.setContributionMark(mark);
        participantRepository.saveAndFlush(participant);

        if (firstRating) {
            alertService.send(participant.getUser(), AlertType.PROJECT_UPDATE,
                    "Your contribution was rated",
                    organiser.getFullName() + " rated your part in " + project.getTitle() + " " + mark
                            + " out of 5. It now shows on your profile.",
                    null, project.getId(), null);
        }

        return toResponse(project, organiser);
    }

    /** Module 7 — progress evidence, completion percentage and recorded outcome. */
    @Transactional
    public ProjectResponse addUpdate(Long projectId, ProjectUpdateRequest request, User author) {
        CleanupProject project = get(projectId);

        if (!Objects.equals(project.getOwner().getId(), author.getId())
                && author.getRole() != Role.ADMIN
                && author.getRole() != Role.AUTHORITY) {
            throw new IllegalStateException("Only the project owner can post progress updates.");
        }

        ProjectUpdate update = new ProjectUpdate();
        update.setProject(project);
        update.setAuthor(author);
        update.setStage(request.stage());
        update.setNote(request.note());
        update.setImageUrl(request.imageUrl());
        update.setCompletionPercentage(request.completionPercentage());
        project.getUpdates().add(update);

        if (request.completionPercentage() != null) {
            project.setCompletionPercentage(request.completionPercentage());
        }
        if (request.debrisRemovedKg() != null) {
            project.setDebrisRemovedKg(request.debrisRemovedKg());
        }
        if (project.getStatus() == ProjectStatus.PLANNED) {
            project.setStatus(ProjectStatus.ACTIVE);
            project.setStartedAt(Instant.now());
        }

        if (project.getCompletionPercentage() >= 100) {
            complete(project);
        }

        return toResponse(project, author);
    }

    private void complete(CleanupProject project) {
        project.setStatus(ProjectStatus.COMPLETED);
        project.setCompletionPercentage(100);
        project.setCompletedAt(Instant.now());

        Long notifiedReporterId = null;
        PollutionReport report = project.getReport();
        if (report != null) {
            reportService.markCleaned(report);
            User reporter = report.getReporter();
            if (!Objects.equals(reporter.getId(), project.getOwner().getId())) {
                notifiedReporterId = reporter.getId();
                alertService.send(reporter, AlertType.PROJECT_UPDATE,
                        "The site you reported has been cleaned",
                        report.getReference() + " at " + report.getLocationName() + " is clean — "
                                + project.getTitle() + " is finished." + debrisSentence(project),
                        report.getId(), project.getId(), null);
            }
        }

        for (ProjectParticipant participant : project.getParticipants()) {
            DiverProfile profile = participant.getUser().getDiverProfile();
            if (profile != null) {
                profile.setCompletedProjects(profile.getCompletedProjects() + 1);
            }
            if (Objects.equals(participant.getUser().getId(), notifiedReporterId)) {
                continue;
            }
            alertService.send(participant.getUser(), AlertType.PROJECT_UPDATE,
                    "Cleanup complete",
                    project.getTitle() + " is finished. Thank you for taking part.",
                    null, project.getId(), null);
        }
    }

    private static String debrisSentence(CleanupProject project) {
        Double kg = project.getDebrisRemovedKg();
        if (kg == null) {
            return "";
        }
        String amount = kg % 1 == 0 ? String.valueOf(kg.longValue()) : String.valueOf(kg);
        return " " + amount + " kg of debris was removed.";
    }
}
