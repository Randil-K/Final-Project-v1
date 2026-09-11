# Community-Based Ocean & Coastal Cleanup Management System

Group 8 · Institute of Technology, University of Moratuwa.

A platform connecting citizens, volunteer divers, government authorities and organisations
around one loop for Sri Lanka's coastline: **report a polluted site → let the community
verify it → escalate it to an authority → clean it up and record the result.**

```
├── frontend/   React + Vite, built on the Tideline design system
└── backend/    Spring Boot 3.3 + JPA + JWT, H2 for dev and MySQL for the target deployment
```

## Run both

```bash
npm --prefix frontend install && npm --prefix frontend run dev
```

```bash
cd backend && ./mvnw spring-boot:run
```

Frontend on `http://localhost:5173`, API on `http://localhost:8080`. The frontend reads and
writes live API data — Vite proxies `/api` to the backend, so there is no CORS setup in
development. Start the backend first; every seeded account uses `password123`, and the login
screen lists them.

See [frontend/README.md](frontend/README.md) and [backend/README.md](backend/README.md) for
details, demo accounts and the full endpoint list.

## Module coverage

| # | Module | Frontend | Backend |
| --- | --- | --- | --- |
| 1 | User registration & profile | yes | yes |
| 2 | Pollution reporting | yes | yes (evidence by URL, no binary upload yet) |
| 3 | Community verification & trust | yes | yes (75% threshold, configurable) |
| 4 | Admin review & moderation | yes | yes |
| 5 | Government approval workflow | yes | yes |
| 6 | Location-based alerts | yes | yes (Haversine radius + escalation steps) |
| 7 | Project progress monitoring | yes | yes |
| 8 | Diver employment & opportunities | yes | yes |
| 9 | Reporting & analytics | yes | yes |

## Still to do

- File upload for photo and video evidence — the API stores evidence as URLs today.
- Geocoding and map APIs for location validation and the pollution map.
- Test coverage, containerisation and cloud deployment.
