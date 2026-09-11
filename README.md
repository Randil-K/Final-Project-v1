# Tideline — Community-Based Ocean & Coastal Cleanup Management System

Frontend-only prototype (React + Vite) built against the **Tideline design system**
and the Group 8 project proposal. No backend yet — all data in `src/data/mock.js`.

## Run it

```
npm install
npm run dev
```

Opens at `http://localhost:5173`. Landing page (`/`) lets you jump into either console.

## Structure

- `src/design-system/` — copied from the Tideline design system: tokens (`tokens/*.css`),
  21 components (`components/core|forms|feedback`), barrel export at `index.js`.
- `public/assets/icons/` — the 47 Lucide icons the design system uses.
- `src/layouts/` — `VolunteerShell` (mobile PWA, bottom tabs) and `AuthorityShell`
  (desktop console, sidebar) — the two consoles named in the design system readme.
- `src/pages/volunteer/` — Feed, ReportDetail (community voting), SubmitReport,
  Alerts, Opportunities, Profile. Covers modules 1, 2, 3, 6, 8.
- `src/pages/authority/` — Queue (admin moderation), ReportReview (moderation +
  government escalation), Projects, ProjectDetail (before/during/after), Analytics.
  Covers modules 4, 5, 7, 9.
- `src/pages/auth/` — Login, Register (role picker: citizen / diver / organization).

## Not built yet (out of scope for this pass)

- Spring Boot backend / MySQL — the proposal's next phase.
- Real authentication, file upload, geocoding/maps APIs.
- Government-authority-specific dashboard (proposal marks it "future scope").
- Native mobile app (proposal scopes this out entirely — mobile web only).
