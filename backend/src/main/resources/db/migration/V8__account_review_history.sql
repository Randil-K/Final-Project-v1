-- V8 — every decision on a registration application.
--
-- REQ-4 validate registration details; NF-25 audit log for approval and rejection.
-- The ER diagram's REGISTRATION_VERIFICATION is not reproduced: users.account_status plus
-- users.created_at already hold the application and its current state, so a second table would
-- only restate them. This is the diagram's REGISTRATION_REVIEW_ACTION — the part that is
-- genuinely missing, because users.account_review_note keeps only the most recent reason.

CREATE TABLE account_review_actions (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    user_id     BIGINT      NOT NULL,
    reviewer_id BIGINT,
    decision    VARCHAR(20) NOT NULL,
    reason      VARCHAR(500),
    created_at  ${ts}       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_account_review_actions_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_account_review_actions_reviewer_id FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE SET NULL
) ${tableopts};

CREATE INDEX idx_account_review_actions_user ON account_review_actions (user_id, created_at);
