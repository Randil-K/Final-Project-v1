package lk.tideline.cleanup.model;

/** A reviewer's decision on a report — used for both the administrator and the government authority. */
public enum ReviewDecision {
    PENDING,
    APPROVED,
    REJECTED,
    MORE_INFO_REQUESTED
}
