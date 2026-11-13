# FitLab end-to-end tests (Playwright)

The tests run inside the official Playwright Docker image, so the host needs only
Docker. Node, npm and browsers aren't needed on the host.

## Run

From the repo root, with the app running (`docker compose up -d --build`):

```sh
docker compose --profile e2e run --rm e2e
```

- **Default target:** `BASE_URL=http://frontend` (the frontend container on the Compose network).
- **Another target:** to test a different deployment, override it:

  ```sh
  BASE_URL=https://staging.example.com docker compose --profile e2e run --rm e2e
  ```

- **Extra Playwright arguments:**

  ```sh
  docker compose --profile e2e run --rm e2e sh -c "npm install --silent && npx playwright test 04-cross-user --headed=false"
  ```

- **Report:** the HTML report lands in `e2e/playwright-report/`.
- **Failure traces:** traces for failed tests land in `e2e/test-results/`. View one with
  `npx playwright show-trace`, or upload it to https://trace.playwright.dev.

## Versions

`@playwright/test` in `package.json` and the image tag in `docker-compose.yml`
(`mcr.microsoft.com/playwright:v1.65.0-noble`) must stay on the same version.

## Conventions

- **Locators:** `getByRole` / `getByLabel` first, `data-testid` only where there's no accessible role or name.
- **Waiting:** no fixed sleeps. Rely on Playwright's auto-waiting `expect`.
- **Test users:** each test creates its own users with a unique email (`e2e-<tag>-<timestamp>-<rand>@example.com`).
  They stay in the local database.
- **Known bugs:** `test.fail()` marks tests that assert the *correct* behaviour of a known bug, with a comment.
