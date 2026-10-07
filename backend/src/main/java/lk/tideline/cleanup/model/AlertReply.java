package lk.tideline.cleanup.model;

/**
 * REQ-40 - how someone answered a location alert. Named AlertReply rather than AlertResponse so
 * it does not collide with the AlertDtos.AlertResponse record that the API returns.
 */
public enum AlertReply {
    ACCEPTED,
    DECLINED
}
