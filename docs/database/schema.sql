-- =====================================================================================
-- Tideline — Community-Based Ocean & Coastal Cleanup Management System
-- Full MySQL 8 schema, for the report appendix.
--
-- GENERATED FILE — do not edit by hand and do not run this to upgrade a live database.
-- It is the concatenation of backend/src/main/resources/db/migration/V1..V10, with the
-- per-engine placeholders resolved to their MySQL values:
--     ${tableopts} -> ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
--     ${ts}        -> DATETIME(6)      (Instant, stored in UTC)
--     ${bool}      -> BIT
-- The database of record is built by Flyway from those migrations; see docs/database/README.md.
--
-- To create the database this schema goes into:
--     CREATE DATABASE tideline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- =====================================================================================


-- =====================================================================================
-- V1__baseline_schema.sql
-- =====================================================================================

-- V1 — baseline. Reproduces exactly the schema Hibernate's ddl-auto created before Flyway,
-- so an existing database can be adopted with spring.flyway.baseline-on-migrate=true and
-- current data maps onto it unchanged. Only the constraint names differ: Hibernate's
-- generated hashes (UK6dotkott..., FKpb2fymox...) are replaced with readable names.
--
-- Placeholders (set per profile, see application.yml / application-mysql.yml):
--   ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci  MySQL: ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ...  H2: empty
--   DATETIME(6)         MySQL: datetime(6)                                H2: timestamp(6) with time zone
--   BIT       MySQL: bit                                        H2: boolean
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
    available_for_alerts BIT      NOT NULL,
    suspended            BIT      NOT NULL,
    suspension_reason    VARCHAR(500),
    account_status       VARCHAR(255) NOT NULL,
    account_review_note  VARCHAR(500),
    organization_name    VARCHAR(255),
    organization_type    VARCHAR(255),
    avatar_stored_name   VARCHAR(80),
    website_url          VARCHAR(300),
    created_at           DATETIME(6)        NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE diver_preferred_regions (
    diver_profile_id BIGINT NOT NULL,
    region           VARCHAR(255),
    CONSTRAINT fk_diver_preferred_regions_diver_profile_id FOREIGN KEY (diver_profile_id) REFERENCES diver_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE account_documents (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    user_id       BIGINT       NOT NULL,
    original_name VARCHAR(150) NOT NULL,
    stored_name   VARCHAR(255) NOT NULL,
    content_type  VARCHAR(255) NOT NULL,
    size_bytes    BIGINT       NOT NULL,
    uploaded_at   DATETIME(6)        NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_account_documents_stored_name UNIQUE (stored_name),
    CONSTRAINT fk_account_documents_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE password_reset_tokens (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    user_id    BIGINT      NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME(6)       NOT NULL,
    used_at    DATETIME(6),
    created_at DATETIME(6)       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_password_reset_tokens_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_password_reset_tokens_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    admin_reviewed_at    DATETIME(6),
    authority_decision   VARCHAR(255),
    authority_comment    VARCHAR(1000),
    authority_officer_id BIGINT,
    escalated_at         DATETIME(6),
    decided_at           DATETIME(6),
    verified_at          DATETIME(6),
    created_at           DATETIME(6)         NOT NULL,
    updated_at           DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT uk_pollution_reports_reference UNIQUE (reference),
    CONSTRAINT fk_pollution_reports_reporter_id FOREIGN KEY (reporter_id) REFERENCES users (id),
    CONSTRAINT fk_pollution_reports_authority_officer_id FOREIGN KEY (authority_officer_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- REQ-17: one vote per user per request, enforced by uk_verification_votes_report_voter.
CREATE TABLE verification_votes (
    id         BIGINT  NOT NULL AUTO_INCREMENT,
    report_id  BIGINT  NOT NULL,
    voter_id   BIGINT  NOT NULL,
    confirmed  BIT NOT NULL,
    created_at DATETIME(6)   NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_verification_votes_report_voter UNIQUE (report_id, voter_id),
    CONSTRAINT fk_verification_votes_report_id FOREIGN KEY (report_id) REFERENCES pollution_reports (id) ON DELETE CASCADE,
    CONSTRAINT fk_verification_votes_voter_id FOREIGN KEY (voter_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE report_comments (
    id         BIGINT        NOT NULL AUTO_INCREMENT,
    report_id  BIGINT        NOT NULL,
    author_id  BIGINT        NOT NULL,
    parent_id  BIGINT,
    body       VARCHAR(1000) NOT NULL,
    official   BIT       NOT NULL,
    created_at DATETIME(6)         NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_report_comments_report_id FOREIGN KEY (report_id) REFERENCES pollution_reports (id) ON DELETE CASCADE,
    CONSTRAINT fk_report_comments_author_id FOREIGN KEY (author_id) REFERENCES users (id),
    CONSTRAINT fk_report_comments_parent_id FOREIGN KEY (parent_id) REFERENCES report_comments (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE comment_reactions (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    comment_id BIGINT      NOT NULL,
    user_id    BIGINT      NOT NULL,
    type       VARCHAR(20) NOT NULL,
    created_at DATETIME(6)       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_comment_reactions_comment_user UNIQUE (comment_id, user_id),
    CONSTRAINT fk_comment_reactions_comment_id FOREIGN KEY (comment_id) REFERENCES report_comments (id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_reactions_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE info_requests (
    id              BIGINT        NOT NULL AUTO_INCREMENT,
    report_id       BIGINT        NOT NULL,
    requested_by_id BIGINT        NOT NULL,
    message         VARCHAR(1000) NOT NULL,
    status          VARCHAR(20)   NOT NULL,
    response_text   VARCHAR(2000),
    created_at      DATETIME(6)         NOT NULL,
    responded_at    DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_info_requests_report_id FOREIGN KEY (report_id) REFERENCES pollution_reports (id) ON DELETE CASCADE,
    CONSTRAINT fk_info_requests_requested_by_id FOREIGN KEY (requested_by_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    resources_finalized_at    DATETIME(6),
    resources_finalized_by_id BIGINT,
    started_at                DATETIME(6),
    completed_at              DATETIME(6),
    created_at                DATETIME(6)         NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_cleanup_projects_reference UNIQUE (reference),
    CONSTRAINT fk_cleanup_projects_report_id FOREIGN KEY (report_id) REFERENCES pollution_reports (id),
    CONSTRAINT fk_cleanup_projects_owner_id FOREIGN KEY (owner_id) REFERENCES users (id),
    CONSTRAINT fk_cleanup_projects_resources_finalized_by_id FOREIGN KEY (resources_finalized_by_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- @ElementCollection with @OrderColumn: the position column is part of the primary key.
CREATE TABLE project_equipment (
    project_id BIGINT       NOT NULL,
    position   INTEGER      NOT NULL,
    name       VARCHAR(100) NOT NULL,
    quantity   INTEGER      NOT NULL,
    PRIMARY KEY (position, project_id),
    CONSTRAINT fk_project_equipment_project_id FOREIGN KEY (project_id) REFERENCES cleanup_projects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE project_participants (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    project_id        BIGINT       NOT NULL,
    user_id           BIGINT       NOT NULL,
    participant_role  VARCHAR(255) NOT NULL,
    contribution_mark INTEGER,
    joined_at         DATETIME(6)        NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_project_participants_project_user UNIQUE (project_id, user_id),
    CONSTRAINT fk_project_participants_project_id FOREIGN KEY (project_id) REFERENCES cleanup_projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_participants_user_id FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE project_updates (
    id                    BIGINT        NOT NULL AUTO_INCREMENT,
    project_id            BIGINT        NOT NULL,
    author_id             BIGINT,
    stage                 VARCHAR(255)  NOT NULL,
    note                  VARCHAR(1000) NOT NULL,
    image_url             VARCHAR(1000),
    completion_percentage INTEGER,
    created_at            DATETIME(6)         NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_project_updates_project_id FOREIGN KEY (project_id) REFERENCES cleanup_projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_updates_author_id FOREIGN KEY (author_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE opportunities (
    id                     BIGINT        NOT NULL AUTO_INCREMENT,
    organization_id        BIGINT        NOT NULL,
    title                  VARCHAR(255)  NOT NULL,
    description            VARCHAR(2000) NOT NULL,
    region                 VARCHAR(255)  NOT NULL,
    required_certification VARCHAR(255),
    paid                   BIT       NOT NULL,
    open                   BIT       NOT NULL,
    created_at             DATETIME(6)         NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_opportunities_organization_id FOREIGN KEY (organization_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE opportunity_applications (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    opportunity_id BIGINT       NOT NULL,
    diver_id       BIGINT       NOT NULL,
    status         VARCHAR(255) NOT NULL,
    message        VARCHAR(1000),
    created_at     DATETIME(6)        NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_opportunity_applications_opportunity_diver UNIQUE (opportunity_id, diver_id),
    CONSTRAINT fk_opportunity_applications_opportunity_id FOREIGN KEY (opportunity_id) REFERENCES opportunities (id) ON DELETE CASCADE,
    CONSTRAINT fk_opportunity_applications_diver_id FOREIGN KEY (diver_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    read_flag    BIT       NOT NULL,
    critical     BIT       NOT NULL,
    created_at   DATETIME(6)         NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_alerts_recipient_id FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================================================
-- V2__report_review_history.sql
-- =====================================================================================

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
    created_at  DATETIME(6)         NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_report_review_actions_report_id FOREIGN KEY (report_id) REFERENCES pollution_reports (id) ON DELETE CASCADE,
    CONSTRAINT fk_report_review_actions_reviewer_id FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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


-- =====================================================================================
-- V3__provinces_and_districts.sql
-- =====================================================================================

-- V3 — Sri Lanka's 9 provinces and 25 districts as reference data, for REQ-58 (region-wise
-- pollution trends) and REQ-59 (filter by region). This is reference data, not demo data, so
-- it lives in the migration rather than in DemoDataSeeder.
--
-- The existing free-text `province` columns stay exactly as they are: the frontend posts one
-- of these nine strings and AnalyticsService groups by it, so removing it would break the API.
-- The new province_id / district_id columns sit alongside it, giving joinable, typo-proof
-- rollups and a district axis that free text cannot provide.
-- `coastal` separates the coastline from inland provinces (rivers, lakes, reservoirs).

CREATE TABLE provinces (
    id      BIGINT      NOT NULL AUTO_INCREMENT,
    name    VARCHAR(60) NOT NULL,
    code    VARCHAR(10) NOT NULL,
    coastal BIT     NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_provinces_name UNIQUE (name),
    CONSTRAINT uk_provinces_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE districts (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    province_id BIGINT      NOT NULL,
    name        VARCHAR(60) NOT NULL,
    coastal     BIT     NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_districts_name UNIQUE (name),
    CONSTRAINT fk_districts_province_id FOREIGN KEY (province_id) REFERENCES provinces (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_districts_province ON districts (province_id);

-- Names match frontend/src/lib/format.js PROVINCES exactly, so the text already stored
-- and posted by the app resolves to a row.
INSERT INTO provinces (name, code, coastal) VALUES
    ('Western Province',      'WP', TRUE),
    ('Central Province',      'CP', FALSE),
    ('Southern Province',     'SP', TRUE),
    ('Northern Province',     'NP', TRUE),
    ('Eastern Province',      'EP', TRUE),
    ('North Western Province','NW', TRUE),
    ('North Central Province','NC', FALSE),
    ('Uva Province',          'UV', FALSE),
    ('Sabaragamuwa Province', 'SG', FALSE);

INSERT INTO districts (province_id, name, coastal)
SELECT p.id, d.name, d.coastal FROM (
    SELECT 'Western Province' AS province, 'Colombo'      AS name, TRUE  AS coastal UNION ALL
    SELECT 'Western Province',      'Gampaha',       TRUE  UNION ALL
    SELECT 'Western Province',      'Kalutara',      TRUE  UNION ALL
    SELECT 'Central Province',      'Kandy',         FALSE UNION ALL
    SELECT 'Central Province',      'Matale',        FALSE UNION ALL
    SELECT 'Central Province',      'Nuwara Eliya',  FALSE UNION ALL
    SELECT 'Southern Province',     'Galle',         TRUE  UNION ALL
    SELECT 'Southern Province',     'Matara',        TRUE  UNION ALL
    SELECT 'Southern Province',     'Hambantota',    TRUE  UNION ALL
    SELECT 'Northern Province',     'Jaffna',        TRUE  UNION ALL
    SELECT 'Northern Province',     'Kilinochchi',   TRUE  UNION ALL
    SELECT 'Northern Province',     'Mannar',        TRUE  UNION ALL
    SELECT 'Northern Province',     'Vavuniya',      FALSE UNION ALL
    SELECT 'Northern Province',     'Mullaitivu',    TRUE  UNION ALL
    SELECT 'Eastern Province',      'Batticaloa',    TRUE  UNION ALL
    SELECT 'Eastern Province',      'Ampara',        TRUE  UNION ALL
    SELECT 'Eastern Province',      'Trincomalee',   TRUE  UNION ALL
    SELECT 'North Western Province','Kurunegala',    FALSE UNION ALL
    SELECT 'North Western Province','Puttalam',      TRUE  UNION ALL
    SELECT 'North Central Province','Anuradhapura',  FALSE UNION ALL
    SELECT 'North Central Province','Polonnaruwa',   FALSE UNION ALL
    SELECT 'Uva Province',          'Badulla',       FALSE UNION ALL
    SELECT 'Uva Province',          'Monaragala',    FALSE UNION ALL
    SELECT 'Sabaragamuwa Province', 'Ratnapura',     FALSE UNION ALL
    SELECT 'Sabaragamuwa Province', 'Kegalle',       FALSE
) d
JOIN provinces p ON p.name = d.province;

-- Region keys on the rows that get rolled up. All nullable: a report whose province text is
-- blank or misspelt keeps working and simply falls back to the text column in analytics.
ALTER TABLE pollution_reports ADD COLUMN province_id BIGINT;
ALTER TABLE pollution_reports ADD COLUMN district_id BIGINT;
ALTER TABLE pollution_reports ADD CONSTRAINT fk_pollution_reports_province_id FOREIGN KEY (province_id) REFERENCES provinces (id) ON DELETE SET NULL;
ALTER TABLE pollution_reports ADD CONSTRAINT fk_pollution_reports_district_id FOREIGN KEY (district_id) REFERENCES districts (id) ON DELETE SET NULL;

ALTER TABLE cleanup_projects ADD COLUMN province_id BIGINT;
ALTER TABLE cleanup_projects ADD CONSTRAINT fk_cleanup_projects_province_id FOREIGN KEY (province_id) REFERENCES provinces (id) ON DELETE SET NULL;

ALTER TABLE users ADD COLUMN province_id BIGINT;
ALTER TABLE users ADD CONSTRAINT fk_users_province_id FOREIGN KEY (province_id) REFERENCES provinces (id) ON DELETE SET NULL;

-- Backfill from the free text that is already there.
UPDATE pollution_reports SET province_id = (SELECT p.id FROM provinces p WHERE p.name = pollution_reports.province) WHERE province IS NOT NULL;
UPDATE cleanup_projects  SET province_id = (SELECT p.id FROM provinces p WHERE p.name = cleanup_projects.province)  WHERE province IS NOT NULL;
UPDATE users             SET province_id = (SELECT p.id FROM provinces p WHERE p.name = users.province)             WHERE province IS NOT NULL;

-- location_name often already holds the district ("Trincomalee", "Galle"), so use it where it matches.
UPDATE pollution_reports SET district_id = (SELECT d.id FROM districts d WHERE d.name = pollution_reports.location_name) WHERE location_name IS NOT NULL;


-- =====================================================================================
-- V4__report_hazard_and_incident.sql
-- =====================================================================================

-- V4 — hazardous sites, safety guidance, and when the pollution actually happened.
--
-- NF-9  administrators can mark a request as hazardous or unsafe
-- NF-11 general users cannot organise cleanups for hazardous reports until authority
--       guidance is given — safety_note carries that guidance, and ProjectService blocks
--       joining a hazardous project while it is still null
-- NF-14 keep records of authority comments and safety instructions
-- REQ-11 record the incident date and time. created_at is the *submission* time; the SRS asks
--        for the incident's own date and time as well, which the schema never had a place for.
-- NF-24 file size validation — report_photos recorded content_type but not size.

ALTER TABLE pollution_reports ADD COLUMN incident_at DATETIME(6);
ALTER TABLE pollution_reports ADD COLUMN hazardous BIT NOT NULL DEFAULT FALSE;
ALTER TABLE pollution_reports ADD COLUMN safety_note VARCHAR(1000);
ALTER TABLE pollution_reports ADD COLUMN hazard_marked_by_id BIGINT;
ALTER TABLE pollution_reports ADD COLUMN hazard_marked_at DATETIME(6);
ALTER TABLE pollution_reports ADD CONSTRAINT fk_pollution_reports_hazard_marked_by_id FOREIGN KEY (hazard_marked_by_id) REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX idx_pollution_reports_hazardous ON pollution_reports (hazardous);

ALTER TABLE report_photos ADD COLUMN size_bytes BIGINT;


-- =====================================================================================
-- V5__user_sanctions.sql
-- =====================================================================================

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
    created_at        DATETIME(6)         NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_user_sanctions_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_sanctions_issued_by_id FOREIGN KEY (issued_by_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_user_sanctions_related_report_id FOREIGN KEY (related_report_id) REFERENCES pollution_reports (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_user_sanctions_user ON user_sanctions (user_id, created_at);


-- =====================================================================================
-- V6__alert_escalation.sql
-- =====================================================================================

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
    created_at          DATETIME(6)     NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_alert_dispatches_report_id FOREIGN KEY (report_id) REFERENCES pollution_reports (id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_dispatches_project_id FOREIGN KEY (project_id) REFERENCES cleanup_projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_alert_dispatches_created_by_id FOREIGN KEY (created_by_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_alert_dispatches_project ON alert_dispatches (project_id, tier);
CREATE INDEX idx_alert_dispatches_report ON alert_dispatches (report_id, tier);

ALTER TABLE alerts ADD COLUMN dispatch_id BIGINT;
ALTER TABLE alerts ADD COLUMN response VARCHAR(20);
ALTER TABLE alerts ADD COLUMN responded_at DATETIME(6);
ALTER TABLE alerts ADD CONSTRAINT fk_alerts_dispatch_id FOREIGN KEY (dispatch_id) REFERENCES alert_dispatches (id) ON DELETE SET NULL;

CREATE INDEX idx_alerts_dispatch ON alerts (dispatch_id, response);


-- =====================================================================================
-- V7__project_progress.sql
-- =====================================================================================

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_project_update_images_update ON project_update_images (update_id, position);

ALTER TABLE cleanup_projects ADD COLUMN minimum_participants INTEGER;


-- =====================================================================================
-- V8__account_review_history.sql
-- =====================================================================================

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
    created_at  DATETIME(6)       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_account_review_actions_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_account_review_actions_reviewer_id FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_account_review_actions_user ON account_review_actions (user_id, created_at);


-- =====================================================================================
-- V9__audit_log.sql
-- =====================================================================================

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
    created_at  DATETIME(6)        NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_audit_log_actor_id FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_audit_log_created ON audit_log (created_at);
CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log (actor_id, created_at);


-- =====================================================================================
-- V10__indexes.sql
-- =====================================================================================

-- V10 — NF-6 (retrieve data efficiently) and NF-32 (scale with more users, requests, projects).
-- Every index here backs a query a repository actually runs; nothing speculative.
-- Foreign keys already carry their own index on MySQL, so those are not repeated.
--
-- Note on (latitude, longitude): AlertService filters by Haversine distance in Java, so this
-- cannot become an index seek. It is here to make the scan of candidate users cheaper by
-- keeping the coordinates together. A real spatial index would need MySQL POINT / SPATIAL,
-- which H2 in MySQL mode cannot run, so it is deliberately left out.

-- PollutionReportRepository.search / searchIn: filter on status, order by created_at desc
CREATE INDEX idx_pollution_reports_status_created ON pollution_reports (status, created_at);
CREATE INDEX idx_pollution_reports_created ON pollution_reports (created_at);
-- countByReporterId, and the reporter's own list
CREATE INDEX idx_pollution_reports_reporter ON pollution_reports (reporter_id);
-- search(...) filters on severity, and countGroupedByProvince groups on province
CREATE INDEX idx_pollution_reports_severity ON pollution_reports (severity);
CREATE INDEX idx_pollution_reports_province ON pollution_reports (province);
-- REQ-58 / REQ-59 region rollups and filters
CREATE INDEX idx_pollution_reports_province_id ON pollution_reports (province_id);
CREATE INDEX idx_pollution_reports_district_id ON pollution_reports (district_id);
-- AlertService.notifyNearby reads every report coordinate
CREATE INDEX idx_pollution_reports_lat_lon ON pollution_reports (latitude, longitude);

-- UserRepository.findByAvailableForAlertsTrue, then a Haversine filter in Java
CREATE INDEX idx_users_available_for_alerts ON users (available_for_alerts);
CREATE INDEX idx_users_lat_lon ON users (latitude, longitude);
-- findByRole, findByAccountStatusAndRoleInOrderByCreatedAtAsc, countByRoleIn
CREATE INDEX idx_users_role_account_status ON users (role, account_status);
-- findAllByOrderByCreatedAtDesc
CREATE INDEX idx_users_created ON users (created_at);
CREATE INDEX idx_users_province_id ON users (province_id);

-- AlertRepository.countByRecipientAndReadFlagFalse and findByRecipientOrderByCreatedAtDesc
CREATE INDEX idx_alerts_recipient_read ON alerts (recipient_id, read_flag);
CREATE INDEX idx_alerts_recipient_created ON alerts (recipient_id, created_at);

-- CleanupProjectRepository: findByStatusOrderByCreatedAtDesc, countByStatus,
-- findByOwnerIdOrderByCreatedAtDesc, findFirstByReportId / existsByReportId
CREATE INDEX idx_cleanup_projects_status_created ON cleanup_projects (status, created_at);
CREATE INDEX idx_cleanup_projects_owner ON cleanup_projects (owner_id);
CREATE INDEX idx_cleanup_projects_report ON cleanup_projects (report_id);
CREATE INDEX idx_cleanup_projects_province_id ON cleanup_projects (province_id);

-- ProjectParticipantRepository.findByUser, averageMark, countByProjectAndParticipantRole
CREATE INDEX idx_project_participants_user ON project_participants (user_id);
CREATE INDEX idx_project_participants_project_role ON project_participants (project_id, participant_role);

-- The project timeline (REQ-46)
CREATE INDEX idx_project_updates_project_created ON project_updates (project_id, created_at);

-- VerificationVoteRepository.countByReportAndConfirmed, recalculated on every vote
CREATE INDEX idx_verification_votes_report_confirmed ON verification_votes (report_id, confirmed);

-- ReportCommentRepository.findByReportOrderByCreatedAtAsc, and reply threads
CREATE INDEX idx_report_comments_report_created ON report_comments (report_id, created_at);
CREATE INDEX idx_report_comments_parent ON report_comments (parent_id);

-- OpportunityRepository.findByOpenTrueOrderByCreatedAtDesc / findByOrganizationOrderByCreatedAtDesc
CREATE INDEX idx_opportunities_open_created ON opportunities (open, created_at);
CREATE INDEX idx_opportunities_organization ON opportunities (organization_id);

-- OpportunityApplicationRepository.findByDiverOrderByCreatedAtDesc / findByOpportunity
CREATE INDEX idx_opportunity_applications_diver_created ON opportunity_applications (diver_id, created_at);
CREATE INDEX idx_opportunity_applications_opportunity ON opportunity_applications (opportunity_id);

-- InfoRequestRepository.findByReportOrderByCreatedAtDesc and existsByReportAndStatus
CREATE INDEX idx_info_requests_report_created ON info_requests (report_id, created_at);
CREATE INDEX idx_info_requests_report_status ON info_requests (report_id, status);

-- PasswordResetTokenRepository.findByUserAndUsedAtIsNull
CREATE INDEX idx_password_reset_tokens_user_used ON password_reset_tokens (user_id, used_at);

