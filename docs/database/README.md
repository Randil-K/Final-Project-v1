# Tideline database

The MySQL 8 schema for the Community-Based Ocean & Coastal Cleanup Management System.

The database is **defined by versioned SQL migrations**, not by Hibernate. Every table, column,
index and constraint comes from a file in `backend/src/main/resources/db/migration/`, applied by
[Flyway](https://flywaydb.org/) when the application starts. Hibernate runs with
`ddl-auto: validate`, so it never changes the schema — it only refuses to start if the entities
and the migrations have drifted apart.

| File | What it is |
| --- | --- |
| `schema.sql` | The whole final schema in one file, for the report appendix. **Generated** — see [Regenerating schema.sql](#regenerating-schemasql). |
| `er-diagram.mmd` | Mermaid ER diagram of the real schema. |
| `../er-diagram.mmd` | The original design-phase diagram, kept for comparison. Differences are explained below. |
| `../../backend/database/schema-mysql.sql` | Snapshot of the old Hibernate-generated schema, before Flyway. Reference only. |

---

## Creating the database

```sql
CREATE DATABASE tideline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'tideline'@'%' IDENTIFIED BY 'a-strong-password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES
  ON tideline.* TO 'tideline'@'%';
FLUSH PRIVILEGES;
```

`CREATE`, `DROP`, `ALTER`, `INDEX` and `REFERENCES` are needed because Flyway creates the tables.
A read-only reporting user needs only `SELECT`.

Then point the app at it — the values come from the environment, never from a committed file
(see `backend/.env.example`):

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=tideline
DB_USERNAME=tideline
DB_PASSWORD=a-strong-password
```

```
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=mysql
```

Or the whole stack in Docker, which brings up MySQL 8.4 alongside the API:

```
cd backend
docker compose up --build
```

---

## How migrations run

On startup Flyway looks at `db/migration`, compares it with the `flyway_schema_history` table in
the database, and applies whatever has not been applied yet, in version order, each in order and
recorded with a checksum.

| Profile | Database | `ddl-auto` |
| --- | --- | --- |
| default (tests, `java -jar` with no profile) | in-memory H2 in MySQL mode | `validate` |
| `local` (`./mvnw spring-boot:run`) | H2 file in `backend/data/` | `validate` |
| `mysql` | MySQL 8 | `validate` |

**The same migrations run on all three.** H2 runs in MySQL compatibility mode
(`MODE=MySQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH`), so `./mvnw test` is a genuine
test of the SQL that will run against MySQL, not a separate H2-only schema.

### The three placeholders

Two column types and the table options genuinely differ between the engines, because Hibernate
itself maps them differently and `validate` checks the column type it finds. Rather than keep two
copies of every migration, the SQL uses Flyway placeholders, set per profile:

| Placeholder | MySQL | H2 |
| --- | --- | --- |
| `${tableopts}` | `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci` | *(empty)* |
| `${ts}` | `datetime(6)` | `timestamp(6) with time zone` |
| `${bool}` | `bit` | `boolean` |

Everything else — `BIGINT AUTO_INCREMENT`, `VARCHAR`, `FLOAT(53)`, `INTEGER`, foreign keys,
indexes — is written once and runs unchanged on both.

### Adopting a database Hibernate already created

`spring.flyway.baseline-on-migrate=true` is set. If Flyway starts against a database that already
has tables but no `flyway_schema_history`, it does **not** fail and does **not** drop anything.
It creates the history table, writes a single baseline row at version 1, and then applies only
V2 onwards. V1 is skipped, which is correct: V1 reproduces exactly what Hibernate's `ddl-auto`
used to create, so the existing tables already *are* V1. **No data is lost.**

> **One exception.** A MySQL database created before the project switched to VARCHAR enum columns
> still has native `enum` columns. Flyway will baseline it happily, but Hibernate `validate` will
> then fail on those columns. Run the one-off
> `ALTER TABLE <table> MODIFY <column> VARCHAR(255);` for each enum column first.

### The local H2 file must be deleted once

`backend/data/` was created by the old `ddl-auto: update` under H2's default mode. The URL now
adds `MODE=MySQL;DATABASE_TO_LOWER=TRUE`, which changes identifier casing and type mapping, so
the old file cannot be baselined safely. Delete it once:

```
rm -rf backend/data
```

The demo seeder refills it on the next start. (`backend/data/` is gitignored, and the README
already tells you to delete it to reset the demo data.)

---

## Adding a new migration

1. Create `backend/src/main/resources/db/migration/V11__short_description.sql`.
   Use the next free version number and `snake_case` in the name.
2. Write the SQL using the placeholders above, `snake_case` identifiers, and explicit constraint
   names: `fk_<table>_<column>`, `uk_<table>_<columns>`, `idx_<table>_<columns>`.
3. Update the matching JPA entity in `backend/src/main/java/lk/tideline/cleanup/model/`.
4. Run `./mvnw test`. Hibernate `validate` fails the build if the entity and the SQL disagree, so
   a mismatch cannot reach MySQL.
5. Regenerate `docs/database/schema.sql` and update `er-diagram.mmd`.

> **Never edit a migration that has been applied.** Flyway stores a checksum of each file; changing
> one makes every existing database fail validation on the next start. Add a new migration instead.

Reference data (provinces, districts) belongs in a migration. Demo accounts and demo reports stay
in `DemoDataSeeder`, which only runs against an empty database.

### Regenerating schema.sql

`schema.sql` is the migrations concatenated with the placeholders resolved to their MySQL values.
It exists for the report appendix; it is never executed. Regenerate it after adding a migration:

```bash
python - <<'PY'
import io, glob, os, re
mig = sorted(glob.glob("backend/src/main/resources/db/migration/V*.sql"),
             key=lambda p: int(re.search(r"V(\d+)__", p).group(1)))
opts = "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
out = [io.open("docs/database/schema.sql", encoding="utf-8").read().split("-- ===", 1)[0]]
for path in mig:
    body = io.open(path, encoding="utf-8").read()
    body = body.replace("${tableopts}", opts).replace("${ts}", "DATETIME(6)").replace("${bool}", "BIT")
    out += ["-- " + "=" * 85, "-- " + os.path.basename(path), "-- " + "=" * 85 + "\n", body.rstrip() + "\n\n"]
io.open("docs/database/schema.sql", "w", encoding="utf-8").write("\n".join(out))
PY
```

---

## The tables

### People

| Table | What it stores |
| --- | --- |
| `users` | Every account: citizens, divers, organisations, government officers and administrators. One table for all five roles — see [Why one users table](#why-one-users-table). `suspended` is the current state that login checks; `user_sanctions` is the history behind it. |
| `diver_profiles` | A diver's certification, experience, equipment and completed-project count. One row per diver (`uk_diver_profiles_user`). |
| `diver_preferred_regions` | The regions a diver will travel to. Element collection, so no surrogate key. |
| `account_documents` | Certificates and appointment letters uploaded at registration. Metadata here, the file itself on disk under `UPLOADS_DIR` (NF-24). |
| `account_review_actions` | Every administrator decision on a registration. `users.account_review_note` keeps only the latest reason; this keeps them all. |
| `user_sanctions` | Warnings, restrictions and reinstatements, with the reason and the report that prompted them. |
| `password_reset_tokens` | One-time reset links. Only a SHA hash of the token is stored, never the token. |

### Regions

| Table | What it stores |
| --- | --- |
| `provinces` | The nine provinces, seeded by V3. `coastal` marks the five with a coastline. |
| `districts` | The 25 districts, each belonging to a province. |

`pollution_reports`, `cleanup_projects` and `users` keep their free-text `province` column *and*
gain a `province_id` foreign key, resolved from the text on save by `RegionService`. The text is
what the API returns and what the frontend posts; the key is what region analytics join on. Text
that matches no row simply leaves the key null — nothing fails.

### Reporting and verification

| Table | What it stores |
| --- | --- |
| `pollution_reports` | The cleanup request: description, severity, map location, province/district, evidence, vote tallies, trust percentage, both review decisions, and the hazard flag. `created_at` is when it was submitted; `incident_at` is when the pollution happened (REQ-11). |
| `report_photos` | Photo and video evidence — either an uploaded file (`stored_name`, `content_type`, `size_bytes`) or an external URL. |
| `verification_votes` | Community true/false votes. `uk_verification_votes_report_voter` enforces **one vote per user per report** (REQ-17) in the database, not just in the service. |
| `report_comments` | Discussion under a report. `parent_id` is a self-reference for replies, kept one level deep. `official` marks admin and authority comments. |
| `comment_reactions` | One reaction per person per comment (`uk_comment_reactions_comment_user`). |
| `report_review_actions` | **Every** administrator and authority decision, forever. The report's own `admin_decision` / `authority_decision` columns hold only the latest. |
| `info_requests` / `info_attachments` | A reviewer asking the reporter for more detail, and the reporter's answer with photos. Visible only to reviewers and the reporter. |

### Cleanup projects

| Table | What it stores |
| --- | --- |
| `cleanup_projects` | Created automatically when the authority approves a report, owned by the reporter. Status, completion percentage, assigned resources, `minimum_participants`, and `debris_removed_kg` as the recorded outcome. |
| `project_equipment` | The equipment lines an administrator assigns. Element collection ordered by `position`, which is part of the primary key. |
| `project_participants` | Who joined, as volunteer or diver, and the owner's 1–5 contribution rating. One row per person per project. |
| `project_updates` | The progress timeline: a `BEFORE` / `DURING` / `AFTER` stage, a note and a completion percentage. An update at 100% completes the project and marks the report `CLEANED`. |
| `project_update_images` | The photos for one update. `project_updates.image_url` is kept for the original single-photo field. |

### Alerts

| Table | What it stores |
| --- | --- |
| `alert_dispatches` | One row per escalation step of a location alert: the radius, the tier (1 = 5 km, then 10 km, then 25 km) and how many people it reached. |
| `alerts` | The per-user notification inbox. For location alerts, `dispatch_id` links to the step it came from and `response` records whether the person accepted or declined (REQ-40). `report_id` and `project_id` are plain columns, not foreign keys: an alert outlives what it points at. |

### Diver opportunities

| Table | What it stores |
| --- | --- |
| `opportunities` | Work an organisation posts for divers: title, description, region, required certification, paid or not. |
| `opportunity_applications` | A diver's application. One per diver per opportunity. |

### Audit

| Table | What it stores |
| --- | --- |
| `audit_log` | One row per consequential action — who did what, to which record, and a readable summary. `actor_id` is `ON DELETE SET NULL` so deleting a user never destroys the record of what they did. |

---

## Which requirement each new table satisfies

| Table or column | Requirement |
| --- | --- |
| `report_review_actions` | **REQ-28** keep records of every administrator decision · **REQ-35** approval status and history of each request · **NF-14** authority comments and safety instructions · **NF-25** audit |
| `provinces`, `districts`, `*.province_id`, `pollution_reports.district_id` | **REQ-58** region-wise pollution trends · **REQ-59** filter by region |
| `pollution_reports.hazardous`, `.safety_note`, `.hazard_marked_by_id`, `.hazard_marked_at` | **NF-9** mark requests hazardous or unsafe · **NF-11** no cleanup of a hazardous site until authority guidance · **NF-14** safety instructions on record |
| `pollution_reports.incident_at` | **REQ-11** record the incident date and time, separately from the submission time |
| `report_photos.size_bytes` | **NF-24** file size metadata in the database, file on disk |
| `user_sanctions` | **REQ-26** manage abusive users · **REQ-27** restrict false requests · **NF-25** audit of restrictions |
| `alert_dispatches`, `alerts.dispatch_id / response / responded_at` | **REQ-39** location-based alerts · **REQ-40** responses are recorded · **REQ-41** expand the alert area when response is insufficient |
| `cleanup_projects.minimum_participants` | **REQ-41** the turnout target that decides whether the response is insufficient |
| `project_update_images` | **REQ-45** before / during / after images on a progress update |
| `account_review_actions` | **REQ-4** validate registration details · **NF-25** audit of approvals and rejections |
| `audit_log` | **NF-25** audit logs for report approval, rejection, user restriction and authority feedback |
| Indexes in V10 | **NF-6** retrieve data efficiently · **NF-32** scale with more users, requests and projects |

---

## Conventions

- **InnoDB, `utf8mb4` / `utf8mb4_unicode_ci`** on every table, so Sinhala and Tamil text and emoji
  are stored correctly.
- **`BIGINT AUTO_INCREMENT`** primary keys, matching the `Long` ids in the entities.
- **`DATETIME(6)`** for every `Instant`, **stored in UTC**. The MySQL connection sets
  `serverTimezone=Asia/Colombo` for display only; values go in as UTC.
- **`FLOAT(53)`** (MySQL `DOUBLE`) for latitude and longitude, matching the entities' `Double`.
- **Enums are `VARCHAR`.** No native `ENUM`, no `CHECK (... IN (...))` value lists. `TidelineH2Dialect`
  and `TidelineMySQLDialect` suppress Hibernate's check constraints for the same reason: adding a
  new status or alert type must never break a database that already exists.
- **`snake_case`** names throughout, with explicit constraint names: `fk_<table>_<column>`,
  `uk_<table>_<columns>`, `idx_<table>_<columns>`.
- **`ON DELETE` matches the JPA mapping.** `CASCADE` where the parent declares
  `cascade = ALL, orphanRemoval = true` (a report's photos, votes, comments, info requests; a
  project's updates, participants and equipment). `RESTRICT` on the "actor" links — `reporter_id`,
  `owner_id`, `voter_id`, `reviewer_id` — so a user with history cannot be hard-deleted.
  `SET NULL` on `audit_log.actor_id`, `user_sanctions.related_report_id`, `alerts.dispatch_id`
  and every `province_id` / `district_id`.
- **Business rules in the database where they can be.** `uk_verification_votes_report_voter`
  (one vote per user per report, REQ-17), `uk_project_participants_project_user`,
  `uk_opportunity_applications_opportunity_diver`, `uk_users_email`, and the unique references
  on reports and projects.

---

## Design decisions

### Why one `users` table

The design-phase diagram used ISA subtype tables (`VOLUNTEER_DIVER`, `ORGANIZATION`,
`GOVERNMENT_OFFICER`, …). This schema keeps one `users` table instead.

The subtype design buys strict per-role nullability — a citizen physically could not have an
`organization_name`. It costs a join on nearly every read, and a role change becomes a row move
between tables. The single table costs about six nullable columns that only apply to some roles,
and that nullability cannot be enforced by the schema.

The deciding factor is that the only genuinely rich subtype already *has* its own table:
`diver_profiles` plus `diver_preferred_regions`. What is left for organisations and officials is
three columns. Carrying four more tables and their joins to avoid three nullable columns is not a
good trade.

The rule the schema cannot enforce: `organization_name`, `organization_type` and `website_url` are
meaningful only for `ORGANIZATION`, and `organization_name` doubles as the department for
`AUTHORITY` and `ADMIN`. A `CHECK` constraint would have to list role values — exactly what the
custom dialects exist to avoid — so this is enforced in `AuthService` instead.

### Why `PROJECT_ALERT_RECIPIENT` is folded into `alerts`

The design diagram had a separate `NOTIFICATION` table and a separate `PROJECT_ALERT_RECIPIENT`
table. In the built system `alerts` **is** the notification inbox. Keeping a second recipient table
would mean writing every location alert twice, and the "accept / decline" button would read from a
different table than the one it is rendered from. `alert_dispatches` is the diagram's
`PROJECT_ALERT`; the recipient half is three columns on `alerts`.

### What was deliberately left out

| From the diagram or SRS | Why it is not here |
| --- | --- |
| `REGISTRATION_VERIFICATION` table | `users.account_status` + `users.created_at` already hold the application and its state. Only the *history* was missing, and that is `account_review_actions`. |
| `verificationDeadline` (submitted + 14 days) | Derivable from `created_at`, and nothing enforces expiry. A stored deadline with no scheduler behind it would silently lie. |
| Seven-state project lifecycle | The frontend already derives its four display states (Approved → Resources assigned → In progress → Completed) from `status` + `resources_finalized_at`. Seven database states would duplicate that and break the frontend. |
| `project_participants.status` (`CONFIRMED` / `WITHDRAWN`) | There is no withdraw feature in the API or the UI. |
| `VOLUNTEER_INTEREST`, `DIVER_EQUIPMENT`, `businessRegNum`, `dateOfBirth` | No feature collects them. `diver_profiles.equipment` is a free-text field that covers the equipment case. |
| Role names from the diagram (`VOLUNTEER_NON_DIVER`, `GOVERNMENT_OFFICER`, …) | The frontend switches on `CITIZEN` / `DIVER` / `ORGANIZATION` / `AUTHORITY` / `ADMIN` in route guards, labels and the registration form. Renaming is a frontend rewrite for no functional gain. |
| A spatial index on latitude/longitude | `AlertService` filters by Haversine distance in Java, so an index cannot turn it into a seek. A real fix needs MySQL `POINT` + `SPATIAL INDEX`, which H2 in MySQL mode cannot run, and portability across both engines was worth more. `idx_*_lat_lon` still makes the scan cheaper. |
