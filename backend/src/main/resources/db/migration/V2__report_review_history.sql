-- V2 — every review decision on a report, kept forever.
-- REQ-28 ("keep records of every administrator decision"), REQ-35 ("approval status and history
-- of each request"), NF-14 (authority comments and safety instructions), NF-25 (audit).
-- pollution_reports.admin_decision / authority_decision stay as the *current* decision the API
-- already returns; this table is the history behind them, so an earlier MORE_INFO_REQUESTED is
-- no longer overwritten by the approval that follows it.

CREATE TABLE report_review_actions (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    report_id   BIGINT        NOT NULL,
    -- Nullable only for rows backfilled below: before this table existed the schema kept the
    -- decision but not who made it. Every row the application writes has a reviewer.
    reviewer_id BIGINT,
    stage       VARCHAR(20)   NOT NULL,
    decision    VARCHAR(30)   NOT NULL,
    comment     VARCHAR(1000),
    created_at  ${ts}         NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_report_review_actions_report_id FOREIGN KEY (report_id) REFERENCES pollution_reports (id) ON DELETE CASCADE,
    CONSTRAINT fk_report_review_actions_reviewer_id FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE SET NULL
) ${tableopts};

CREATE INDEX idx_report_review_actions_report ON report_review_actions (report_id, created_at);
CREATE INDEX idx_report_review_actions_reviewer ON report_review_actions (reviewer_id, created_at);

-- Backfill: turn the decisions already recorded on existing reports into history rows, so a
-- database adopted from ddl-auto does not start with an empty history for reports it has judged.
-- The administrator's identity was never stored, so those rows carry a NULL reviewer rather
-- than a guess; the authority officer was stored, so those rows are complete.
INSERT INTO report_review_actions (report_id, reviewer_id, stage, decision, comment, created_at)
SELECT r.id, NULL, 'ADMIN', r.admin_decision, r.moderation_comment, r.admin_reviewed_at
FROM pollution_reports r
WHERE r.admin_reviewed_at IS NOT NULL AND r.admin_decision <> 'PENDING';

INSERT INTO report_review_actions (report_id, reviewer_id, stage, decision, comment, created_at)
SELECT r.id, r.authority_officer_id, 'AUTHORITY', r.authority_decision, r.authority_comment, r.decided_at
FROM pollution_reports r
WHERE r.decided_at IS NOT NULL
  AND r.authority_decision IS NOT NULL AND r.authority_decision <> 'PENDING';
