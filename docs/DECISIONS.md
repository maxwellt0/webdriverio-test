# Decisions — Test Automation

Technical and design decisions made building the test automation, with the rationale behind each. Decisions are listed in chronological order; the latest is the current state.

---

## DEC-1 — Test folder layout

**Decision:** Under `tests/`, organize code into five top-level folders:

```
tests/
├── core/       # Abstract base classes (base.page.ts, future base.component.ts, etc.)
├── pages/      # Concrete page objects (auth.page.ts, play.page.ts, profile.page.ts, history.page.ts)
├── fixtures/   # Higher-level test helpers — workflow orchestration and shared
│               # multi-step assertions (auth.fixture.ts, play.fixture.ts)
├── specs/      # Mocha spec files — one per area, mirrors docs/test-cases/
└── utils/      # Cross-cutting helpers (test-data generators, confirm-dialog handler,
                # localStorage helpers, i18n string map, etc.)
```

**Naming convention:** kebab-case filenames with a role suffix — `base.page.ts`, `auth.page.ts`, `auth.fixture.ts`, `<area>.spec.ts`. Class names stay PascalCase (`BasePage`, `AuthPage`, …) so the file/class distinction is unambiguous at a glance.

**Why:**
- The SUT is small (one HTML file, ~7 testable views), so a deep / role-rich structure (e.g. separate `components/`, `selectors/`, `actions/`, `workflows/`) would be over-engineering. Five folders cover the necessary separations without the bureaucracy.
- The separation of `pages/` from `fixtures/` keeps individual page objects narrow (one page = one set of locators + atomic actions) while still giving a home for the slightly higher-level user-journey helpers and shared multi-step assertions that the critical-flow specs compose.
- `core/` exists specifically so the abstract `BasePage` (and any future siblings) don't sit alongside concrete pages — concrete pages are an inheritance leaf, abstractions are not.
- `utils/` is a deliberate catch-all; anything that has no clean home goes there with a justification in its own file header.

**How to apply:**
- New page object → `tests/pages/<Name>Page.ts`, extending `BasePage` from `tests/core/`.
- New cross-page workflow or shared assertion → `tests/fixtures/<area>.fixture.ts`. If it would only ever be called from one spec, inline it instead.
- New helper → `tests/utils/`. If a util grows into a class or starts owning state, consider promoting it to `core/`.
- Specs (`tests/specs/`) only consume the above. Spec files should not contain low-level WDIO calls beyond `before` / `beforeEach` hooks; everything goes through page / feature / util modules.

---

---

## DEC-2 — Linter & formatter: ESLint 9 (flat config) + Prettier

**Decision:** ESLint 9 with the flat-config format (`eslint.config.mjs`) for linting, Prettier 3 for formatting, `eslint-config-prettier` to disable ESLint rules that overlap with Prettier.

**Why:**
- Industry-standard pair for TypeScript projects. Reviewers recognize the toolchain immediately; no learning curve.
- Flat config (ESLint 9+) is the future direction of ESLint; starting on it avoids a forced migration.
- Prettier owns formatting (single source of truth — no ESLint stylistic rules), ESLint owns code quality. Clean separation avoids the historical lint/format conflict.
- Alternatives considered: **Biome** (faster, all-in-one) was rejected because it is less recognized by reviewers; **standalone Prettier without ESLint** was rejected because it doesn't catch unused imports, dead code, type misuse, etc.

**How to apply:**
- `npm run lint` — check code; `npm run lint:fix` — auto-fix what ESLint can.
- `npm run format` — write Prettier-formatted output; `npm run format:check` — fail in CI if formatting drift.
- The SUT (`src/`) and all docs (`*.md`) are ignored — the SUT is not ours to modify, and docs are hand-formatted.
- Config lives at the repo root: `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`.
- Lint/format are not run inside the test container — they're a host-side / CI concern, not a runtime dependency of the test suite.

---

## DEC-3 — Critical-flow selection: what counts as P0

**Decision:** P0 = anything that would break the *core user loop* `register → play a game → see history → log out`, or that is a strong-signal correctness / security check. P1/P2 cases are documented in `docs/test-cases/` but not automated this engagement.

**The core loop:** every P0 area is in the critical path of that loop or is necessary to trust the assertion at its end:

- **Auth (register happy + validation + duplicate + login happy + non-existent + empty)** — broken auth means no test can register a user, so nothing else works. XSS in the name field renders into nav / profile / history; a single failure here is a security bug, so it lives in P0 even though it isn't strictly in the happy path.
- **Navigation (nav appears, each item switches, log out)** — the only mechanism for getting between the four authenticated views; broken nav blocks every downstream assertion.
- **Play (status pill, board behavior, computer no-overwrite on Easy/Medium, Hint enabled/disabled, New Game / Reset, difficulty selector incl. mid-game confirm)** — the SUT's reason for existing. Most surface area, most P0s.
- **History (empty state, appended on finish, columns reflect game, newest first, Clear OK/Cancel)** — the visible record of past games; if this lies, the entire stats / persistence story can't be trusted.
- **Profile (current name + Created + zeroed stats, rename happy + collision + XSS, delete OK/Cancel)** — user record management; rename collision and the XSS path are both correctness-critical.
- **Theme + i18n (toggle works, language switch translates + flips RTL)** — visible on every view; broken = global UX failure.
- **Persistence (theme/lang/session/users survive reload, in-progress board does NOT, lands on Play, difficulty per-user)** — the contract underlying every "log back in and resume" scenario.

**What was deliberately *not* P0** (and why):

- **Bug-pending scenarios** (Hard AI, Persian title #BUG-3) — re-priced to P1. The behavior is broken; the bug is already filed in `BUGS.md`; documenting it as a test case is enough — automating it would either skip-and-rot or assert the broken state as a regression check that flips on fix, both of which add maintenance load for no value beyond the bug ticket.
- **Medium AI immediate-win / immediate-block (TC-AI-03/04)** — P1. Needs deterministic board-state seeding to be reliable (Medium has a random fallback for non-forcing positions); skipping in P0 keeps the suite deterministic.
- **Edge cases that don't affect the loop** — case-insensitive login lookup (the original casing works fine), rename to own-name-in-different-case (vanity feature), mid-game language switch (cosmetic), and similar surface-level details. All documented as P1.
- **Visual / a11y / cross-browser / responsive / performance** — out of scope per `TESTPLAN.md §2`; would require separate tooling (axe, percy, etc.) and significantly more engagement time.

**How to apply:** when adding a new test case, ask "does failing this break a user's ability to register-play-see-logout, or does it falsely confirm a working system?" If yes → P0. If it's a quality concern that a user could route around → P1.

---

## DEC-4 — Locator + synchronization model

**Decision:** Every locator is `[data-testid="…"]`. Every wait is on observable state (`data-status`, `data-state`, displayed / enabled). No CSS / XPath selectors, no `browser.pause`, no text-content matching except for asserting user-facing copy.

**Why:**
- The SUT exposes a stable `data-testid` on every interactive element (discovered by the one-off probe `_probe.spec.ts`, deleted post-discovery). Anchoring on those keeps the suite refactor-safe against visual or i18n string changes — Persian RTL flips most copy and would break any CSS-class or text selector.
- The SUT has one timing source: the asynchronous computer move (~1.5 s) gated by `data-status="computer-thinking"` on the status pill. Waiting on that attribute is deterministic; sleeping for 1.5 s is flaky and slow. The cell `data-state` enum (`empty` / `x` / `o`) plays the same role at the cell level.
- A side benefit: when the i18n bug `#BUG-3` is fixed, no spec needs updating — selectors don't care about text.

**How to apply:**
- New element interaction → first check `data-testid`. If the SUT lacks one, file a bug rather than fall back to brittle CSS.
- New wait → use the SUT's own attribute (`data-status` / `data-state` / element disabled) via `browser.waitUntil` or `waitForDisplayed`. Never `browser.pause`.
- New assertion on user-visible text → regex literal via `escapeRegex(...)` for partial matches; reserve exact-text matches for stable, copy-frozen labels.

---

## DEC-5 — Per-test reset via `resetAndOpen`, not `beforeTest`

**Decision:** Each spec calls `await resetAndOpen()` in its own `beforeEach` to land on a fresh, logged-out auth card. The `wdio.conf.ts → beforeTest` hook is left empty.

**Why:**
- WDIO's `beforeTest` for Mocha fires AFTER the spec's own `beforeEach`, not before. That meant a spec's `beforeEach` calling `registerAndLand()` was hitting `about:blank` because the navigation in `beforeTest` hadn't run yet (verified by adding diagnostic logging — the failing spec showed `url: about:blank`, no testids in DOM). Auth specs only worked accidentally, because they had no `beforeEach` and their `it` bodies happened to fire after `beforeTest`.
- Moving the reset to a fixture helper called explicitly from each spec's `beforeEach` makes the order unambiguous and removes the silent dependency on a wdio hook that runs at a non-obvious time.
- `resetAndOpen` is also the right entry point for the "switch user but preserve theme/lang" scenarios (`TC-THM-02`): those tests do *not* call `resetAndOpen` between users; they log out and log back in, which keeps the global prefs in localStorage intact.

**How to apply:** every new spec gets `beforeEach(resetAndOpen)` at the top of its outer `describe`. If a spec also needs an authenticated user, chain `registerAndLand()` either in the same `beforeEach` or inside the `it`.

---

## DEC-6 — `localStorage` prefix abstraction

**Decision:** The SUT prefixes every storage key with `ttt:` (`ttt:session`, `ttt:users`, `ttt:theme`, `ttt:lang`). `tests/utils/storage.ts` applies the prefix internally; spec code passes the unprefixed name (`readStorage('session')`).

**Why:** isolates specs from a deployment detail. If the SUT renamed the prefix tomorrow, only `storage.ts` would change.

---

## DEC-7 — `window.confirm` stubbing instead of WDIO alert API

**Decision:** Native confirm dialogs (mid-game difficulty change, Clear History, Delete Account) are handled by monkey-patching `window.confirm` from `tests/utils/confirm.ts` before the action that triggers them. `acceptNextConfirm()` / `cancelNextConfirm()` are the intent-named one-liners specs call.

**Why:** WDIO's `acceptAlert` / `dismissAlert` race the synchronous confirm; the dialog often resolves before the wait registers and the test hangs. Stubbing makes the response deterministic and the call site obvious.

---

## DEC-8 — Reporters: spec (console) + Allure (CI / share)

**Decision:** `spec` reporter for live console feedback, `@wdio/allure-reporter` for archived runs.

**Why:** Allure is the de-facto standard for WDIO test reports — reviewers can browse the HTML output without running the suite themselves, screenshots / failure traces are attached automatically, and the structure mirrors `describe`/`it`. Spec stays on for fast inline feedback during development.

**How to apply:**
- `npm test` writes `allure-results/` (raw JSON) alongside the spec console output.
- `npm run allure:serve` — quickest path: generates and opens the HTML report in one step (requires Java, bundled via `allure-commandline`).
- `npm run allure:generate && npm run allure:open` — split form, for CI artifact upload.
- Both `allure-results/` and `allure-report/` are gitignored.

---

## DEC-9 — Spec-file parallelism: `maxInstances = 4`

**Decision:** Run up to 4 spec files in parallel (`WDIO_MAX_INSTANCES`-overridable). Was `1` until verified safe.

**Why:**
- Each WDIO worker gets its own Chrome session — separate localStorage, cookies, and `window`. The `beforeEach(resetAndOpen)` pattern already isolates state *per test*; spreading specs across workers extends that isolation across the suite without code changes.
- The only shared resource is the nginx `app` container (or `http-server` on host), which is a static file server with no per-client state — concurrent reads of `index.html` are trivially safe.
- `uniqueUsername` uses `Date.now() + 6 chars of base36 random` ≈ 2 billion combinations per millisecond, so cross-worker username collisions don't happen in practice.
- Measured: 10 specs / 54 tests went from **~71 s** sequential to **~33 s** with 4 workers (~54 % faster). The Play spec (~17 s) is the floor; other workers finish around it.
- `maxInstances = 4` rather than "match CPU cores" because each Chrome instance is ~200 MB and the suite is small — 4 is enough to cover the long-pole spec without overprovisioning. Override with `WDIO_MAX_INSTANCES=N` (set to `1` when debugging a single spec to keep logs un-interleaved).

**How to apply:** new specs need no special setup — they just need to follow the existing `beforeEach(resetAndOpen)` pattern. Anything that introduces cross-spec shared state (e.g. a singleton seeded once globally) would break parallel safety; if such state is needed, isolate it per worker via `wdio` worker hooks.

---

*Further decisions to be added as they are made.*