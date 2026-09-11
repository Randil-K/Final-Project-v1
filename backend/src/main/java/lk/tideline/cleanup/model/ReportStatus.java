package lk.tideline.cleanup.model;

/**
 * Fixed report lifecycle vocabulary. A report is submitted (PENDING), put to the
 * community (VERIFYING), passes the trust threshold (VERIFIED), is sent to a
 * government authority (ESCALATED), closed by admin or authority (REJECTED),
 * or finished by a cleanup project (CLEANED).
 */
public enum ReportStatus {
    PENDING,
    VERIFYING,
    VERIFIED,
    ESCALATED,
    REJECTED,
    CLEANED
}
