// The plan's highest-impact item. Deleting an exercise template currently
// deletes every logged exercise that used it, in every past session
// (exerciseTemplateModel.deleteTemplateAndAssociatedExercises), with no
// confirmation. We consider that a BUG: past training history should survive.
//
// This test asserts the CORRECT behaviour (history is kept), so it fails today.
// test.fail() marks that failure as expected; when the bug is fixed this test
// will start passing, Playwright will report it as "unexpectedly passed", and
// the test.fail() line should be removed.
import { expect, test } from "@playwright/test"
import { createSessionWithExercise, currentUserId, loginViaUi, registerViaApi, uniqueEmail } from "./helpers"

test("deleting a template keeps it in the history of both sessions that used it", async ({ page, request }) => {
  test.fail(true, "BUG: template delete cascades to all logged exercises (see TEST_PLAN.md, flow 1)")

  const email = uniqueEmail("tpl-delete")
  await registerViaApi(request, { name: "Template Tester", email })
  await loginViaUi(page, email)
  const userId = await currentUserId(page)

  const name = `E2E Deadlift ${Date.now()}`
  const tpl = await page.request.post(`/api/clients/${userId}/exercise-templates`, { data: { name } })
  expect(tpl.status()).toBe(201)
  const { _id: templateId } = (await tpl.json()) as { _id: string }

  const day = 24 * 60 * 60 * 1000
  const sessionIds = [
    await createSessionWithExercise(page, { userId, templateId, date: new Date(Date.now() - 2 * day).toISOString(), weight: 100 }),
    await createSessionWithExercise(page, { userId, templateId, date: new Date(Date.now() - day).toISOString(), weight: 105 }),
  ]

  // Precondition: both sessions show the exercise before the delete.
  for (const id of sessionIds) {
    await page.goto(`/client/workout-sessions/${id}`)
    await expect(page.getByTestId("session-exercise").filter({ hasText: name })).toHaveCount(1)
  }

  // Delete the template from the Exercise Templates page (no confirmation step exists).
  await page.goto("/client/exercise-templates")
  const row = page.getByTestId("template-row").filter({ hasText: name })
  await row.getByRole("button", { name: "Delete" }).click()
  await expect(row).toHaveCount(0)

  // Expected (correct) behaviour: past sessions still show what was lifted.
  for (const id of sessionIds) {
    await page.goto(`/client/workout-sessions/${id}`)
    await expect(page.getByTestId("session-exercise").filter({ hasText: name })).toHaveCount(1, { timeout: 5_000 })
  }
})
