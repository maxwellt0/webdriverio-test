# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

This repo is an SDET take-home. Exploration notes are in `docs/EXPLORATION.md`, the test plan in `docs/TESTPLAN.md`, the concrete test cases in `docs/test-cases/`, bugs found during exploration in `docs/BUGS.md`, and the test-automation design decisions in `docs/DECISIONS.md`. The deliverable is a test plan, test cases, and automated coverage of the critical flows of the System Under Test (SUT). Framework: **WebdriverIO** + Mocha, **TypeScript** (loaded via `tsx`). Orchestration: **Docker Compose** with two containers — `app` (nginx serving the SUT) and `tests` (Node + Chromium + chromedriver, runs WDIO).

## System Under Test

`index.html` is a single self-contained file (HTML + CSS + obfuscated JS, no network calls). It implements a Tic-Tac-Toe app with substantially more surface area than the name suggests:

- **Auth** — sign up / sign in flow with a username-only form (minimum length enforced). State persists in localStorage.
- **Navigation** — `Play` / `Profile` / `History` views, plus a logout button.
- **Game** — 3x3 board against a computer opponent. Difficulty selector (`easy` / `medium` / `hard`). `Hint`, `New game`, and `Reset` actions. Status pill reflects turn / win / draw / "computer thinking".
- **History** — table of past games (date, difficulty, result) with a clear-history action.
- **Profile** — edit username, view aggregate stats (wins / losses / draws).
- **Settings** — language toggle (en / fa, with RTL layout for fa) and light/dark theme toggle, both in the header.

The app is **fully selector-friendly**: nearly every interactive element exposes a stable `data-testid`. Use these as the primary locator strategy. Examples observed in the rendered DOM: `cell-0`…`cell-8`, `board`, `status`, `btn-new-game`, `btn-hint`, `btn-reset`, `select-difficulty`, `nav`, `view-play`, `view-profile`, `view-history`, history row/cell testids like `history-row-N`, profile stat testids like `profile-wins` / `profile-losses` / `profile-draws`.

## Commands

Docker Desktop (or a compatible engine) must be running.

Two execution modes:

**Host-side** (fast iteration):
- `npm run serve` — serve `src/` on `http://localhost:8080` via `http-server` and auto-open the browser.
- `npm test` — run WDIO against `WDIO_BASE_URL` (defaults to `http://localhost:8080`). Server must be up — start it with `npm run serve` *or* `npm run docker:up`.
- `HEADED=1` — disables headless (e.g. `HEADED=1 npm test` / PowerShell `$env:HEADED=1; npm test`). WDIO v9 auto-manages Chrome for Testing locally.

**Fully dockerized** (CI / clean review):
- `npm run docker:up` — start the `app` container in the background (alternative to `npm run serve`; no browser auto-open).
- `npm run docker:down` — tear the stack down.
- `npm run docker:test` — `docker compose run --rm --build tests`. Builds the test image, runs WDIO inside it (Chromium + chromedriver bundled) against the in-network `app` service, then generates an Allure HTML report **inside the container** (Java is bundled in the image, not required on the host). The report is mounted out to `./allure-report/`; view it with any static server, e.g. `npx http-server ./allure-report -o`. Canonical entry point for reviewers.

Other:
- `npm run typecheck` — `tsc --noEmit`.
- `npm run lint` / `npm run lint:fix` — ESLint 9 (flat config) over `tests/` and `wdio.conf.ts`.
- `npm run format` / `npm run format:check` — Prettier 3. SUT (`src/`) and docs (`*.md`) are ignored.
1- Run a single spec: append `-- --spec tests/specs/<name>.spec.ts` to `npm test` or `npm run docker:test`.

## Layout

- `src/index.html` — the SUT (do not modify). Copied into nginx at build time as the static root, so `baseUrl` reaches it at `/`. Changing `src/` requires `docker compose build app` (or `docker compose up --build app`).
- `compose.yml` — two services: `app` (built from `Dockerfile.app`) and `tests` (built from `Dockerfile.tests`, gated by `profiles: ["test"]` so `docker compose up` doesn't start it). The `tests` service bind-mounts `./allure-report` so the in-container report surfaces on the host; `allure-results` stays inside the `--rm` container so runs never merge stale results.
- `Dockerfile.app` — `nginx:alpine` + `COPY src/`.
- `Dockerfile.tests` — `node:22-bookworm-slim` with `chromium` + `chromium-driver` + a headless JRE (`default-jre-headless`, for Allure) from Debian repos; installs deps via `npm ci`, copies `tsconfig.json` / `wdio.conf.ts` / `tests/`. Its command runs WDIO and then `allure generate` (even on failure, preserving the test exit code), so the HTML report is built in-container. Exports `CHROME_BIN` and `CHROMEDRIVER_BIN` so the config uses the system binaries instead of WDIO's auto-managed Chrome for Testing.
- `.github/workflows/ci.yml` — CI on push-to-`main` / PR: a `quality` job (`typecheck` + `lint` + `format:check`), a dockerized `e2e` job (`npm run docker:test`), and a `publish-report` job that deploys the in-container Allure report to GitHub Pages (main only). Requires Pages enabled with Source = GitHub Actions.
- `wdio.conf.ts` — env-driven: reads `WDIO_BASE_URL`, `CHROME_BIN`, `CHROMEDRIVER_BIN`, and `HEADED`. Defaults assume host-side execution with WDIO's bundled driver management. The `tests` compose service sets `WDIO_BASE_URL=http://app`; `CHROME_*` env comes from the Dockerfile. Each spec calls `resetAndOpen()` in its own `beforeEach` to clear `localStorage` and reload, so every spec starts from a logged-out, history-free state. See `DECISIONS.md` DEC-5.
- `tests/` — `core/` (abstract `BasePage`), `pages/` (concrete page objects + `nav.component.ts`, `header.component.ts`), `fixtures/` (workflow helpers — `registerAndLand`, `winOneGame`, `assertComputerDoesNotOverwriteCells`, …), `specs/**/*.spec.ts` (Mocha specs), `utils/` (stateless helpers — confirm stub, storage, test-data, regex).
- `tsconfig.json` — `noEmit`; WDIO/tsx run TS directly. Ambient types for `browser`, `$`, `expect`, `describe`, `it` come from the `types` array.

## SUT-specific testing notes

- Persistent state lives in `localStorage`. Each spec resets it via `resetAndOpen()` in its own `beforeEach` (not the `beforeTest` hook — see `DECISIONS.md` DEC-5); don't rely on cross-spec ordering.
- The computer move is asynchronous and gated by a `computer-thinking` status on the status pill. Wait on the pill / cell state, not on `browser.pause`.
- Hard-difficulty AI is **broken** (see `BUGS.md` #BUG-1): in observed play it is the *weakest* level — the human wins freely and the computer can even overwrite a played cell. Don't assume Hard is unbeatable. Bug-pending Hard scenarios are documented as test cases (`TC-AI-02`, `TC-AI-05`) but not automated this engagement.
- The app supports RTL (fa) and dark mode. If you add visual or layout assertions, pin language and theme explicitly in setup.
- Prefer `data-testid` selectors (`[data-testid="cell-0"]`, `[data-testid="status"]`, `[data-testid="btn-new-game"]`, etc.) — they are stable across the app.