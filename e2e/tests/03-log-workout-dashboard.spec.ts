// Flows 1 → 4: the plan's most valuable end-to-end test. Log a workout through
// the UI and see it reflected on the dashboard.
import { expect, test } from "@playwright/test"
import { expectOnClientDashboard, loginViaUi, registerViaApi, uniqueEmail } from "./helpers"

// datetime-local value for "one hour ago" in the browser's timezone (the
// container runs Node and Chromium in the same TZ).
function anHourAgoLocal() {
  const d = new Date(Date.now() - 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

test("logging a session with an exercise shows up on the dashboard", async ({ page, request }) => {
  const email = uniqueEmail("workout")
  await registerViaApi(request, { name: "Workout Tester", email })
  await loginViaUi(page, email)
  await expectOnClientDashboard(page)

  // Create a session.
  await page.getByRole("link", { name: "Workout Sessions" }).click()
  await page.getByRole("button", { name: "Add a session" }).click()
  const addSession = page.getByRole("dialog", { name: "Add a session" })
  await addSession.getByLabel("Date").fill(anHourAgoLocal())
  await addSession.getByRole("button", { name: "Add session" }).click()
  // Known UX bug: DialogFormButton doesn't close the dialog after a successful
  // submit, so the user has to dismiss it themselves. Do what they'd do.
  await page.keyboard.press("Escape")
  await expect(addSession).toBeHidden()
  await expect(page.getByTestId("session-row")).toHaveCount(1)

  // Open it and add an exercise from the suggested list.
  await page.getByTestId("session-row").getByRole("link", { name: "View" }).click()
  await page.getByRole("button", { name: "Add an exercise" }).click()
  const addExercise = page.getByRole("dialog", { name: "Add to this session" })
  await addExercise.getByRole("radio", { name: "Back Squat" }).click()
  await addExercise.getByLabel("Sets").fill("4")
  await addExercise.getByLabel("Reps").fill("8")
  await addExercise.getByLabel("Weight (kg)").fill("60")
  await addExercise.getByRole("button", { name: "Add to session" }).click()
  await expect(addExercise).toBeHidden()

  const row = page.getByTestId("session-exercise")
  await expect(row).toHaveCount(1)
  await expect(row).toContainText("Back Squat")
  await expect(row).toContainText("4 sets, 8 reps, 60 kg")

  // Back to the dashboard via in-app navigation (no reload).
  await page.getByRole("link", { name: "Dashboard" }).click()
  await expectOnClientDashboard(page)
  await expect(page.getByTestId("stat-total-sessions")).toHaveText("1")
  await expect(page.getByTestId("stat-sessions-week")).toHaveText("1")
  await expect(page.getByTestId("recent-session")).toHaveCount(1)
  await expect(page.getByTestId("recent-session")).toContainText("Back Squat")
  const personalBests = page.locator("section").filter({ has: page.getByRole("heading", { name: "Personal bests" }) })
  await expect(personalBests).toContainText("Back Squat")
  await expect(personalBests).toContainText("60 kg × 8")
})
