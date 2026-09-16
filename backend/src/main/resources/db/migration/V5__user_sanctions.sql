-- V5 — the warning and restriction history behind users.suspended.
--
-- REQ-26 manage abusive users
-- REQ-27 restrict or remove false requests
-- NF-25  audit log for user restriction
--
-- users.suspended stays as the current-state flag that login checks on every request; this
-- table is why it holds that value, and it keeps the reason of a lifted suspension on record.
-- REINSTATEMENT is an addition to the ER diagram's WARNING / RESTRICTION, so undoing a
-- restriction is recorded rather than erasing the row that imposed it.

CREATE TABLE user_sanctions (
    id                BIGINT        NOT NULL AUTO_INCREMENT,
    user_id           BIGINT        NOT NULL,
    issued_by_id      BIGINT,
    type              VARCHAR(20)   NOT NULL,
    reason            VARCHAR(1000) NOT NULL,
    related_report_id BIGINT,
    created_at        ${ts}         NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_user_sanctions_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_sanctions_issued_by_id FOREIGN KEY (issued_by_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_user_sanctions_related_report_id FOREIGN KEY (related_report_id) REFERENCES pollution_reports (id) ON DELETE SET NULL
) ${tableopts};

CREATE INDEX idx_user_sanctions_user ON user_sanctions (user_id, created_at);
