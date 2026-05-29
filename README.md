# Tic-Tac-Toe — SDET Take-Home

WebdriverIO + TypeScript test suite for the Tic-Tac-Toe app at `src/index.html`.

## For the reviewer — suggested read order

1. **[`docs/EXPLORATION.md`](docs/EXPLORATION.md)** — exploratory testing notes: black-box observation of every feature, flow, and quirk of the SUT.
2. **[`docs/TESTPLAN.md`](docs/TESTPLAN.md)** — test plan derived from the exploration: scope, approach, coverage areas (one per exploration section) with priorities, risks, and assumptions. **Automation scope is P0 only**; P1/P2 are documented for completeness.
3. **[`docs/test-cases/`](docs/test-cases/README.md)** — concrete test cases (IDs, preconditions, steps, expected results). One file per area, with a coverage index and bug ↔ TC map.
4. **[`docs/BUGS.md`](docs/BUGS.md)** — defects found during exploration / automation: severity, repro, expected vs actual, with links to the test cases that cover each.
5. **`docs/DECISIONS.md`** *(WIP)* — technical and design decisions made building the test automation (framework choice, Docker layout, locator strategy, sync model, bug-handling convention, etc.) and the rationale behind each.
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

Builds the test image, brings up the `app` service (nginx serving `src/`) with a healthcheck, runs WDIO inside the `tests` container, tears the test container down on exit. ~30 s on a warm cache.

### All scripts

| Command | Purpose |
|---------|---------|
| `npm run serve` | Serve the SUT locally on `http://localhost:8080` via `http-server` and open the default browser. |
| `npm test` | Run WDIO against whatever is serving the SUT at `WDIO_BASE_URL` (defaults to `http://localhost:8080`). Needs the server up — start it with `npm run serve` or `npm run docker:up`. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run docker:up` | Start the `app` container in the background (alternative to `npm run serve` — same URL, no browser auto-open). |
| `npm run docker:down` | Tear the docker stack down. |
| `npm run docker:test` | Full dockerized run — builds the test image, runs WDIO inside it against the in-network `app` service. |

## Repository layout

```
.
├── src/index.html             # System Under Test (SUT) — do not modify
├── tests/specs/               # WebdriverIO specs (Mocha + TypeScript)
├── docs/
│   ├── EXPLORATION.md         # Black-box exploration notes
│   ├── TESTPLAN.md            # Test plan (scope, approach, coverage areas)
│   ├── test-cases/            # Concrete test cases — one file per area + README index
│   ├── BUGS.md                # Defects found (linked to covering test cases)
│   ├── DECISIONS.md           # Test-automation design decisions + rationale (WIP)
│   ├── INSTRUCTIONS.md        # Original take-home brief
│   └── TASK.md                # Original submission instructions
├── Dockerfile.app             # nginx serving src/ on :8080
├── Dockerfile.tests           # Node 22 + Chromium + chromedriver + WDIO
├── compose.yml                # Two services: app, tests (profile-gated)
├── wdio.conf.ts               # WDIO config — env-driven (CHROME_BIN, WDIO_BASE_URL, …)
└── tsconfig.json              # noEmit; specs run via tsx
```

## Tooling choices (brief rationale)

- **WebdriverIO + Mocha + TypeScript** — chose WDIO per the directory name; TypeScript for refactor-safe locators and config; Mocha because it stays out of the way and `expect-webdriverio` covers the assertion surface.
- **Docker Compose (2 services)** — the only setup-dependency a reviewer needs is Docker. The `tests` container ships Chromium + chromedriver from Debian repos so WDIO can spawn the browser directly — no Selenium service, no Grid, no host-side browser install. Healthcheck on `app` gates the test run so we don't race the server.
- **`data-testid` everywhere** — every interactive element in the SUT already exposes one, so locators are stable across visual changes; specs avoid CSS / XPath.
- **No bind-mount of `src/`** — the SUT is fixed for the take-home, so `Dockerfile.app` `COPY`s it; the image is reproducible and reviewers don't need to think about volumes.