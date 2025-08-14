## E2E Test Suite (Cypress)

This folder contains the end-to-end (E2E) tests for the Escape Room web app. Tests are written with Cypress E2E mode and target the real browser, exercising our React UI and routing. Network traffic to the backend is mostly stubbed with `cy.intercept()` for stability and speed.

### What we test (scope)

- **Authentication (auth.cy.js, 13 tests)**: loading screen, login modals, validation, success/failed logins (stubbed), localStorage auto-login, logout, modal open/close behaviors.
- **Registration (register.cy.js, 14 tests)**: student registration UI flow and back navigation.
- **Student Dashboard (student_dashboard.cy.js, 20 tests)**: task list loading (stubbed), search/filter/sort, card rendering, navigation to task intro/quiz.
- **Teacher Dashboard & Task Management (teacher_dashboard.cy.js, 20 tests)**: tasks and stats loading (stubbed), filters (status/questions), sort (name/questions/status/publish date), create/edit/delete flows (stubbed), counters and badges.
- **Task Editor (task_editor.cy.js, 30 tests)**: editor inputs, saving stubs, navigation and guards.
- **Quiz flow (quiz.cy.js, 14 tests)**: task intro → quiz progression, answering interactions (stubbed), basic result handling.
- **Question creation (question_create.cy.js, 10 tests; question_create_editor.cy.js, 17 tests)**: single/multiple-choice, fill-blank, matching, puzzle editors and creation routes.
- **Video upload (video_upload.cy.js, 10 tests)**: UI states around upload widget (network stubbed).
- **Change password (change_password.cy.js, 15 tests)**: open/close modal, validation, submit stub, success states.
- **Custom alerts/toasts (custom_alert.cy.js, 9 tests)**: provider behavior and message variants.
- **Student Accessibility & Achievements (student_accessibility.cy.js, 10 tests; student_achievements.cy.js, 15 tests)**: feature presence, filters, and basic interactions.
- **Student History (student_history.cy.js, 20 tests)**: list rendering and navigation behaviors.

Total: **14 suites, 217 tests**. Network stubs are used extensively: ~175 `cy.intercept()` occurrences across the suite.

### Pass rate and reliability

- Default (stubbed) mode: designed for deterministic runs; pass rate is 100% on Chromium-based browsers.
- Real-backend mode: pass rate depends on backend availability and seed data; tests that rely on stubs still pass, but real API-dependent flows require the backend to be up at `http://localhost:5001`.
- Flake considerations: the app intentionally shows a ~3s loading animation; tests account for this with an initial `cy.wait(3500)` before interacting with the login cards.

### How to run (frontend-first)

Prerequisites:

- Node.js 18+ and npm
- Cypress (installed via devDependencies)

Install deps once:

```bash
npm install
```

Option A — Stubbed E2E (no backend required):

1. Start the frontend dev server

```bash
npm start
```

2. In another terminal, run Cypress

```bash
# Open interactive runner
npm run cypress:open:e2e

# Or run headless (Electron by default)
npm run cypress:run:e2e
```

Option B — Full stack via Docker Compose (optional):

```bash
# Start backend and a dev frontend (ports 5001, 3000)
docker-compose --profile dev up -d backend frontend-dev

# Then run the Cypress commands as above
npm run cypress:run:e2e
```

Base URLs:

- App base URL is configured in `cypress.config.js` → `baseUrl: http://localhost:3000`.
- API base URL is configured in `cypress.config.js` → `env.apiBaseUrl: http://localhost:5001`.

### Structure

- `cypress/e2e`: spec files (test suites)
- `cypress/fixtures`: static fixtures (e.g., `users.json`)
- `cypress/support/e2e.js`: global setup and custom commands (e.g., `cy.loginAs`)

### Notable helpers

- `cy.loginAs(role)`: Attempts an API login and writes `user_data` to localStorage on success; gracefully returns `{ status: 0 }` if the backend is unreachable. Most tests avoid real API by stubbing `POST **/login` directly.

### Reporting

The default reporter prints a concise spec summary with passed/failed counts. For CI or artifact needs, you can plug in a reporter (e.g., `junit` or `mochawesome`). Example with JUnit:

```bash
npx cypress run --e2e \
  --reporter junit \
  --reporter-options mochaFile=results/junit-[hash].xml,toConsole=true
```

### Tips for writing tests in this repo

- Prefer `cy.intercept()` to stub backend calls for stability and speed.
- Interact with visible, user-facing elements where possible; add `data-cy` attributes for brittle selectors.
- Mind the 3s loading animation: visit → wait → interact.
- Keep tests independent: each spec seeds its own localStorage state.

### Troubleshooting

- `ECONNREFUSED` on `POST /login`: either run the backend or stub the request. Our tests use stubs by default; the `cy.loginAs` helper also fails gracefully.
- `cy.visit('/')` fails: ensure the frontend dev server is running on port 3000, or start it via Docker Compose.
