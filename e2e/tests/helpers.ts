import { expect, type APIRequestContext, type Page } from "@playwright/test"

export const PASSWORD = "Str0ng-Passw0rd!"

/** Unique per test run and per call, so tests never collide on the unique email index. */
export function uniqueEmail(tag: string) {
  const rand = Math.random().toString(36).slice(2, 8)
  return `e2e-${tag}-${Date.now()}-${rand}@example.com`
}

/** Fast setup path: create a user through the API (the signup UI has its own test). */
export async function registerViaApi(
  request: APIRequestContext,
  { name, email, role = "client" }: { name: string; email: string; role?: "client" | "trainer" },
) {
  const res = await request.post("/api/auth/register", {
    data: { name, email, password: PASSWORD, role },
  })
  expect(res.status(), await res.text()).toBe(201)
}

/**
 * Logs in through the real login form. Pass `navigate: false` to use the form
 * already on screen (keeps the SPA alive, e.g. right after logging out).
 */
export async function loginViaUi(
  page: Page,
  email: string,
  { password = PASSWORD, navigate = true }: { password?: string; navigate?: boolean } = {},
) {
  if (navigate) await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Log in" }).click()
}

export async function expectOnClientDashboard(page: Page) {
  await expect(page).toHaveURL(/\/client$/)
  await expect(page.getByRole("heading", { level: 1, name: /^Good (morning|afternoon|evening)/ })).toBeVisible()
}

/**
 * Creates a session holding one exercise through the API. `page.request`
 * shares the browser context's cookies, so this acts as the logged-in user.
 */
export async function createSessionWithExercise(
  page: Page,
  { userId, templateId, date, sets = 3, reps = 10, weight = 50 }: {
    userId: string
    templateId: string
    date: string
    sets?: number
    reps?: number
    weight?: number
  },
) {
  const s = await page.request.post(`/api/clients/${userId}/workout-sessions`, {
    data: { session_date: date },
  })
  expect(s.status(), await s.text()).toBe(201)
  const session = (await s.json()) as { _id: string }
  const e = await page.request.post(`/api/workout-sessions/${session._id}/exercises`, {
    data: { exercise_template_id: templateId, sets, reps, weight_in_kg: weight },
  })
  expect(e.status(), await e.text()).toBe(201)
  return session._id
}

export async function currentUserId(page: Page): Promise<string> {
  const res = await page.request.get("/api/auth/me")
  expect(res.ok()).toBeTruthy()
  return ((await res.json()) as { user: { id: string } }).user.id
}
