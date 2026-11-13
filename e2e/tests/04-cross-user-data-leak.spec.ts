// Regression: user B must never see user A's data after A logs out and B logs
// in in the SAME tab (no page reload), which is exactly what a shared lab or
// family computer does.
import { expect, test } from "@playwright/test"
import {
  PASSWORD,
  createSessionWithExercise,
  currentUserId,
  expectOnClientDashboard,
  loginViaUi,
  registerViaApi,
  uniqueEmail,
} from "./helpers"

test("after A logs out and B logs in, none of A's data appears", async ({ page, request }) => {
  const emailA = uniqueEmail("leak-a")
  const emailB = uniqueEmail("leak-b")
  await registerViaApi(request, { name: "Alice Leaktest", email: emailA })
  await registerViaApi(request, { name: "Bob Leaktest", email: emailB })
  const secretLift = `Alice Secret Lift ${Date.now()}`

  // A has some history. Seed it through the API (page.request shares the
  // browser's cookies) BEFORE the app first loads, so the app sees it.
  const login = await page.request.post("/api/auth/login", { data: { email: emailA, password: PASSWORD } })
  expect(login.status()).toBe(200)
  const aliceId = await currentUserId(page)
  const tpl = await page.request.post(`/api/clients/${aliceId}/exercise-templates`, { data: { name: secretLift } })
  expect(tpl.status()).toBe(201)
  const { _id: templateId } = (await tpl.json()) as { _id: string }
  await createSessionWithExercise(page, { userId: aliceId, templateId, date: new Date().toISOString() })

  // A opens the app and sees her own data (this fills client-side caches).
  await page.goto("/client")
  await expectOnClientDashboard(page)
  await expect(page.getByTestId("recent-session")).toContainText(secretLift)
  await expect(page.getByTestId("stat-total-sessions")).toHaveText("1")

  // A logs out in the UI; the app sends her to the login form (no reload).
  await page.getByRole("button", { name: "Log out" }).click()
  await expect(page).toHaveURL(/\/login$/)

  // B logs in on the same, still-running page.
  await loginViaUi(page, emailB, { navigate: false })
  await expectOnClientDashboard(page)
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bob")

  // None of A's data may appear anywhere B can see.
  await expect(page.getByTestId("stat-total-sessions")).toHaveText("0")
  await expect(page.getByTestId("recent-session")).toHaveCount(0)
  await expect(page.getByText(secretLift)).toHaveCount(0)

  await page.getByRole("link", { name: "Progress", exact: true }).click()
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  await expect(page.getByText(secretLift)).toHaveCount(0)
})
