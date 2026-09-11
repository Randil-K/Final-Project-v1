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
| `sanduni@example.lk` | DIVER |
| `kasun@example.lk` | CITIZEN |
| `hello@blueresurgence.lk` | ORGANIZATION |

## API

Authenticate with `POST /api/auth/login`, then send `Authorization: Bearer <token>`.

| Method | Path | Module | Access |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | 1 | public (citizen / diver / organisation only) |
| POST | `/api/auth/login` | 1 | public |
| GET | `/api/users/me` · PUT `/api/users/me` | 1 | authenticated |
| PUT | `/api/users/me/diver-profile` | 1 | diver |
| GET | `/api/reports` · `/api/reports/{id}` | 2 | public (read-only for non-registered users) |
| POST | `/api/reports` | 2 | authenticated |
| POST | `/api/reports/{id}/votes` | 3 | authenticated |
| GET/POST | `/api/reports/{id}/comments` | 3 | authenticated |
| POST | `/api/reports/{id}/moderation` | 4 | admin |
| POST | `/api/reports/{id}/escalation` | 5 | admin, authority |
| POST | `/api/reports/{id}/authority-decision` | 5 | authority |
| POST | `/api/reports/{id}/alert-escalation` | 6 | admin, authority |
| GET | `/api/alerts` · POST `/api/alerts/{id}/read` | 6 | authenticated |
| GET/POST | `/api/projects` | 7 | read public, create authenticated |
| POST | `/api/projects/{id}/participants` | 7 | authenticated |
| POST | `/api/projects/{id}/updates` | 7 | project owner, admin, authority |
| GET/POST | `/api/opportunities` | 8 | read authenticated, post organisation |
| POST | `/api/opportunities/{id}/applications` | 8 | diver |
| GET | `/api/analytics/summary` | 9 | public |

## How the domain rules work

- **Trust threshold.** Every vote recalculates `trustPercentage = confirm / total`. A report
  moves `PENDING → VERIFYING` on its first vote, and `VERIFYING → VERIFIED` once it reaches
  75% with at least 5 votes. Both numbers are configurable under `tideline.verification`.
- **Alert escalation.** A new report alerts available users within 5 km (Haversine distance).
  `POST /api/reports/{id}/alert-escalation` widens that to the next step — 25 km, 100 km,
  then 500 km — as the SRS requires when nobody responds.
- **Authority workflow.** Only a verified report can be escalated; only an escalated report
  can be decided by an authority officer, and a rejection requires an official comment.
- **Project completion.** A progress update at 100% closes the project, marks the linked
  report `CLEANED`, and increments each diver's completed-project count.

- **Closing the loop for reporters.** The reporter is alerted when a cleanup is planned for their
  report and again when the site is cleaned. A report gets at most one cleanup, and an escalated
  report can't get one until the authority approves it.
- **Enum columns.** Hibernate 6 can map enum fields to native `enum(...)` columns on MySQL, and
  `ddl-auto: update` won't alter them. Check the column type before adding a constant (say, a new
  `AlertType`) against an existing database — you may need a manual `ALTER TABLE`.

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

- Binary file upload — evidence is referenced by URL for now.
- Geocoding / map API integration.
- Automated tests beyond the context-load smoke test.
