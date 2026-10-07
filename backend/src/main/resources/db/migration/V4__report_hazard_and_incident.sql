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

ALTER TABLE pollution_reports ADD COLUMN incident_at ${ts};
ALTER TABLE pollution_reports ADD COLUMN hazardous ${bool} NOT NULL DEFAULT FALSE;
ALTER TABLE pollution_reports ADD COLUMN safety_note VARCHAR(1000);
ALTER TABLE pollution_reports ADD COLUMN hazard_marked_by_id BIGINT;
ALTER TABLE pollution_reports ADD COLUMN hazard_marked_at ${ts};
ALTER TABLE pollution_reports ADD CONSTRAINT fk_pollution_reports_hazard_marked_by_id FOREIGN KEY (hazard_marked_by_id) REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX idx_pollution_reports_hazardous ON pollution_reports (hazardous);

ALTER TABLE report_photos ADD COLUMN size_bytes BIGINT;
