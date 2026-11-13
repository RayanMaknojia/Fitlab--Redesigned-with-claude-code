// Flow 2 failure modes: wrong password and unknown email must look identical
// (same message), so the form doesn't reveal which emails have accounts.
import { expect, test } from "@playwright/test"
import { loginViaUi, registerViaApi, uniqueEmail } from "./helpers"

test("wrong password and unknown email both show the same 'Invalid credentials' error", async ({ page, request }) => {
  const email = uniqueEmail("login")
  await registerViaApi(request, { name: "Login Tester", email })

  // Wrong password for a real account.
  await loginViaUi(page, email, { password: "not-the-password" })
  const alert = page.getByRole("alert")
  await expect(alert).toHaveText("Invalid credentials")
  await expect(page).toHaveURL(/\/login$/)
  const wrongPasswordMessage = await alert.textContent()

  // Unknown email.
  await loginViaUi(page, uniqueEmail("nobody"), { password: "whatever-123" })
  await expect(alert).toHaveText("Invalid credentials")
  await expect(page).toHaveURL(/\/login$/)
  expect(await alert.textContent()).toBe(wrongPasswordMessage)

  // Neither attempt created a session.
  expect((await page.request.get("/api/auth/me")).status()).toBe(401)
})
