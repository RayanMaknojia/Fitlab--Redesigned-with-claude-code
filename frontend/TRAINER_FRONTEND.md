# Trainer frontend (Jiachen Sun)

Run the backend (`cd backend && npm run dev`), then `npm install && npm run dev` here and log in as a trainer.

## What's implemented

- `/trainer` — dashboard: stats, pending link requests (accept/decline incoming, see outgoing), client grid (empty by default)
- `/trainer/clients` — searchable client roster with unlink
- `/trainer/clients/:clientId` — synced client view: profile, weight-progress chart with exercise picker, per-exercise stats, and an editable workout history (log/delete sessions, add/edit/delete exercises, create templates). Reads are live from the client's data and poll every 15s, so client updates appear automatically; trainer edits write through the shared routes so the client sees them too.
- `/trainer/schedule` — month calendar of every linked client's sessions (color-coded per client). "Add session" books a session for a linked client; clicking a session sends a reschedule proposal the client must accept (dashed border = proposal pending).
- Link flow (real backend, `/api/*-link-requests`): either side sends a request by the other's email; the other side accepts or declines. Accepting writes `clients.trainer_id`; a client can have only one trainer at a time. Both sides can unlink.
- Client side: `MyTrainerCard` on the client dashboard — see/unlink your trainer, respond to trainer requests, or send a request to a trainer by email (hidden while linked).
- APIs: `src/lib/trainerApi.ts` (trainer side) and `src/lib/clientLinkApi.ts` (client side) — thin fetch wrappers over the Express endpoints, session-cookie auth.
- Types in `src/types/index.ts` mirror the backend response shapes.

## For teammates

- `/clients/:clientId` (the placeholder in `src/pages/placeholders.tsx`) is still free for the client-view team — the trainer flow now uses its own `/trainer/clients/:clientId` page instead.
- The dark theme is scoped to `TrainerLayout` (via the `dark` class), so your pages keep default styling.
- Reusable shadcn components live under `src/components/ui/`.
- Requests/links refresh by light polling (10s) — no websockets in this project.
