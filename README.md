# FitLab

FitLab is a web app that connects personal-training **clients** and **trainers**:
- **Clients:** log workout sessions, track progress and personal bests, book sessions, and find
  a trainer.
- **Trainers:** manage linked clients, review their training, and schedule and reschedule
  sessions.
- **Admins:** moderate users and listings.
- **AI chat:** a built-in assistant answers fitness questions.

**Stack:** React + TypeScript (Vite, Tailwind, shadcn/ui) frontend, Node.js + Express backend,
MongoDB. It all runs locally with Docker Compose.

## Origin and what's in this repo

FitLab started as a **team project of 5** (Canvas group 3: Alexander Cannuli, Edison Lu, Jiachen
Sun, Rayan Maknojia, Ricky Tat). The original proposal, with the per-member feature split,
architecture and data model, is in [`docs/PROPOSAL.md`](docs/PROPOSAL.md).

This repository carries the team's full history and code, plus later work on top of it.

**From the team project:**
- **Auth and roles:** register, log in and out, password reset, client, trainer and admin roles.
- **Workout tracking:** sessions, exercises and exercise templates.
- **Trainer–client management:** link requests, viewing a client's data, schedules and
  reschedule requests.
- **Progress dashboard and charts**, plus an **AI progress recap**.
- **AI chatbot:** through the Groq API.
- **Marketplace and admin:** trainer and client listings, notifications, and an admin portal.

**Added afterwards (with Claude Code):**
- **Redesign:** a new UI across every page.
- **New pages:** a public landing page and a client Schedule page.
- **Presets:** exercise and workout presets.
- **Layout:** works on wide screens and on phones.
- **Docker Compose:** the original deployment's Compose setup, adapted to run locally, plus an
  `e2e` profile that runs the Playwright tests.
- **Testing:** a ranked test plan ([`TEST_PLAN.md`](TEST_PLAN.md)) and a Playwright end-to-end
  suite.
- **Bug fix:** a fix for a cross-user data leak.

```
frontend/   React app (served by nginx, which also proxies /api to the backend)
backend/    Express API + Jest tests
e2e/        Playwright end-to-end tests (run in Docker)
docs/       Original team proposal
```

## My contributions

**In the original team project** (my assigned feature: Progress Dashboard and Graphs)
- Built the client progress dashboard in React and TypeScript, with Recharts charts driven by
  the REST API.
- Built the workout progress graphs (such as weight progression and weekly training volume),
  the body measurement and weight progress graphs, and the weekly and monthly summaries.
- Built the AI progress recap, which summarizes a client's stats through the Groq (Llama) API
  and falls back to a locally generated summary if the service fails.
- Deployed the full stack on a GCP VM with Docker Compose (nginx reverse proxy, Express,
  MongoDB replica set) and diagnosed production-only build and networking issues.
- Worked in a team of 5 using feature branches and pull requests.

**Afterwards (done with Claude Code)**
- Directed Claude Code to redesign the frontend, and reviewed the changes before committing.
- Had it read the codebase and produce a test plan, which I reviewed and ranked by user impact
  ([`TEST_PLAN.md`](TEST_PLAN.md)).
- Built a Playwright end-to-end suite that runs in Docker, covering signup, login failures,
  logging a workout, cross-user data isolation and template deletion.
- The suite showed that the previous user's data could appear after a new login in the same
  tab. A regression test reproduces it, and the fix is verified by that test.
- Listed the known issues below with their impact and how each was verified.

Claude Code wrote most of the code for the redesign and the tests. I set the direction,
reviewed the changes, ran the suite and checked the results.

## Run the app (Docker Compose)

Requires Docker with Compose. Node and npm are **not** needed on the host.

1. Create the backend config. `backend/.env` is git-ignored and the backend won't start
   without it:

   ```sh
   cp backend/.env.example backend/.env
   ```

2. In `backend/.env`, set the values that make sense inside Compose:

   ```sh
   CONNECTION_STRING=mongodb://mongo:27017/fitlab?directConnection=true
   FRONTEND_ORIGIN=http://localhost:8080
   SESSION_SECRET=<any long random string>
   ```

   **Optional values:**
   - `GROQ_API_KEY`, for the AI chatbot and AI recap. Get a free key at https://console.groq.com.
     - **Chatbot:** without a key, the chat endpoint returns "GROQ_API_KEY is not configured."
     - **Progress recap:** without a key, it falls back to a locally generated summary that is
       labelled as such.
   - `GMAIL_USER` and `GMAIL_APP_PASSWORD`, so password-reset emails can be sent.

3. Build and start everything in the background:

   ```sh
   docker compose up -d --build
   ```

4. Open **http://localhost:8080**.

**Ports:** the API is also exposed on `localhost:3000`, and MongoDB runs inside Compose with a
named volume (`mongo-data`), so data survives restarts.

**Useful commands:**

```sh
docker compose logs -f        # follow logs (Ctrl+C stops following, not the app)
docker compose down           # stop everything (keeps the database volume)
```

## Run the end-to-end tests (Docker)

The tests run in the official Playwright image (`mcr.microsoft.com/playwright:v1.65.0-noble`),
pinned to the same version as `@playwright/test` (1.65.0). Nothing is installed on the host.

With the app running (`docker compose up -d --build`), from the repo root:

```sh
docker compose --profile e2e run --rm e2e
```

- **Profile:** the `e2e` service is behind a Compose profile, so `docker compose up` never
  starts it.
- **Target URL:** tests target `BASE_URL`, which defaults to `http://frontend`, the frontend
  container on the Compose network. Override it to test another deployment:

  ```sh
  BASE_URL=http://localhost:8080 docker compose --profile e2e run --rm e2e
  ```

- **Output:**
  - **HTML report:** `e2e/playwright-report/`.
  - **Failure traces and screenshots:** `e2e/test-results/`.
- **Test users:** each test creates its own users with a unique email
  (`e2e-<tag>-<timestamp>-<random>@example.com`). They remain in the local database.

**Result of the last run:**

```
Running 5 tests using 5 workers

  ✘  1 [chromium] › tests/05-template-delete-history.spec.ts:13:1 › deleting a template keeps it in the history of both sessions that used it (1.4s)
  ✓  5 [chromium] › tests/04-cross-user-data-leak.spec.ts:15:1 › after A logs out and B logs in, none of A's data appears (1.7s)
  ✓  2 [chromium] › tests/01-signup-login-empty-dashboard.spec.ts:5:1 › signup redirects to /login without logging in, then login shows an empty dashboard (1.8s)
  ✓  4 [chromium] › tests/02-login-failures.spec.ts:6:1 › wrong password and unknown email both show the same 'Invalid credentials' error (2.1s)
  ✓  3 [chromium] › tests/03-log-workout-dashboard.spec.ts:14:1 › logging a session with an exercise shows up on the dashboard (3.0s)

  5 passed (4.5s)
```

The ✘ on test 05 is expected. It's marked `test.fail()` for a known bug (see below), and
Playwright counts an expected failure as a pass. If that bug is fixed, Playwright reports the
test as "unexpectedly passed", which is the reminder to remove the marker.

### What the 5 tests cover, and why these

[`TEST_PLAN.md`](TEST_PLAN.md) ranks the main flows by **user impact**, meaning how many users a
failure hits and whether the damage can be undone, not by how easy they are to test. The ranking
is: logging a workout, login, signup, progress dashboard, logout, AI recap. These five tests cover
the top of that ranking and its highest-impact findings.

| Test | What it checks | Why it was chosen |
|---|---|---|
| `01-signup-login-empty-dashboard` | Signup redirects to `/login` and does **not** create a session (`/api/auth/me` returns 401, `/client` bounces to login). Logging in then shows an empty dashboard. | Signup and login gate every user. It's the plan's flows 3 → 2 → 4. |
| `02-login-failures` | A wrong password and an unknown email show the **same** "Invalid credentials" alert, and neither creates a session. | Login is rank 2. The same message prevents finding out which emails have accounts. |
| `03-log-workout-dashboard` | Creates a session through the UI, adds Back Squat 4×8 at 60 kg, then sees it in the dashboard's totals, recent sessions and personal bests. | Logging a workout is rank 1. The plan calls flows 1 → 3 its "most valuable single end-to-end test". |
| `04-cross-user-data-leak` | User A logs out and user B logs in **in the same tab**. None of A's data appears on B's dashboard or Progress page. | A privacy bug that this suite found and that was then fixed. Kept as a regression test. |
| `05-template-delete-history` | Deleting an exercise template should keep it in past sessions. Marked `test.fail()` because today it doesn't. | The plan's highest-impact item: permanent loss of training history. |

**Conventions:**
- **Locators:** `getByRole` and `getByLabel` first, `data-testid` only where there's no
  accessible role or name.
- **Waiting:** no fixed sleeps.
- **Known bugs:** marked with `test.fail()` and a comment, asserting the *correct* behaviour.

The backend also has Jest unit and integration tests in `backend/tests` (`npm test` in
`backend/`). They weren't run as part of this work, because npm isn't installed on the machine
used.

## Known issues

These are issues found in the code or in a running app that are **not fixed** yet. "How
verified" says whether each was seen running or read in the code. More detail, including other
suspected issues, is in [`TEST_PLAN.md`](TEST_PLAN.md).

| Issue | Impact | How verified |
|---|---|---|
| **Deleting a template deletes its history.** Removing an exercise template also removes every logged exercise that used it, in every session (`deleteTemplateAndAssociatedExercises`), and the Delete button has no confirmation. | One click permanently erases that exercise's history and personal bests. | Run: e2e test 05 (expected failure). Code read. |
| **No password policy.** Signup only checks that a password is present. | Accounts can be created with a 1-character password. | Code read (`authController.registerUser`). |
| **Decimal weights rejected.** `weight_in_kg` must be a whole number (`z.int()`). | A lift such as 62.5 kg can't be logged as it was done. | Code read (`workoutSessionController`). |
| **The "Add a session" dialog stays open after submit.** | Users have to close it by hand and may think the save failed. | Run: seen during e2e test 03, which presses Escape to work around it. |
| **The "View" link is nested in a button** in the workout sessions list. | Invalid HTML, and confusing for keyboard and screen-reader users. | Run: e2e accessibility snapshot (`button > link "View"`). |
| **No error handling on dashboard load.** `ClientDashboard` uses `Promise.all` without a `catch`. | If the stats request fails, the dashboard shows loading placeholders forever, with no error. | Code read. Not yet reproduced. |
| **A failed logout may leave you logged in on screen (suspected).** `logout()` awaits the API call before clearing the user. | If the request fails, the user could still appear logged in and get no feedback. | Code read (`AuthContext.logout`). Not yet reproduced. |

**Fixed:** the cross-user data leak. The workout-sessions cache wasn't cleared on login or
logout, so the next user in the same tab saw the previous user's data. It's fixed in
`AuthContext` and covered by e2e test 04.
