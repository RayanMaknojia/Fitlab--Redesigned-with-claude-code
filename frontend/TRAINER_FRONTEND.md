# Trainer frontend (Jiachen Sun)

Run `npm install && npm run dev`, open `/trainer`.

## What's implemented

- `/trainer` — dashboard: stats, pending link requests, client grid (empty by default)
- `/trainer/clients` — searchable client roster
- `/trainer/schedule` — month calendar of training sessions (time + client name, color-coded per client). Clicking a session opens a reschedule request form; submitting stores a pending `RescheduleRequest` in the mock API — the client-approval/backend flow is left for later.
- Link-client flow: dialog → send request by email → client accepts → card appears. Accept/decline works for incoming requests too.
- Data comes from `src/lib/trainerApi.ts`, a mock API persisted in localStorage. Each function is annotated with the REST endpoint it maps to — swap bodies for `fetch()` when the backend is ready; components won't change. Run `resetMockData()` in the console to reset the demo.
- Types in `src/types/index.ts` mirror the DB entities in the root README.

## For teammates

- `/login` and `/clients/:clientId` are placeholders in `src/pages/placeholders.tsx` — replace them with your pages in `src/App.tsx`. Clicking a client card navigates to `/clients/:clientId`.
- The dark theme is scoped to `TrainerLayout` (via the `dark` class), so your pages keep default styling.
- Reusable shadcn components added under `src/components/ui/`: card, badge, avatar, dialog, input, label, separator, dropdown-menu.
- `react-router-dom` v7 was added as a dependency.
- The mock trainer identity in `TrainerLayout.tsx` is marked `TODO(auth - Alex)`.
