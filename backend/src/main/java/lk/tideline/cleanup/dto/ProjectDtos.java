package lk.tideline.cleanup.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lk.tideline.cleanup.model.CleanupProject;
import lk.tideline.cleanup.model.ParticipantRole;
import lk.tideline.cleanup.model.ProjectStatus;
import lk.tideline.cleanup.model.ProjectUpdate;
import lk.tideline.cleanup.model.UpdateStage;

import java.time.Instant;
import java.util.List;

public final class ProjectDtos {

    private ProjectDtos() {
    }

    public record CreateProjectRequest(
            @NotBlank @Size(max = 120) String title,
            @Size(max = 2000) String description,
            Long reportId,
            @NotBlank String locationName,
            String province,
            Double latitude,
            Double longitude
    ) {
    }

    public record ProjectResponse(
            Long id,
            String reference,
            String title,
            String description,
            ProjectStatus status,
            int completionPercentage,
            String locationName,
            String province,
            Double latitude,
            Double longitude,
            Double debrisRemovedKg,
            Long reportId,
            UserDtos.UserSummary owner,
            long volunteerCount,
            long diverCount,
            List<ProjectUpdateResponse> updates,
            Instant startedAt,
            Instant completedAt,
            Instant createdAt,
            /** Whether the signed-in viewer has joined; null for anonymous viewers. */
            Boolean joined
    ) {
        public static ProjectResponse from(CleanupProject project, long volunteers, long divers, Boolean joined) {
            return new ProjectResponse(
                    project.getId(),
                    project.getReference(),
                    project.getTitle(),
                    project.getDescription(),
                    project.getStatus(),
                    project.getCompletionPercentage(),
                    project.getLocationName(),
                    project.getProvince(),
                    project.getLatitude(),
                    project.getLongitude(),
                    project.getDebrisRemovedKg(),
                    project.getReport() == null ? null : project.getReport().getId(),
                    UserDtos.UserSummary.from(project.getOwner()),
                    volunteers,
                    divers,
                    project.getUpdates().stream()
                            .sorted((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                            .map(ProjectUpdateResponse::from)
                            .toList(),
                    project.getStartedAt(),
                    project.getCompletedAt(),
                    project.getCreatedAt(),
                    joined);
        }
    }

    public record ProjectUpdateRequest(
            @NotNull UpdateStage stage,
            @NotBlank @Size(max = 1000) String note,
            String imageUrl,
            @Min(0) @Max(100) Integer completionPercentage,
            Double debrisRemovedKg
    ) {
    }

    public record ProjectUpdateResponse(
            Long id,
            UpdateStage stage,
            String note,
            String imageUrl,
            Integer completionPercentage,
            UserDtos.UserSummary author,
            Instant createdAt
    ) {
        public static ProjectUpdateResponse from(ProjectUpdate update) {
            return new ProjectUpdateResponse(
                    update.getId(),
                    update.getStage(),
                    update.getNote(),
                    update.getImageUrl(),
                    update.getCompletionPercentage(),
                    UserDtos.UserSummary.from(update.getAuthor()),
                    update.getCreatedAt());
        }
    }

    public record JoinProjectRequest(ParticipantRole participantRole) {
    }
}
