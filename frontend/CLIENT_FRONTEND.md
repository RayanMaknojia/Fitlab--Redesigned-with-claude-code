# Client frontend (Rayan Maknojia)

Progress dashboard for the logged-in client — client's own session history,
weight-over-time charts, and weekly training volume.

## Setup

This branch was cut from `frontend/trainer-view` (before it merged into
`main`), so Jiachen's shared types, shadcn UI components, and `cn()` utility
are already present — nothing needs to be duplicated or regenerated.

One new dependency was added for the charts:

```
npm install recharts
```

## Run it

```
npm install
npm run dev
```

Then visit `/client` (dashboard) and `/client/progress` (graphs). Note the
app's default landing route (`/`) currently redirects to `/trainer` —
navigate to `/client` manually.

## What's implemented

- `/client` — dashboard: stat tiles (total sessions, sessions this week,
  current streak), recent session list, personal bests
- `/client/progress` — the graphs page:
  - Weight-over-time line chart, per exercise (selectable dropdown)
  - Weekly training volume bar chart (sets × reps × weight, summed per week)
- Data comes from `src/lib/clientApi.ts`, a mock API persisted in
  localStorage — same pattern as `trainerApi.ts`. Each function is annotated
  with the REST endpoint it maps to once the backend exposes
  `WorkoutSession` / `SessionExercise` / `ExerciseTemplate` routes; swap
  function bodies for `fetch()` calls and components won't need to change.
  Run `resetMockData()` in the console to reset the demo.
- Styling reuses Jiachen's exact tokens (dark theme via the `dark` class,
  lime-400 accent, same card/badge/select treatment) so this doesn't look
  like a bolted-on second app.

## Data model note

The real backend's `types.ts` is normalized: `WorkoutSession` holds only
`{ client_id, session_date }`, and exercises live in a separate
`SessionExercise` collection joined by `session_id` + `exercise_template_id`.
The shared frontend `types/index.ts` (from Jiachen's branch, reused here)
instead embeds `exercises: Exercise[]` directly on `WorkoutSession` — closer
to what the proposal's original diagram showed. When the real backend
endpoints land, whoever wires up `clientApi.ts`'s `fetch()` calls will need
to either:
  - request an endpoint that returns the already-joined shape (session +
    its exercises together), or
  - join `WorkoutSession` + `SessionExercise` + `ExerciseTemplate` client-side

Worth a quick sync with Edison/Jiachen before that swap happens.

## For teammates

- `TODO(auth - Alex)`: the mock client identity in `ClientLayout.tsx` and
  `CLIENT_ID` in `clientApi.ts` need to come from the real auth context once
  it exists.
- This branch was cut from `frontend/trainer-view` before that PR merged, so
  this PR's diff will include Jiachen's commits until his merges into `main`
  and this branch is rebased — see PR description for details.