-- V1 — baseline. Reproduces exactly the schema Hibernate's ddl-auto created before Flyway,
-- so an existing database can be adopted with spring.flyway.baseline-on-migrate=true and
-- current data maps onto it unchanged. Only the constraint names differ: Hibernate's
-- generated hashes (UK6dotkott..., FKpb2fymox...) are replaced with readable names.
--
-- Placeholders (set per profile, see application.yml / application-mysql.yml):
--   ${tableopts}  MySQL: ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ...  H2: empty
--   ${ts}         MySQL: datetime(6)                                H2: timestamp(6) with time zone
--   ${bool}       MySQL: bit                                        H2: boolean
-- Instants are stored in UTC. Enums are VARCHAR with no CHECK value list, so adding a
-- status never breaks an existing database (see TidelineH2Dialect / TidelineMySQLDialect).

CREATE TABLE users (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    full_name            VARCHAR(255) NOT NULL,
    email                VARCHAR(255) NOT NULL,
    password_hash        VARCHAR(255) NOT NULL,
    phone                VARCHAR(255),
    role                 VARCHAR(255) NOT NULL,
    province             VARCHAR(255),
    city                 VARCHAR(255),
    latitude             FLOAT(53),
    longitude            FLOAT(53),
    available_for_alerts ${bool}      NOT NULL,
    suspended            ${bool}      NOT NULL,
    suspension_reason    VARCHAR(500),
    account_status       VARCHAR(255) NOT NULL,
    account_review_note  VARCHAR(500),
    organization_name    VARCHAR(255),
    organization_type    VARCHAR(255),
    avatar_stored_name   VARCHAR(80),
    website_url          VARCHAR(300),
    created_at           ${ts}        NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
) ${tableopts};

CREATE TABLE diver_profiles (
    id                  BIGINT  NOT NULL AUTO_INCREMENT,
    user_id             BIGINT  NOT NULL,
    certification_level VARCHAR(255),
    experience_years    INTEGER,
    equipment           VARCHAR(500),
    completed_projects  INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_diver_profiles_user UNIQUE (user_id),
    CONSTRAINT fk_diver_profiles_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ${tableopts};

CREATE TABLE diver_preferred_regions (
    diver_profile_id BIGINT NOT NULL,
    region           VARCHAR(255),
    CONSTRAINT fk_diver_preferred_regions_diver_profile_id FOREIGN KEY (diver_profile_id) REFERENCES diver_profiles (id) ON DELETE CASCADE
) ${tableopts};

CREATE TABLE account_documents (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    user_id       BIGINT       NOT NULL,
    original_name VARCHAR(150) NOT NULL,
    stored_name   VARCHAR(255) NOT NULL,
    content_type  VARCHAR(255) NOT NULL,
    size_bytes    BIGINT       NOT NULL,
    uploaded_at   ${ts}        NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_account_documents_stored_name UNIQUE (stored_name),
    CONSTRAINT fk_account_documents_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ${tableopts};

CREATE TABLE password_reset_tokens (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    user_id    BIGINT      NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at ${ts}       NOT NULL,
    used_at    ${ts},
    created_at ${ts}       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_password_reset_tokens_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_password_reset_tokens_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ${tableopts};

CREATE TABLE pollution_reports (
    id                   BIGINT        NOT NULL AUTO_INCREMENT,
    reference            VARCHAR(255)  NOT NULL,
    title                VARCHAR(255)  NOT NULL,
    description          VARCHAR(2000) NOT NULL,
    severity             VARCHAR(255)  NOT NULL,
    status               VARCHAR(255)  NOT NULL,
    location_name        VARCHAR(255)  NOT NULL,
    province             VARCHAR(255),
    latitude             FLOAT(53)     NOT NULL,
    longitude            FLOAT(53)     NOT NULL,
    reporter_id          BIGINT        NOT NULL,
    confirm_votes        INTEGER       NOT NULL,
    dispute_votes        INTEGER       NOT NULL,
    trust_percentage     INTEGER       NOT NULL,
    alert_radius_km      FLOAT(53)     NOT NULL,
    admin_decision       VARCHAR(255)  NOT NULL,
    moderation_comment   VARCHAR(1000),
    admin_reviewed_at    ${ts},
    authority_decision   VARCHAR(255),
    authority_comment    VARCHAR(1000),
    authority_officer_id BIGINT,
    escalated_at         ${ts},
    decided_at           ${ts},
    verified_at          ${ts},
    created_at           ${ts}         NOT NULL,
    updated_at           ${ts},
    PRIMARY KEY (id),
    CONSTRAINT uk_pollution_reports_reference UNIQUE (reference),
    CONSTRAINT fk_pollution_reports_reporter_id FOREIGN KEY (reporter_id) REFERENCES users (id),
    CONSTRAINT fk_pollution_reports_authority_officer_id FOREIGN KEY (authority_officer_id) REFERENCES users (id)
) ${tableopts};

CREATE TABLE report_photos (
    id           BIGINT        NOT NULL AUTO_INCREMENT,
    report_id    BIGINT        NOT NULL,
    url          VARCHAR(1000) NOT NULL,
    stored_name  VARCHAR(80),
    content_type VARCHAR(100),
    caption      VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT uk_report_photos_stored_name UNIQUE (stored_name),
    CONSTRAINT fk_report_photos_report_id FOREIGN KEY (report_id) REFERENCES pollution_reports (id) ON DELETE CASCADE
) ${tableopts};

-- REQ-17: one vote per user per request, enforced by uk_verification_votes_report_voter.
CREATE TABLE verification_votes (
    id         BIGINT  NOT NULL AUTO_INCREMENT,
    report_id  BIGINT  NOT NULL,
    voter_id   BIGINT  NOT NULL,
    confirmed  ${bool} NOT NULL,
    created_at ${ts}   NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_verification_votes_report_voter UNIQUE (report_id, voter_id),
    CONSTRAINT fk_verification_votes_report_id FOREIGN KEY (report_id) REFERENCES pollution_reports (id) ON DELETE CASCADE,
    CONSTRAINT fk_verification_votes_voter_id FOREIGN KEY (voter_id) REFERENCES users (id)
) ${tableopts};

CREATE TABLE report_comments (
    id         BIGINT        NOT NULL AUTO_INCREMENT,
    report_id  BIGINT        NOT NULL,
    author_id  BIGINT        NOT NULL,
    parent_id  BIGINT,
    body       VARCHAR(1000) NOT NULL,
    official   ${bool}       NOT NULL,
    created_at ${ts}         NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_report_comments_report_id FOREIGN KEY (report_id) REFERENCES pollution_reports (id) ON DELETE CASCADE,
    CONSTRAINT fk_report_comments_author_id FOREIGN KEY (author_id) REFERENCES users (id),
    CONSTRAINT fk_report_comments_parent_id FOREIGN KEY (parent_id) REFERENCES report_comments (id) ON DELETE CASCADE
) ${tableopts};

CREATE TABLE comment_reactions (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    comment_id BIGINT      NOT NULL,
    user_id    BIGINT      NOT NULL,
    type       VARCHAR(20) NOT NULL,
    created_at ${ts}       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_comment_reactions_comment_user UNIQUE (comment_id, user_id),
    CONSTRAINT fk_comment_reactions_comment_id FOREIGN KEY (comment_id) REFERENCES report_comments (id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_reactions_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ${tableopts};

CREATE TABLE info_requests (
    id              BIGINT        NOT NULL AUTO_INCREMENT,
    report_id       BIGINT        NOT NULL,
    requested_by_id BIGINT        NOT NULL,
    message         VARCHAR(1000) NOT NULL,
    status          VARCHAR(20)   NOT NULL,
    response_text   VARCHAR(2000),
    created_at      ${ts}         NOT NULL,
    responded_at    ${ts},
    PRIMARY KEY (id),
    CONSTRAINT fk_info_requests_report_id FOREIGN KEY (report_id) REFERENCES pollution_reports (id) ON DELETE CASCADE,
    CONSTRAINT fk_info_requests_requested_by_id FOREIGN KEY (requested_by_id) REFERENCES users (id)
) ${tableopts};

CREATE TABLE info_attachments (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    request_id    BIGINT       NOT NULL,
    stored_name   VARCHAR(80)  NOT NULL,
    original_name VARCHAR(150) NOT NULL,
    content_type  VARCHAR(100) NOT NULL,
    size_bytes    BIGINT       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_info_attachments_stored_name UNIQUE (stored_name),
    CONSTRAINT fk_info_attachments_request_id FOREIGN KEY (request_id) REFERENCES info_requests (id) ON DELETE CASCADE
) ${tableopts};

CREATE TABLE cleanup_projects (
    id                        BIGINT        NOT NULL AUTO_INCREMENT,
    reference                 VARCHAR(255)  NOT NULL,
    title                     VARCHAR(255)  NOT NULL,
    description               VARCHAR(2000),
    report_id                 BIGINT,
    owner_id                  BIGINT        NOT NULL,
    status                    VARCHAR(255)  NOT NULL,
    completion_percentage     INTEGER       NOT NULL,
    location_name             VARCHAR(255)  NOT NULL,
    province                  VARCHAR(255),
    latitude                  FLOAT(53),
    longitude                 FLOAT(53),
    debris_removed_kg         FLOAT(53),
    volunteers_needed         INTEGER,
    divers_needed             INTEGER,
    resources_finalized_at    ${ts},
    resources_finalized_by_id BIGINT,
    started_at                ${ts},
    completed_at              ${ts},
    created_at                ${ts}         NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_cleanup_projects_reference UNIQUE (reference),
    CONSTRAINT fk_cleanup_projects_report_id FOREIGN KEY (report_id) REFERENCES pollution_reports (id),
    CONSTRAINT fk_cleanup_projects_owner_id FOREIGN KEY (owner_id) REFERENCES users (id),
    CONSTRAINT fk_cleanup_projects_resources_finalized_by_id FOREIGN KEY (resources_finalized_by_id) REFERENCES users (id)
) ${tableopts};

-- @ElementCollection with @OrderColumn: the position column is part of the primary key.
CREATE TABLE project_equipment (
    project_id BIGINT       NOT NULL,
    position   INTEGER      NOT NULL,
    name       VARCHAR(100) NOT NULL,
    quantity   INTEGER      NOT NULL,
    PRIMARY KEY (position, project_id),
    CONSTRAINT fk_project_equipment_project_id FOREIGN KEY (project_id) REFERENCES cleanup_projects (id) ON DELETE CASCADE
) ${tableopts};

CREATE TABLE project_participants (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    project_id        BIGINT       NOT NULL,
    user_id           BIGINT       NOT NULL,
    participant_role  VARCHAR(255) NOT NULL,
    contribution_mark INTEGER,
    joined_at         ${ts}        NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_project_participants_project_user UNIQUE (project_id, user_id),
    CONSTRAINT fk_project_participants_project_id FOREIGN KEY (project_id) REFERENCES cleanup_projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_participants_user_id FOREIGN KEY (user_id) REFERENCES users (id)
) ${tableopts};

CREATE TABLE project_updates (
    id                    BIGINT        NOT NULL AUTO_INCREMENT,
    project_id            BIGINT        NOT NULL,
    author_id             BIGINT,
    stage                 VARCHAR(255)  NOT NULL,
    note                  VARCHAR(1000) NOT NULL,
    image_url             VARCHAR(1000),
    completion_percentage INTEGER,
    created_at            ${ts}         NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_project_updates_project_id FOREIGN KEY (project_id) REFERENCES cleanup_projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_updates_author_id FOREIGN KEY (author_id) REFERENCES users (id)
) ${tableopts};

CREATE TABLE opportunities (
    id                     BIGINT        NOT NULL AUTO_INCREMENT,
    organization_id        BIGINT        NOT NULL,
    title                  VARCHAR(255)  NOT NULL,
    description            VARCHAR(2000) NOT NULL,
    region                 VARCHAR(255)  NOT NULL,
    required_certification VARCHAR(255),
    paid                   ${bool}       NOT NULL,
    open                   ${bool}       NOT NULL,
    created_at             ${ts}         NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_opportunities_organization_id FOREIGN KEY (organization_id) REFERENCES users (id)
) ${tableopts};

CREATE TABLE opportunity_applications (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    opportunity_id BIGINT       NOT NULL,
    diver_id       BIGINT       NOT NULL,
    status         VARCHAR(255) NOT NULL,
    message        VARCHAR(1000),
    created_at     ${ts}        NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_opportunity_applications_opportunity_diver UNIQUE (opportunity_id, diver_id),
    CONSTRAINT fk_opportunity_applications_opportunity_id FOREIGN KEY (opportunity_id) REFERENCES opportunities (id) ON DELETE CASCADE,
    CONSTRAINT fk_opportunity_applications_diver_id FOREIGN KEY (diver_id) REFERENCES users (id)
) ${tableopts};

-- report_id / project_id are plain columns, not foreign keys: an alert outlives the thing
-- it points at, and the UI treats a dangling id as "no link".
CREATE TABLE alerts (
    id           BIGINT        NOT NULL AUTO_INCREMENT,
    recipient_id BIGINT        NOT NULL,
    type         VARCHAR(255)  NOT NULL,
    title        VARCHAR(255)  NOT NULL,
    body         VARCHAR(1000) NOT NULL,
    report_id    BIGINT,
    project_id   BIGINT,
    radius_km    FLOAT(53),
    read_flag    ${bool}       NOT NULL,
    critical     ${bool}       NOT NULL,
    created_at   ${ts}         NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_alerts_recipient_id FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE
) ${tableopts};
