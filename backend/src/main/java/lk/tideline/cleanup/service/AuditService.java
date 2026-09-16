package lk.tideline.cleanup.service;

import lk.tideline.cleanup.model.AuditEntry;
import lk.tideline.cleanup.model.User;
import lk.tideline.cleanup.repository.AuditEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * NF-25 — writes the audit trail. Every reviewable action funnels through here so the log has
 * one shape: who did what, to which record, and a sentence a person can read.
 */
@Service
public class AuditService {

    /** Action names. Kept as constants so the log stays greppable and consistent. */
    public static final String REPORT_MODERATED = "REPORT_MODERATED";
    public static final String REPORT_AUTHORITY_DECISION = "REPORT_AUTHORITY_DECISION";
    public static final String REPORT_HAZARD_MARKED = "REPORT_HAZARD_MARKED";
    public static final String ACCOUNT_REVIEWED = "ACCOUNT_REVIEWED";
    public static final String USER_SUSPENDED = "USER_SUSPENDED";
    public static final String USER_REINSTATED = "USER_REINSTATED";
    public static final String PROJECT_RESOURCES_FINALIZED = "PROJECT_RESOURCES_FINALIZED";
    public static final String PROJECT_COMPLETED = "PROJECT_COMPLETED";
    public static final String ALERT_ESCALATED = "ALERT_ESCALATED";

    private final AuditEntryRepository entries;

    public AuditService(AuditEntryRepository entries) {
        this.entries = entries;
    }

    @Transactional
    public AuditEntry record(User actor, String action, String entityType, Long entityId, String summary) {
        AuditEntry entry = new AuditEntry();
        entry.setActor(actor);
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setSummary(truncate(summary));
        return entries.save(entry);
    }

    /** The column is 500 characters; an over-long comment must not lose the whole audit row. */
    private static String truncate(String summary) {
        if (summary == null) {
            return "";
        }
        return summary.length() <= 500 ? summary : summary.substring(0, 497) + "...";
    }
}
