package lk.tideline.cleanup.dto;

import jakarta.validation.constraints.NotNull;
import lk.tideline.cleanup.model.Alert;
import lk.tideline.cleanup.model.AlertReply;
import lk.tideline.cleanup.model.AlertType;

import java.time.Instant;

public final class AlertDtos {

    private AlertDtos() {
    }

    /** REQ-40 — the recipient accepts or declines a location alert. */
    public record AlertResponseRequest(@NotNull AlertReply response) {
    }

    public record AlertResponse(
            Long id,
            AlertType type,
            String title,
            String body,
            Long reportId,
            Long projectId,
            Double radiusKm,
            boolean read,
            boolean critical,
            Instant createdAt,
            /** REQ-40 — how the recipient answered this location alert, or null if not yet. */
            AlertReply response,
            /** True when this alert asks the recipient to accept or decline. */
            boolean respondable
    ) {
        public static AlertResponse from(Alert alert) {
            return new AlertResponse(
                    alert.getId(),
                    alert.getType(),
                    alert.getTitle(),
                    alert.getBody(),
                    alert.getReportId(),
                    alert.getProjectId(),
                    alert.getRadiusKm(),
                    alert.isReadFlag(),
                    alert.isCritical(),
                    alert.getCreatedAt(),
                    alert.getResponse(),
                    alert.getDispatch() != null);
        }
    }
}
