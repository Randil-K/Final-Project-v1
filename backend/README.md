# Backend — Community-Based Ocean & Coastal Cleanup Management System

Spring Boot 3.3 · Java 21 · Spring Data JPA · Spring Security (JWT) · H2 (dev) / MySQL (target).

## Run it

```
./mvnw spring-boot:run
```

Starts on `http://localhost:8080` with an in-memory H2 database, seeded with the same demo
content the frontend shows. H2 console: `http://localhost:8080/h2-console`
(JDBC URL `jdbc:h2:mem:tideline`, user `sa`, no password).

### Against MySQL

```
./mvnw spring-boot:run -Dspring-boot.run.profiles=mysql
```

Reads `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` (see
`application-mysql.yml`); the schema is created by Hibernate and demo seeding is off.

## Deploying

`Dockerfile` builds the production image: Maven on JDK 21, then a slim JRE 21 image running as
a non-root user with the `mysql` profile on. Any container host works — Render, Railway, Fly.io.

1. Create a MySQL 8 database. Railway and Aiven offer managed MySQL; Render's managed database
   is PostgreSQL, so pair Render with an external MySQL.
2. Deploy `backend/` as a Docker service and set the variables listed in `.env.example`:
   - `TIDELINE_JWT_SECRET` — required; the app refuses to start without it.
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` — or one `SPRING_DATASOURCE_URL`.
   - `CORS_ALLOWED_ORIGINS` — your Vercel domain(s); wildcards work for preview URLs.
   - `SEED_DEMO_DATA=true` if you want the demo accounts on a fresh database.
3. Point the host's health check at `/actuator/health/readiness`. It turns UP only once startup
   has finished, including seeding demo data — plain `/actuator/health` reports UP a moment
   earlier, while the seeder may still be running.
4. In Vercel, set `VITE_API_URL` to the backend's public URL (no trailing slash) and redeploy —
   Vite bakes it into the build, so changing it needs a new deployment.

To try the production image locally against MySQL:

```
docker compose up --build
```

The API comes up on `http://localhost:8081` with the demo data seeded.

## Demo accounts

All seeded accounts use the password `password123`.

| Email | Role |
| --- | --- |
| `admin@tideline.lk` | ADMIN |
| `officer@mepa.gov.lk` | AUTHORITY |
| `sanduni@example.lk` | DIVER (verified) |
| `kasun@example.lk` | CITIZEN — owns project CP-118 |
| `hello@blueresurgence.lk` | ORGANIZATION (verified) |
| `tharindu@example.lk` | DIVER — pending verification, can't sign in yet |
| `team@coralguard.example.org` | ORGANIZATION — pending verification, can't sign in yet |

## API

Authenticate with `POST /api/auth/login`, then send `Authorization: Bearer <token>`.

| Method | Path | Module | Access |
| --- | --- | --- | --- |
| POST | `/api/auth/register` (multipart: `data` JSON + `certificates` files) | 1 | public (citizen / diver / organisation only) |
| POST | `/api/auth/login` | 1 | public |
| GET | `/api/users/me` · PUT `/api/users/me` | 1 | authenticated |
| PUT | `/api/users/me/diver-profile` | 1 | diver |
| GET | `/api/reports` (open reports only — approved ones are projects) · `/api/reports/{id}` | 2 | public (read-only for non-registered users) |
| POST | `/api/reports` (JSON, or multipart: `data` JSON + `evidence` photos/videos) | 2 | authenticated |
| GET | `/api/reports/evidence/{file}` (uploaded evidence, supports range requests) | 2 | public |
| POST | `/api/reports/{id}/votes` | 3 | authenticated |
| GET/POST | `/api/reports/{id}/comments` (`parentId` to reply) | 3 | authenticated |
| POST | `/api/reports/{id}/comments/{commentId}/reactions` (`LIKE` / `HEART`, toggles) | 3 | authenticated |
| POST | `/api/reports/{id}/moderation` (`APPROVED` / `MORE_INFO_REQUESTED` / `REJECTED`) | 4 | admin |
| POST | `/api/reports/{id}/authority-decision` (same decisions; approval creates the project) | 5 | authority |
| POST | `/api/reports/{id}/alert-escalation` | 6 | admin, authority |
| GET | `/api/alerts` · POST `/api/alerts/{id}/read` | 6 | authenticated |
| GET | `/api/alerts/unread-count` · POST `/api/alerts/read-all` | 6 | authenticated |
| GET | `/api/projects` (`?reportId=` to find a report's project) | 7 | public |
| POST | `/api/projects/{id}/participants` | 7 | authenticated |
| POST | `/api/projects/{id}/updates` | 7 | project owner, admin, authority |
| POST | `/api/projects/{id}/participants/{participantId}/mark` | 8 | project owner, once complete |
| GET/POST | `/api/opportunities` | 8 | read authenticated, post organisation |
| POST | `/api/opportunities/{id}/applications` · GET `/applications/mine` | 8 | diver |
| GET | `/api/opportunities/{id}/applications` · POST `/applications/{id}/decision` | 8 | posting organisation, admin |
| GET | `/api/analytics/summary` | 9 | public |
| GET | `/api/admin/users?query=` · POST `/api/admin/users/{id}/suspension` | 4 | admin |
| GET | `/api/admin/verifications?status=` · POST `/api/admin/verifications/{id}` | 1 | admin |
| GET | `/api/admin/documents/{id}` (view an uploaded certificate) | 1 | admin |

## How the domain rules work

- **Trust threshold.** Every vote recalculates `trustPercentage = confirm / total`. A report
  moves `PENDING → VERIFYING` on its first vote, and `VERIFYING → VERIFIED` once it reaches
  75% with at least 5 votes. Both numbers are configurable under `tideline.verification`.
- **Alert escalation.** A new report alerts available users within 5 km (Haversine distance).
  `POST /api/reports/{id}/alert-escalation` widens that to the next step — 25 km, 100 km,
  then 500 km — as the SRS requires when nobody responds.
- **Account verification.** Citizens can sign in straight away. Volunteer divers must attach at
  least one certificate (PDF, JPG or PNG, 5 MB each, up to 5 — checked by file content, not
  extension) and organisations must give a website link. Both start as `PENDING_REVIEW`, get no
  token at registration, and can't sign in until an administrator approves them; a rejection
  needs a reason. Either decision is sent to the applicant's alerts; the frontend also pops it up
  on their next sign-in (approved) or sign-in attempt (rejected, with the reason). Files are stored under
  `UPLOADS_DIR` (default `uploads/`) with random names and served only to administrators.
- **Report review.** Each report carries an administrator decision and an authority decision:
  `PENDING`, `APPROVED`, `REJECTED` or `MORE_INFO_REQUESTED`. Administrator approval sends it to the
  government authority (`ESCALATED`). Asking for more information posts an official comment and
  alerts the reporter without changing the status. A rejection by either needs a comment.
- **Reports become projects.** When the authority approves, the report's status becomes `APPROVED`
  and a cleanup project is created automatically, owned by the person who reported the site. The
  owner gets a "Project owner" badge and the project listed on their profile. From then on it is
  only a project: report lists, filters and the `reportedSites` / status counts in analytics leave it
  out, and the project keeps a link (`reportId`) to its original evidence and approvals.
- **Project completion.** A progress update at 100% closes the project, marks the linked
  report `CLEANED`, and increments each diver's completed-project count.

- **Closing the loop for reporters.** The reporter is alerted at each review decision, when their
  report becomes a project, and when the site is cleaned.
- **Enum columns.** Hibernate 6 can map enum fields to native `enum(...)` columns on MySQL, and
  `ddl-auto: update` won't alter them. Check the column type before adding a constant (say, a new
  `AlertType`) against an existing database — you may need a manual `ALTER TABLE`.

- **Officials hear about their work.** Administrators are alerted about new accounts to verify
  and about authority decisions; authority officers when a report is sent to them.
- **Suspension.** A suspended account cannot sign in, and tokens issued before the suspension
  stop working on the next request. Administrator accounts cannot be suspended.
- **Ratings.** Once a cleanup is complete its project owner rates each participant 1–5; the average
  appears on the participant's profile and on their opportunity applications. Participant names
  are only returned to the project owner and officials.

## Layout

```
src/main/java/lk/tideline/cleanup/
├── model/       JPA entities + the domain enums
├── repository/  Spring Data repositories
├── service/     business rules (trust threshold, alert radius, project lifecycle)
├── controller/  REST API
├── dto/         request/response records, grouped per feature
├── security/    JWT issuing, filter, user details
└── config/      security, properties, error handling, demo seeding
```

## Not built yet

- Geocoding / map API integration.
