-- V9 — NF-25: audit logs for report approval, rejection, user restriction and authority feedback.
--
-- One row per consequential action, written by AuditService. Deliberately generic (action +
-- entity_type + entity_id + summary) so a new reviewable action needs no schema change.
-- actor_id is ON DELETE SET NULL: removing a user must never destroy the record of what they did.

CREATE TABLE audit_log (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    actor_id    BIGINT,
    action      VARCHAR(60)  NOT NULL,
    entity_type VARCHAR(40)  NOT NULL,
    entity_id   BIGINT,
    summary     VARCHAR(500) NOT NULL,
    created_at  ${ts}        NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_audit_log_actor_id FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL
) ${tableopts};

CREATE INDEX idx_audit_log_created ON audit_log (created_at);
CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log (actor_id, created_at);
