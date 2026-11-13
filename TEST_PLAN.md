# FitLab test plan: main user flows

Scope: the six client-facing flows below, traced through the frontend (`frontend/src`) and the
Express routes and controllers (`backend/`). This is a plan only. No tests are written yet.

**How flows are ranked:** by **user impact**, meaning how many users a failure hits, how badly, and
whether the damage can be undone. Ease of testing doesn't count. Permanent data loss ranks above an
outage, and an outage of a daily action ranks above an outage of a one-time one.

**Labels used below:**
- **Confirmed in code:** the behavior is visible in the source today. A test should pin it down, and
  most of these need a product decision or a fix.
- **Verify:** a likely risk that needs a test to confirm.

| Rank | Flow | Why it ranks here |
|---|---|---|
| 1 | Logging a workout | It's the core action, done several times a week. Some failures **permanently destroy training history**. |
| 2 | Login | If it fails, 100% of returning users are locked out. It's also where most security risk sits. |
| 3 | Signup | If it fails, no new users get in. It's one-time per user, so it reaches fewer people than login. |
| 4 | Progress dashboard | Wrong numbers erode trust in the whole app, but they're recoverable, because the data underneath is fine. |
| 5 | Logout | Matters mostly on shared devices. It's rarely used, and the session expires anyway (3 h rolling). |
| 6 | AI progress recap | Optional and on-demand, with a built-in local fallback when the AI is down. |

---

## 1. Logging a workout

**Code path:**
- **Frontend:** `pages/client/ClientSessions.tsx` → `pages/client/SessionPage.tsx` →
  `components/client/templates/AddExerciseDialog.tsx`, plus templates in
  `pages/client/ClientExerciseTemplates.tsx`.
- **API calls:** `lib/clientApi.ts`.
- **Backend:** `routes/workoutSessions.ts`, `routes/exerciseTemplates.ts`,
  `controllers/workoutSessionController.ts`, `controllers/exerciseTemplateController.ts`,
  `middleware/requireWorkoutSessionAccess.ts`, `middleware/requireClientAccess.ts`.

**Happy path**
1. **Create a session:** client creates a session with a date
   (`POST /api/clients/:clientId/workout-sessions`), and it appears in the list.
2. **Open it:** client opens the session (`GET /api/workout-sessions/:id` and `/exercises`).
3. **Add an exercise from a template:** the client picks a template, enters sets, reps and kg, and
   saves (`POST /api/workout-sessions/:id/exercises`). The row shows "N sets, N reps, N kg".
4. **Add a suggested exercise:** the client picks a popular exercise they don't own. The template is
   created first, then the exercise is logged, and the template appears on the Templates page.
5. **Add a full workout preset:** the client logs a preset such as Chest Day. Every exercise is
   logged with its default sets × reps, and missing templates are created exactly once.
6. **Edit and delete:** the client edits sets, reps or kg on an exercise (`PUT .../exercises/:id`)
   and deletes one (`DELETE`).
7. **Dashboard updates:** the new session shows up in recent sessions, stats and personal bests
   without a manual refresh, because `clearSessionsCache()` runs on mutation.

**Edge cases**
- **Session dates:**
  - empty `datetime-local`, which should give a 400 "Invalid date." and a readable error;
  - a date in the future;
  - a date years in the past;
  - two sessions at the same time.
- **Number limits:**
  - sets or reps of 0, negative, decimal (`3.5`) or huge (`100000`);
  - weight left empty (should default to 0);
  - **weight with decimals such as `62.5` kg:** the backend's `z.int()` rejects it.
- **Template names:**
  - a template whose name only differs by case or spaces ("back squat " vs "Back Squat"); the
    frontend de-duplicates, but the backend allows duplicates;
  - a template name of only spaces, or a very long name.
- **Presets:**
  - adding a preset when some of its exercises already exist as templates;
  - adding the same preset twice to one session (should log twice, with no extra templates).
- **Sessions with no exercises:** they count in "total sessions". Is that intended?
- **Renaming a template:** this changes the name shown on **all past** exercises that use it.
- **Session ordering:** after an add, the new session is appended to the end of the list, not
  sorted by date.

**Failure modes**
- **Confirmed in code: deleting a template deletes all its logged exercises.**
  - **Mechanism:** `deleteTemplateAndAssociatedExercises` removes every session exercise that uses
    the template, across all sessions, and the Templates page's Delete button has no confirmation.
    One mis-click erases that exercise from the client's whole history, personal bests included.
  - **Severity:** highest-impact item in this plan.
  - **Test:** delete a template that's used in two sessions; both sessions lose the exercise.
- **Confirmed in code: deleting a session has no confirmation** in `ClientSessions.tsx`. It also
  deletes all of that session's exercises (a transaction in `deleteSessionById`).
- **Preset partial failure (verify):** a network or server error halfway through a multi-exercise
  preset leaves some exercises logged and some not. The UI keeps the ones that succeeded and shows
  the error. Confirm nothing is duplicated if the user retries.
- **Expired session cookie mid-logging:** the request returns 401. Verify the user sees a clear
  message or gets sent to login, and that whatever they typed isn't silently lost.
- **Access control (verify via middleware tests):**
  - client A must get 403 or 404 on client B's session, exercise or template IDs;
  - a trainer may only access linked clients;
  - adding an exercise with **another client's template ID** must be rejected (the controller
    checks `template.client_id` against `session.client_id`).
- **Malformed input:** invalid ObjectIds in the URL should return 400, not 500.
- **Database or transaction failure** during a delete: no half-deleted state.

---

## 2. Login

**Code path:**
- **Frontend:** `pages/LoginPage.tsx`, `context/AuthContext.tsx`, `components/RequireAuth.tsx`.
- **Backend:** `POST /api/auth/login` and `GET /api/auth/me` in `controllers/authController.ts`,
  with the express-session plus connect-mongo setup in `server.ts`.

**Happy path**
1. **Log in:** a valid email and password returns 200, sets a session cookie, and redirects to
   `/`, which sends each role to its home (`/client`, `/trainer` or `/admin`).
2. **Reload:** after a page reload, `GET /auth/me` restores the user and they stay logged in.
3. **Remember me:** the cookie lasts 7 days instead of the 3-hour rolling session.

**Edge cases**
- **Email format:** uppercase or padded email (`" Rayan@X.com "`) should still match, because
  the backend trims and lower-cases it.
- **Remember me unchecked:** the session should expire about 3 h after the *last* request
  (`rolling: true`).
- **Already logged in:**
  - visiting `/login` while logged in;
  - visiting another role's area (a client at `/trainer`) should redirect to `/`.
- **Deep link while logged out:** for example `/client/schedule`, which redirects to `/login`.
  Note that after logging in the user lands on `/`, not the page they asked for.
- **Two tabs:** logging in or out in one tab affects the other.

**Failure modes**
- **Wrong password or unknown email:** both should return the same 401 "Invalid credentials", so
  the response doesn't reveal which emails have accounts.
- **Blocked account:** returns 403 "This account has been blocked." **Verify:** if an admin blocks
  a user who is *already logged in*, does their existing session keep working?
  `requireAuth` doesn't appear to re-check the blocked flag.
- **Missing fields:** returns 400.
- **Backend or Mongo down:** returns 500 "Failed to log in". The form should show the error, not
  hang.
- **Session fixation (verify):** the login handler sets `req.session.user` **without calling
  `req.session.regenerate()`**, so the session ID doesn't change at login. This is a security
  test, not a functional one.
- **No brute-force protection (verify):** there's no rate limit on `/auth/login`. Only
  forgot-password, reset-password and chat are rate-limited.
- **Cookie not sent:** if the frontend and API are served from different origins, the
  `credentials: "include"` and CORS `FRONTEND_ORIGIN` settings must line up. Through Docker and
  nginx they share one origin.

---

## 3. Signup

**Code path:**
- **Frontend:** `pages/RegisterPage.tsx`.
- **Backend:** `POST /api/auth/register` in `controllers/authController.ts`.

**Happy path**
1. **Submit:** name, email, password and role (client or trainer) return 201, and the user is
   redirected to `/login`. Signup does not log you in.
2. **First login:** logging in with the new account lands on the right role's dashboard, which is
   empty (no sessions, no trainer).

**Edge cases**
- **Email already in use:** returns 400 "Email already in use.", including the same email in
  different case or with spaces.
- **Simultaneous signups:** two signups with the same email at once should be caught by the unique
  index, giving 400 rather than 500.
- **Names:** a name with only spaces, emoji or non-Latin characters, or a very long name.
- **Role field:**
  - a role other than client or trainer (for example `"admin"` sent through the API) must give 400;
  - **verify that nobody can self-register as admin.**
- **Unusual email addresses:** plus-addressing (`a+b@x.com`) and very long addresses.

**Failure modes**
- **Confirmed in code: no password strength rule.** The backend only checks that the password is
  present, so `"a"` is accepted. This needs a product decision, then a test.
- **Bad email format:** returns 400 "Invalid email format".
- **Validation messages:** a 400 must be shown on the form, not just logged to the console.
- **Database down:** returns 500 "Failed to register user".
- **No confirmation:** after a successful signup the user is silently redirected to `/login` with no
  "account created" message. That's a UX gap worth an end-to-end assertion.

---

## 4. Progress dashboard

**Code path:**
- **Frontend:** `pages/client/ClientDashboard.tsx`, `components/client/dashboard/WeekStrip.tsx`,
  `StatPanel.tsx`, `MyTrainerCard.tsx`, and `pages/client/ClientProgress.tsx` (charts).
- **Calculations:** done in the frontend in `lib/clientApi.ts` (`getStats`, `getWeeklyVolume`,
  `getWeightProgress`), all from one `GET /api/me/workout-sessions` that is cached.

**Happy path**
1. **Numbers match the data:**
   - **Sessions this week:** sessions in the rolling last 7 days.
   - **Current streak:** consecutive Monday-start weeks with at least one session, counting back
     from this week.
   - **Total sessions.**
   - **Personal bests:** top 5 by heaviest weight.
   - **Recent sessions:** the latest 5.
2. **7-day strip:** it fills in the days that have a session, and always agrees with "Sessions this
   week".
3. **Progress page:** the charts (weight over time per exercise, weekly volume) match the logged
   data.

**Edge cases**
- **Brand-new user:** zero sessions shows every empty state ("0", "No sessions logged yet") with no
  crash and no `NaN`.
- **Sessions this week:**
  - **Rolling window:** it is a *rolling 7 days*, not a calendar week. A session 6 days ago counts
    even if it was last Monday.
  - **Future-dated sessions:** these count as "this week", because `now - future < 7 days` is true.
    **Confirmed in code**; needs a decision.
- **Streak:**
  - **Timezone and DST:** keys are built from local midnight converted to UTC ISO strings
    (`startOfWeek` uses `toISOString()`). **Verify:** the streak still counts correctly across a
    daylight-saving change, and for a session logged at 23:30 local time.
  - **Weekly vs daily:** the streak counts weeks, not days. A user training only on Sundays should
    keep their streak.
- **Personal bests:**
  - **Bodyweight-only exercises (0 kg):** they appear as "0 kg × reps" in personal bests.
  - **Ties:** two sets at the same weight are tied, and reps are ignored, so the first one seen wins.
  - **Same exercise renamed** shows as one entry, because the name comes from the template.
- **Lots of history:** the dashboard downloads *all* sessions on every visit, with no paging.
  Check load time with a heavy user (for example 500 sessions).
- **Stale data:** logging a session in another tab doesn't update the dashboard until a navigation
  clears the cache.

**Failure modes**
- **API failure:** if `getStats` or `getMySessions` fails, the dashboard's `Promise.all` has
  **no catch**, so it stays on loading skeletons forever with no error message. **Confirmed in
  code**; needs a test and a fix.
- **Template deleted:** deleting a template removes its exercises (see flow 1), so personal bests
  and volume change backwards. That's data loss surfacing as "my numbers went down".
- **Notification polling:** polling runs every 10 s and keeps going on a 401 after the session
  expires. Verify it doesn't spam errors.

---

## 5. Logout

**Code path:**
- **Frontend:** the user card in `components/AppShell.tsx`, which calls `logout()` in
  `context/AuthContext.tsx`.
- **Backend:** `POST /api/auth/logout` in `controllers/authController.ts`, which calls
  `req.session.destroy`.

**Happy path**
1. **Log out:** clicking log out destroys the server session, clears user state, and the
   protected route redirects to `/login`.
2. **Back button:** after logout, pressing Back doesn't show protected data, and API calls return
   401.

**Edge cases**
- **Second tab:** logging out in one tab leaves the other tab showing stale UI until its next API
  call, which then gets a 401.
- **Mobile drawer:** logging out from the mobile navigation drawer, not just the desktop sidebar.
- **Already expired:** logging out when the session has already expired.

**Failure modes**
- **Confirmed in code: a failed logout leaves you logged in on screen.** In `AuthContext.logout()`,
  if `api.logout()` throws (network error, or 500 "Failed to log out"), `setUser(null)` never runs.
  The user stays logged in on screen with no feedback.
- **Old cookie:** the session cookie stays in the browser after logout, though it points to a
  destroyed session. Verify it can't be reused.
- **Chat history:** logging out mid-chat. Verify chat history isn't visible to the next person on
  the same device.

---

## 6. AI progress recap

**Code path:**
- **Frontend:** `components/client/ProgressRecapCard.tsx` on `/client/progress`, using
  `lib/recapApi.ts`.
- **Backend:** `POST /api/chat` in `controllers/chatController.ts`, then
  `services/aiService.ts`, which calls Groq. Rate-limited by `middleware/chatRateLimit.ts` (10
  requests/min per user, kept in memory).

**Happy path**
1. **Generate:** the client clicks Generate. The frontend builds a summary (totals, streak, top 3
   personal bests, 4-week volume trend) and sends it to `/api/chat`, which returns a 2–4 sentence
   recap marked as an AI recap.
2. **Regenerate:** this produces a new recap.

**Edge cases**
- **No sessions yet:** the recap should say so, without the AI inventing numbers.
- **Volume trend:** with 1 week of data, the percent change from 0 is reported as `100%`
  (`pct(0, x)`). Check the wording.
- **Made-up numbers:** the AI may invent numbers despite the prompt. Spot-check that every number
  in the recap exists in the summary.
- **Double-click:** clicking Generate repeatedly while loading.

**Failure modes**
- **No API key:** `GROQ_API_KEY` missing or a placeholder makes the backend return 500
  "GROQ_API_KEY is not configured." The frontend **silently falls back** to a local template
  recap, marked as fallback. **This is the current state of the local Docker setup.** Test that
  the fallback text is correct and clearly labelled, so users don't think it's AI.
- **Rate limits:** Groq rate limits or more than 10 requests/min give a 429 and should fall back
  cleanly. The limiter is per-process memory, so it resets when the backend restarts.
- **Bad AI response:** an invalid or revoked key, a timeout, or an empty reply returns a 502 or
  "empty AI response", which falls back.
- **Logged out:** the request returns 401. Note this is also caught and falls back, which hides
  the real problem.
- **Privacy:** the user's training data is sent to a third party (Groq). Confirm this is
  acceptable and disclosed.

---

## Existing coverage and gaps

- **Backend:** Jest with an in-memory Mongo (`backend/tests`). It already has controller tests for
  auth, workout sessions, exercise templates and schedules, and middleware tests for the access
  guards.
  - **Not covered:** `chatController` and `aiService`.
  - **Not checked:** the confirmed issues above (template cascade delete, session fixation,
    password policy, blocked user with a live session) need explicit cases even where the files
    exist.
- **Frontend:** no tests at all. The calculation code in `lib/clientApi.ts` (rolling week, streak,
  personal bests, volume) is pure logic and the most valuable thing to unit-test. It decides every
  number on the dashboard.
- **End-to-end:** none. Flows 1 to 3 (signup, then login, then logging a workout and seeing it on
  the dashboard) are the most valuable single end-to-end test.

## Decisions needed before writing tests

1. **Template deletion:** should deleting a template keep past logged exercises, block deletion
   when the template is in use, or at least ask for confirmation?
2. **Password policy:** minimum length or strength rules for signup and reset.
3. **Weight values:** should `weight_in_kg` accept decimals (2.5 kg plates are common)?
4. **Future sessions:** should future-dated sessions count toward "this week"?
5. **Blocked users:** should blocking a user end their current session immediately?
