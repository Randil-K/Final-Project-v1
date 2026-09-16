-- V7 — before/during/after evidence and the threshold that drives alert escalation.
--
-- REQ-45 progress updates carry before, during and after images (plural: project_updates had a
--        single image_url, which cannot hold a set of photos for one stage). image_url is kept
--        so existing rows and API responses are untouched.
-- REQ-41 minimum_participants is what "response is insufficient" is measured against; without
--        a target there is nothing to decide escalation on.

CREATE TABLE project_update_images (
    id           BIGINT        NOT NULL AUTO_INCREMENT,
    update_id    BIGINT        NOT NULL,
    url          VARCHAR(1000) NOT NULL,
    stored_name  VARCHAR(80),
    content_type VARCHAR(100),
    size_bytes   BIGINT,
    position     INTEGER       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_project_update_images_stored_name UNIQUE (stored_name),
    CONSTRAINT fk_project_update_images_update_id FOREIGN KEY (update_id) REFERENCES project_updates (id) ON DELETE CASCADE
) ${tableopts};

CREATE INDEX idx_project_update_images_update ON project_update_images (update_id, position);

ALTER TABLE cleanup_projects ADD COLUMN minimum_participants INTEGER;
