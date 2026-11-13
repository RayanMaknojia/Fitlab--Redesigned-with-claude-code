import { defineConfig, devices } from "@playwright/test"

// BASE_URL: where the FitLab frontend is served.
//   - inside the compose network (default for `docker compose run e2e`): http://frontend
//   - from the host: http://localhost:8080
const baseURL = process.env.BASE_URL ?? "http://localhost:8080"

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
