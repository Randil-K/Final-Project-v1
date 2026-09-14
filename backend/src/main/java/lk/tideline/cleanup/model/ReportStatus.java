package lk.tideline.cleanup.model;

/**
 * Report lifecycle. A report is submitted (PENDING), put to the community (VERIFYING), passes the
 * trust threshold (VERIFIED), is approved by an administrator and sent to the government authority
 * (ESCALATED), and approved there (APPROVED) — at which point it has become a cleanup project.
 * It can be closed along the way (REJECTED), and ends CLEANED when its project is complete.
 */
public enum ReportStatus {
    PENDING,
    VERIFYING,
    VERIFIED,
    ESCALATED,
    APPROVED,
    REJECTED,
    CLEANED
}
