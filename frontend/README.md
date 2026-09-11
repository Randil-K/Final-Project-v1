# Frontend — Community-Based Ocean & Coastal Cleanup Management System

React 19 + Vite, built on the **Tideline design system**. Talks to the Spring Boot API.

## Run it

Start the backend first (`cd ../backend && ./mvnw spring-boot:run`), then:

```
npm install
npm run dev
```

Opens at `http://localhost:5173`. Vite proxies `/api` to `http://localhost:8080`, so there is
no cross-origin request in development. To point at a deployed API instead, set `VITE_API_URL`.

Sign in with any seeded account — the login screen lists them, and all use `password123`.

## Structure

- `src/api/` — `client.js` (fetch wrapper, JWT header, error mapping) and `index.js` (endpoints).
- `src/auth/AuthContext.jsx` — session state; restores the user from a stored token on boot.
- `src/hooks/useApi.js` — runs a call on mount, exposes `{ data, loading, error, reload }`.
- `src/components/AsyncState.jsx` — shared loading / error / empty rendering.
- `src/components/RequireAuth.jsx` — route guard; the console additionally requires ADMIN or AUTHORITY.
- `src/design-system/` — the Tideline tokens and 21 components.
- `src/layouts/` — `VolunteerShell` (mobile PWA, bottom tabs) and `AuthorityShell` (desktop console).
- `src/pages/volunteer/` — feed, report detail with community voting, submission, alerts,
  opportunities, profile.
- `src/pages/authority/` — review queue, report review, projects, project detail, analytics.

## What the UI does against the API

| Screen | Calls |
| --- | --- |
| Landing | `GET /api/analytics/summary` (public) |
| Login / Register | `POST /api/auth/login` · `/register` |
| Feed | `GET /api/reports?status=` |
| Report detail | `GET /api/reports/{id}` · `POST /votes` · `GET`/`POST /comments` |
| Submit report | `POST /api/reports` with browser geolocation |
| Alerts | `GET /api/alerts` · `POST /api/alerts/{id}/read` |
| Opportunities | `GET /api/opportunities` · `POST /{id}/applications` · `GET /applications/mine` |
| Profile | `GET`/`PUT /api/users/me` · `PUT /api/users/me/diver-profile` |
| Review queue | `GET /api/reports` |
| Report review | moderation, escalation, authority decision, alert-radius widening |
| Projects | `GET /api/projects` · `GET /{id}` · `POST /{id}/updates` |
| Analytics | `GET /api/analytics/summary` |

The review screen shows different actions per role: an administrator gets verify / reject /
escalate / widen-alert, while an authority officer gets approve / reject on an escalated
report — mirroring the backend's permissions rather than guessing at them.

## Deviations from the vendored design system

`Input`, `Select` and `Textarea` originally read `const id = props.id || React.useId()`, which
calls a hook conditionally and is flagged as an error by this project's own linter. They now
call `useId()` unconditionally and fall back to it. Behaviour and the component API are
unchanged. Worth folding back upstream.

## Not built yet

- Binary upload for photo and video evidence — the API stores evidence as URLs, and the
  submission form currently sends placeholder URLs.
- A map view; locations are captured and displayed as coordinates.
- Creating a cleanup project from the UI (the API supports it; the console only reads projects
  and posts progress updates).
