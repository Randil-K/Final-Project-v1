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
    coastal ${bool}     NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_provinces_name UNIQUE (name),
    CONSTRAINT uk_provinces_code UNIQUE (code)
) ${tableopts};

CREATE TABLE districts (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    province_id BIGINT      NOT NULL,
    name        VARCHAR(60) NOT NULL,
    coastal     ${bool}     NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_districts_name UNIQUE (name),
    CONSTRAINT fk_districts_province_id FOREIGN KEY (province_id) REFERENCES provinces (id)
) ${tableopts};

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
