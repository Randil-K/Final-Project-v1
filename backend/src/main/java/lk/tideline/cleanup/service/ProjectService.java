package lk.tideline.cleanup.service;

import lk.tideline.cleanup.config.TidelineProperties;
import lk.tideline.cleanup.dto.ProjectDtos.CreateProjectRequest;
import lk.tideline.cleanup.dto.ProjectDtos.ProjectResponse;
import lk.tideline.cleanup.dto.ProjectDtos.ProjectUpdateRequest;
import lk.tideline.cleanup.model.*;
import lk.tideline.cleanup.repository.CleanupProjectRepository;
import lk.tideline.cleanup.repository.ProjectParticipantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
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
    public List<ProjectResponse> list(ProjectStatus status) {
        List<CleanupProject> projects = status == null
                ? projectRepository.findAllByOrderByCreatedAtDesc()
                : projectRepository.findByStatusOrderByCreatedAtDesc(status);
        return projects.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse view(Long id) {
        return toResponse(get(id));
    }

    private CleanupProject get(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Project " + id + " was not found."));
    }

    private ProjectResponse toResponse(CleanupProject project) {
        return ProjectResponse.from(project,
                participantRepository.countByProjectAndParticipantRole(project, ParticipantRole.VOLUNTEER),
                participantRepository.countByProjectAndParticipantRole(project, ParticipantRole.DIVER));
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

        if (request.reportId() != null) {
            PollutionReport report = reportService.get(request.reportId());
            if (report.getStatus() != ReportStatus.VERIFIED && report.getStatus() != ReportStatus.ESCALATED) {
                throw new IllegalStateException("A cleanup project needs a verified report.");
            }
            project.setReport(report);
            if (project.getLatitude() == null) {
                project.setLatitude(report.getLatitude());
                project.setLongitude(report.getLongitude());
            }
        }

        CleanupProject saved = projectRepository.saveAndFlush(project);
        saved.setReference("CP-" + (100 + saved.getId()));

        alertService.notifyProjectNearby(saved, properties.getAlerts().getInitialRadiusKm(),
                "New cleanup planned near " + saved.getLocationName(),
                saved.getTitle() + " — join this cleanup if you can help.");

        return toResponse(saved);
    }

    @Transactional
    public ProjectResponse join(Long projectId, User user, ParticipantRole role) {
        CleanupProject project = get(projectId);

        if (project.getStatus() == ProjectStatus.COMPLETED) {
            throw new IllegalStateException("This cleanup is already complete.");
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

        return toResponse(project);
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

        return toResponse(project);
    }

    private void complete(CleanupProject project) {
        project.setStatus(ProjectStatus.COMPLETED);
        project.setCompletionPercentage(100);
        project.setCompletedAt(Instant.now());

        if (project.getReport() != null) {
            reportService.markCleaned(project.getReport());
        }

        for (ProjectParticipant participant : project.getParticipants()) {
            DiverProfile profile = participant.getUser().getDiverProfile();
            if (profile != null) {
                profile.setCompletedProjects(profile.getCompletedProjects() + 1);
            }
            alertService.send(participant.getUser(), AlertType.PROJECT_UPDATE,
                    "Cleanup complete",
                    project.getTitle() + " is finished. Thank you for taking part.",
                    null, project.getId(), null);
        }
    }
}
