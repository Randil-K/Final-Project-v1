package lk.tideline.cleanup.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lk.tideline.cleanup.model.CleanupProject;
import lk.tideline.cleanup.model.PollutionReport;
import lk.tideline.cleanup.model.ReportComment;
import lk.tideline.cleanup.model.ReportStatus;
import lk.tideline.cleanup.model.ReviewDecision;
import lk.tideline.cleanup.model.Severity;

import java.time.Instant;
import java.util.List;

public final class ReportDtos {

    private ReportDtos() {
    }

    public record CreateReportRequest(
            @NotBlank @Size(max = 120) String title,
            @NotBlank @Size(max = 2000) String description,
            @NotNull Severity severity,
            @NotBlank String locationName,
            String province,
            @NotNull Double latitude,
            @NotNull Double longitude,
            List<String> photoUrls
    ) {
    }

    public record ReportResponse(
            Long id,
            String reference,
            String title,
            String description,
            Severity severity,
            ReportStatus status,
            String locationName,
            String province,
            Double latitude,
            Double longitude,
            UserDtos.UserSummary reporter,
            List<String> photoUrls,
            int confirmVotes,
            int disputeVotes,
            int trustPercentage,
            int thresholdPercent,
            ReviewDecision adminDecision,
            String moderationComment,
            Instant adminReviewedAt,
            /** Null until an administrator sends the report to the authority. */
            ReviewDecision authorityDecision,
            String authorityComment,
            UserDtos.UserSummary authorityOfficer,
            Instant decidedAt,
            /** The project this report became once the authority approved it. */
            Long projectId,
            String projectReference,
            Instant createdAt,
            Instant verifiedAt,
            Instant escalatedAt
    ) {
        public static ReportResponse from(PollutionReport report, int thresholdPercent, CleanupProject project) {
            return new ReportResponse(
                    report.getId(),
                    report.getReference(),
                    report.getTitle(),
                    report.getDescription(),
                    report.getSeverity(),
                    report.getStatus(),
                    report.getLocationName(),
                    report.getProvince(),
                    report.getLatitude(),
                    report.getLongitude(),
                    UserDtos.UserSummary.from(report.getReporter()),
                    report.getPhotos().stream().map(photo -> photo.getUrl()).toList(),
                    report.getConfirmVotes(),
                    report.getDisputeVotes(),
                    report.getTrustPercentage(),
                    thresholdPercent,
                    report.getAdminDecision(),
                    report.getModerationComment(),
                    report.getAdminReviewedAt(),
                    report.getAuthorityDecision(),
                    report.getAuthorityComment(),
                    UserDtos.UserSummary.from(report.getAuthorityOfficer()),
                    report.getDecidedAt(),
                    project == null ? null : project.getId(),
                    project == null ? null : project.getReference(),
                    report.getCreatedAt(),
                    report.getVerifiedAt(),
                    report.getEscalatedAt());
        }
    }

    public record VoteRequest(@NotNull Boolean confirmed) {
    }

    public record CommentRequest(@NotBlank @Size(max = 1000) String body) {
    }

    public record CommentResponse(
            Long id,
            UserDtos.UserSummary author,
            String body,
            boolean official,
            Instant createdAt
    ) {
        public static CommentResponse from(ReportComment comment) {
            return new CommentResponse(
                    comment.getId(),
                    UserDtos.UserSummary.from(comment.getAuthor()),
                    comment.getBody(),
                    comment.isOfficial(),
                    comment.getCreatedAt());
        }
    }

    /** Module 4 — approve (send to the authority), reject, or ask the reporter for more information. */
    public record ModerationRequest(
            @NotNull ReviewDecision decision,
            @Size(max = 1000) String comment
    ) {
    }

    /** Module 5 — approve (creates the project), reject, or ask for more information. A comment is required. */
    public record AuthorityDecisionRequest(
            @NotNull ReviewDecision decision,
            @NotBlank @Size(max = 1000) String comment
    ) {
    }
}
