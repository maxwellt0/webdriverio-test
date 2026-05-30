# Tic-Tac-Toe — SDET Take-Home

[![CI](https://github.com/maxwellt0/webdriverio-test/actions/workflows/ci.yml/badge.svg)](https://github.com/maxwellt0/webdriverio-test/actions/workflows/ci.yml)
[![Allure report](https://img.shields.io/badge/Allure_report-live-7d2def)](https://maxwellt0.github.io/webdriverio-test/)

WebdriverIO + TypeScript test suite for the Tic-Tac-Toe app at `src/index.html`.

📊 **Live Allure report:** https://maxwellt0.github.io/webdriverio-test/ (published from `main` by CI).

## For the reviewer — suggested read order

1. **[`docs/EXPLORATION.md`](docs/EXPLORATION.md)** — exploratory testing notes: black-box observation of every feature, flow, and quirk of the SUT.
2. **[`docs/TESTPLAN.md`](docs/TESTPLAN.md)** — test plan derived from the exploration: scope, approach, coverage areas (one per exploration section) with priorities, risks, and assumptions. **Automation scope is P0 only**; P1/P2 are documented for completeness.
3. **[`docs/test-cases/`](docs/test-cases/README.md)** — concrete test cases (IDs, preconditions, steps, expected results). One file per area, with a coverage index and bug ↔ TC map.
4. **[`docs/BUGS.md`](docs/BUGS.md)** — defects found during exploration / automation: severity, repro, expected vs actual, with links to the test cases that cover each.
5. **`docs/DECISIONS.md`** — technical and design decisions made building the test automation (framework choice, Docker layout, locator strategy, sync model, bug-handling convention, etc.) and the rationale behind each.
6. **`tests/specs/`** — automated specs implementing the P0 cases. Each spec links back to one or more `TC-*` IDs.

## Quick start

Two execution modes — **host-side** (fast iteration) or **fully dockerized** (one command, no host deps besides Docker).

### Host-side (recommended for development)

Two terminals:

```bash
# terminal 1 — serve the SUT and open it in your browser
npm run serve

# terminal 2 — run the suite against http://localhost:8080
npm test
```

### Fully dockerized (recommended for CI / clean-machine reviewers)

Requires **Docker Desktop** (or compatible engine) running.

```bash
npm run docker:test
```

Builds the test image, brings up the `app` service (nginx serving `src/`) with a healthcheck, runs WDIO inside the `tests` container, generates an Allure HTML report **inside the container** (Java is bundled in the image — no host Java needed), and tears the test container down on exit. ~30 s on a warm cache.

The report is mounted out to `./allure-report/`. It's a static site, so view it through any server — e.g. `npx http-server ./allure-report -o` (no Java required) — rather than opening `index.html` over `file://`.

### All scripts

| Command                                   | Purpose                                                                                                                                                                            |
|-------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `npm run serve`                           | Serve the SUT locally on `http://localhost:8080` via `http-server` and open the default browser.                                                                                   |
| `npm test`                                | Run WDIO against whatever is serving the SUT at `WDIO_BASE_URL` (defaults to `http://localhost:8080`). Needs the server up — start it with `npm run serve` or `npm run docker:up`. |
| `npm run typecheck`                       | `tsc --noEmit`.                                                                                                                                                                    |
| `npm run lint` / `npm run lint:fix`       | ESLint 9 (flat config) over `tests/` and `wdio.conf.ts`; `:fix` applies the auto-fixable subset.                                                                                   |
| `npm run format` / `npm run format:check` | Prettier 3 — write formatted output / fail on drift. SUT (`src/`) and docs (`*.md`) are ignored.                                                                                   |
| `npm run allure:generate`                 | Generate the static Allure HTML report from `allure-results/` into `allure-report/` (requires Java).                                                                               |
| `npm run allure:open`                     | Serve a previously generated `allure-report/` in the browser (requires Java).                                                                                                      |
| `npm run allure:serve`                    | Generate a temporary report from `allure-results/` and open it in one step (requires Java).                                                                                        |
| `npm run docker:up`                       | Start the `app` container in the background (alternative to `npm run serve` — same URL, no browser auto-open).                                                                     |
| `npm run docker:down`                     | Tear the docker stack down.                                                                                                                                                        |
| `npm run docker:test`                     | Full dockerized run — builds the test image, runs WDIO inside it against the in-network `app` service, and generates an Allure report (in-container) to `./allure-report/`.        |

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and on every PR:

- **Quality gates** (`quality` job) — `typecheck`, `lint`, and `format:check`, host-side via `setup-node`.
- **Dockerized E2E** (`e2e` job) — `npm run docker:test`: builds the test image and runs the full WDIO suite against the in-network `app` service, generating the Allure report in-container.
- **Report publishing** (`publish-report` job, `main` only) — the generated `allure-report/` is deployed to **GitHub Pages** at **https://maxwellt0.github.io/webdriverio-test/** (it's also uploaded as a downloadable `allure-report` artifact on every run, including failures).

The report URL also appears in the `publish-report` job summary and the repo's **github-pages** environment. **One-time setup:** enable Pages under **Settings → Pages → Source: GitHub Actions** (a plain artifact is *not* directly browsable — an Allure report is a static SPA that must be served, so Pages is what makes it click-and-view).

## Repository layout

```
.
├── .github/workflows/ci.yml   # CI: quality gates + dockerized E2E + Allure → Pages
├── src/index.html             # System Under Test (SUT) — do not modify
├── tests/specs/               # WebdriverIO specs (Mocha + TypeScript)
├── docs/
│   ├── test-cases/            # Concrete test cases — one file per area + README index
│   ├── BUGS.md                # Defects found (linked to covering test cases)
│   ├── DECISIONS.md           # Test-automation design decisions + rationale
│   ├── EXPLORATION.md         # Black-box exploration notes
│   └── TESTPLAN.md            # Test plan (scope, approach, coverage areas)
├── Dockerfile.app             # nginx serving src/ on :8080
├── Dockerfile.tests           # Node 22 + Chromium + chromedriver + WDIO
├── compose.yml                # Two services: app, tests (profile-gated)
├── wdio.conf.ts               # WDIO config — env-driven (CHROME_BIN, WDIO_BASE_URL, …)
└── tsconfig.json              # noEmit; specs run via tsx
```

## Tooling choices (brief rationale)

- **WebdriverIO + Mocha + TypeScript** — chose WDIO per the directory name; TypeScript for refactor-safe locators and config; Mocha because it stays out of the way and `expect-webdriverio` covers the assertion surface.
- **Docker Compose (2 services)** — the only setup-dependency a reviewer needs is Docker. The `tests` container ships Chromium + chromedriver from Debian repos so WDIO can spawn the browser directly — no Selenium service, no Grid, no host-side browser install. Healthcheck on `app` gates the test run so we don't race the server.