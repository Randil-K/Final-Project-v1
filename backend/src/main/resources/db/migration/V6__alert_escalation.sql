-- V6 — who a location alert reached, what they answered, and how far it has been widened.
--
-- REQ-39 send location-based alerts to registered users and divers near a cleanup
-- REQ-40 users respond (accept or decline) and responses are recorded
-- REQ-41 expand the alert area when the response is insufficient
--
-- One alert_dispatches row per escalation step (5 km, then 10 km, then 25 km). The alerts
-- table already *is* the per-user inbox, so the ER diagram's PROJECT_ALERT_RECIPIENT is folded
-- into it as three columns rather than duplicating every alert into a second table.

CREATE TABLE alert_dispatches (
    id                  BIGINT    NOT NULL AUTO_INCREMENT,
    report_id           BIGINT,
    project_id          BIGINT,
    radius_km           FLOAT(53) NOT NULL,
    tier                INTEGER   NOT NULL,
    recipients_notified INTEGER   NOT NULL,
    created_by_id       BIGINT,
    created_at          ${ts}     NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_alert_dispatches_report_id FOREIGN KEY (report_id) REFERENCES pollution_reports (id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_dispatches_project_id FOREIGN KEY (project_id) REFERENCES cleanup_projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_dispatches_created_by_id FOREIGN KEY (created_by_id) REFERENCES users (id) ON DELETE SET NULL
) ${tableopts};

CREATE INDEX idx_alert_dispatches_project ON alert_dispatches (project_id, tier);
CREATE INDEX idx_alert_dispatches_report ON alert_dispatches (report_id, tier);

ALTER TABLE alerts ADD COLUMN dispatch_id BIGINT;
ALTER TABLE alerts ADD COLUMN response VARCHAR(20);
ALTER TABLE alerts ADD COLUMN responded_at ${ts};
ALTER TABLE alerts ADD CONSTRAINT fk_alerts_dispatch_id FOREIGN KEY (dispatch_id) REFERENCES alert_dispatches (id) ON DELETE SET NULL;

CREATE INDEX idx_alerts_dispatch ON alerts (dispatch_id, response);
