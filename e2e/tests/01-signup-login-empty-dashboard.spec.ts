// Flow 3 → 2 → 4: sign up, get sent to /login (NOT logged in), log in, land on an empty dashboard.
import { expect, test } from "@playwright/test"
import { PASSWORD, expectOnClientDashboard, loginViaUi, uniqueEmail } from "./helpers"

test("signup redirects to /login without logging in, then login shows an empty dashboard", async ({ page }) => {
  const email = uniqueEmail("signup")

  await page.goto("/register")
  await page.getByLabel("Name").fill("Signup Tester")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(PASSWORD)
  await expect(page.getByRole("radio", { name: "Client" })).toBeChecked() // default role
  await page.getByRole("button", { name: "Register" }).click()

  // Signup redirects to the login form…
  await expect(page).toHaveURL(/\/login$/)
  // …and does not create a session.
  const me = await page.request.get("/api/auth/me")
  expect(me.status()).toBe(401)
  await page.goto("/client")
  await expect(page).toHaveURL(/\/login$/)

  // Log in with the new account → empty client dashboard.
  await loginViaUi(page, email, { navigate: false })
  await expectOnClientDashboard(page)
  await expect(page.getByTestId("stat-total-sessions")).toHaveText("0")
  await expect(page.getByTestId("stat-sessions-week")).toHaveText("0")
  await expect(page.getByText("No sessions logged yet.", { exact: false })).toBeVisible()
  await expect(page.getByTestId("recent-session")).toHaveCount(0)
})
