package lk.tideline.cleanup.dto;

import lk.tideline.cleanup.model.AuditEntry;

import java.time.Instant;

/** NF-25 — the audit trail, read by administrators. */
public final class AuditDtos {

    private AuditDtos() {
    }

    public record AuditResponse(
            Long id,
            String action,
            String entityType,
            Long entityId,
            String summary,
            /** Null once the actor has been deleted; the entry itself survives. */
            UserDtos.UserSummary actor,
            Instant createdAt
    ) {
        public static AuditResponse from(AuditEntry entry) {
            return new AuditResponse(
                    entry.getId(),
                    entry.getAction(),
                    entry.getEntityType(),
                    entry.getEntityId(),
                    entry.getSummary(),
                    UserDtos.UserSummary.from(entry.getActor()),
                    entry.getCreatedAt());
        }
    }
}
