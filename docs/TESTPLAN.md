# Test Plan — Tic-Tac-Toe SUT

Strategic plan for validating the Tic-Tac-Toe app at `src/index.html`. This document describes **what** will be tested, at what priority, with what approach and risks. Concrete test cases (steps, expected results, IDs) live in a separate file/files under `docs/` and are written against this plan.

Sections 5 onward mirror the structure of [`EXPLORATION.md`](EXPLORATION.md) so each test-plan area traces back to observed behavior.

---

## 1. Scope & objective

Validate the critical correctness, persistence, and UX guarantees of the SUT — focusing on user-facing flows a real player would care about, plus the explicit risk areas identified in exploration (broken Hard AI, non-strategic Hint, missing translations, async computer move, RTL locale).

**Automation scope: P0 only.** P1/P2 are documented for completeness (and to make the deliberate choice to *not* automate them visible), but the deliverable suite covers only the critical flows.

Priority legend used throughout:
- **P0** — **in automation scope.** Failing P0 = the feature is unusable; not shipping.
- **P1** — important quality bar but not blocking; documented, not automated in this engagement.
- **P2** — manual / exploratory / deferred. Logged for completeness.

## 2. Out of scope

- Visual/CSS regression (pixel-diffing) — no design spec to assert against.
- Accessibility — no automated a11y checks in this engagement. ARIA roles / labels and keyboard navigation are observable in the SUT but a full audit (axe-core sweep, WCAG conformance, screen-reader walkthrough) is deferred to future work.
- Performance / load — single-user offline SPA, no meaningful load profile.
- Security beyond observing the name-injection risk (covered by the XSS test cases TC-REG-06 / TC-PRF-06) — no auth-server attack surface exists.
- Cross-browser — Chromium only (per the Docker setup); a real release would add at least Firefox + WebKit.
- Responsive / multi-viewport UI — tests run at a fixed 1280×900 desktop viewport. Per-breakpoint layout assertions and mobile gesture coverage are deferred to manual / future work.

## 3. Test approach

- **Framework**: WebdriverIO + Mocha + TypeScript (see `wdio.conf.ts`).
- **Environment**: two execution modes:
  - **Host-side** — `npm run serve` (http-server on `:8080`) in one terminal, `npm test` (WDIO against `http://localhost:8080`) in another. Fast iteration for spec authors.
  - **Fully dockerized** — `npm run docker:test`: brings up `app` (nginx) with a healthcheck, runs WDIO inside the `tests` container (Node + Chromium + chromedriver) against it, tears down. One command from clean checkout to green run; the canonical entry point for CI and reviewers.
- **Locator strategy**: `data-testid` only. The SUT exposes one on every interactive surface, so specs stay refactor-safe against visual changes and i18n string drift.
- **Isolation**: each spec starts with `localStorage` cleared and the page reloaded (defaults: logged-out, history-empty, language=en, theme=light). Tests generate unique usernames per run to keep records isolated even if the reset is bypassed.
- **Synchronization**: never `browser.pause`. Tests wait on `status` `data-status`, `cell-N` `data-state`, or element disabled/enabled state. The ~1.5 s computer-move delay is a deliberate signal, not noise to absorb.
- **Determinism**:
  - Easy/Hard moves look random — assertions cannot depend on which cell the computer picks.
  - Medium is rule-based and effectively deterministic given board state — usable for forced win/block scenarios.
  - Confirm dialogs (`window.confirm`) are handled by monkey-patching `window.confirm` via `browser.execute` before the triggering action — WDIO's native alert API races the synchronous confirm and hangs. See `DECISIONS.md` DEC-7.
- **Localization assertions**: pull expected strings from a small en/fa key map maintained alongside the specs (single source of truth), not hardcoded throughout. This isolates the suite from string churn and from #BUG-3.
- **Known-bug handling**: scenarios that would currently fail due to a logged bug are marked **`pending:#BUG-N`** in this plan; their corresponding cases document both the target and the current (broken) behavior but are not automated this engagement (see `DECISIONS.md` DEC-3) — the filed bug is the deliverable.

## 4. Test data

- **Usernames**: `user_<timestamp>_<rand>` per spec to guarantee uniqueness and avoid bleed if storage isn't reset.
- **Board state seeding**: prefer clicking through real move sequences for realism. Use `localStorage` seeding only where click sequences would be brittle (e.g. testing the history cap, profile stats with many entries).

---

## 5. Coverage areas

The remaining sections map 1-to-1 to `EXPLORATION.md`. Each area lists the **aspects under test** and a priority, not concrete cases.

### 5.1 Environment & entry *(maps to [EXPLORATION §1](EXPLORATION.md#1-environment--entry))*

- **P1** — page loads with title "Tic-Tac-Toe" and the auth card visible.
- **P1** — DevTools console shows version `v0.0.9-beta` and emits no errors/warnings/unhandled rejections during normal use (useful smoke + canary for regressions).
- **P2** — works offline (no network requests issued).

### 5.2 Header — language & theme controls *(maps to [EXPLORATION §2](EXPLORATION.md#2-persistent-ui--header-always-visible))*

- **P0** — both controls are present and functional on every view (auth, play, profile, history).
- **P0** — language switch flips `<html lang>`, `<html dir>`, and translates labels.
- **P0** — theme toggle flips `<html data-theme>` and updates the button label to the next-theme value.
- **P0** — both selections persist across reload.
- **P1** — both are global (not per-user): persist across logout / login as a different user.

### 5.3 Authentication *(maps to [EXPLORATION §3](EXPLORATION.md#3-authentication))*

#### 5.3.1 Register *(maps to [EXPLORATION §3.1](EXPLORATION.md#31-register-create-account))*
- **P0** — happy path: valid new name → user created, signed in, lands on Play view.
- **P0** — validation: empty, whitespace-only, 1-character, and duplicate name (case-insensitive) → correct inline error, stays on auth view.
- **P0** — **name injection / XSS**: a name containing HTML/JS payloads (`<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`, `"><svg onload=alert(1)>`, `javascript:` URIs) registers without executing the payload, and the literal text is rendered safely everywhere the name appears (auth greeting, nav, avatar tooltip, profile, history).
- **P1** — case preservation: stored display name keeps the user's original casing.
- **P1** — input edge cases:
  - leading / trailing whitespace is either trimmed before storage or treated consistently for uniqueness checks (no `"Sara"` ≠ `" Sara "` ambiguity);
  - very long names (e.g. ≥256 chars) are either rejected or rendered without breaking layout;
  - Unicode (emoji, combining marks, RTL marks, zero-width chars) renders correctly and does not confuse uniqueness;
  - non-printable / control characters are rejected or rendered safely.

#### 5.3.2 Login *(maps to [EXPLORATION §3.2](EXPLORATION.md#32-login-sign-in))*
- **P0** — happy path: existing name → signed in, lands on Play.
- **P0** — non-existent name → `authErrorNotFound`.
- **P0** — empty / whitespace → `authErrorEmpty`.
- **P1** — case-insensitive lookup: registered "Sara" can log in as "SARA" / "sara".

#### 5.3.3 Mode switching *(maps to [EXPLORATION §3.3](EXPLORATION.md#33-mode-switching))*
- **P1** — switching modes via the link clears any displayed error.
- **P1** — name field receives focus after the card renders.

### 5.4 Navigation *(maps to [EXPLORATION §4](EXPLORATION.md#4-navigation-post-login))*

- **P0** — after login the nav appears with Play / Profile / History / Log Out, plus the avatar + greeting.
- **P0** — clicking each nav item switches the active view; the active item is visually highlighted.
- **P0** — Log Out clears the session and returns to the auth card.
- **P1** — avatar shows the uppercase initial of the player's stored name.
- **P1** — greeting uses the user's stored capitalization (not the lowercased form).

### 5.5 Play view *(maps to [EXPLORATION §5](EXPLORATION.md#5-play-view))*

#### 5.5.1 Layout & status pill *(maps to [EXPLORATION §5.1](EXPLORATION.md#51-status-pill--observed-states))*
- **P0** — initial state shows "Your turn (X)".
- **P0** — status transitions correctly: human-turn → computer-thinking → human-turn → … → win / loss / draw.
- **P0** — `data-status` attribute reflects each state and is the canonical sync signal for the suite.

#### 5.5.2 Board behavior *(maps to [EXPLORATION §5.2](EXPLORATION.md#52-board-behavior))*
- **P0** — clicking an empty cell places X immediately.
- **P0** — clicking an occupied cell is a no-op (cell stays as it was; no error).
- **P0** — cells are disabled while `data-status="computer-thinking"`.
- **P0** — all cells disabled after the game ends until **New Game** / **Reset**.
- **P1** — winning line cells receive the "is-win" visual style.
- **P1** — hinted cell is visually distinct until the human plays.

#### 5.5.3 Computer behavior *(maps to [EXPLORATION §5.3](EXPLORATION.md#53-computer-behavior))* — **major bug area**
- **P0** — computer never plays into an occupied cell (Easy & Medium).
- **P1 pending:#BUG-1** — Hard difficulty should be unwinnable and must not overwrite a played cell. **Currently broken** (Symptoms A + B). Documented; not automated this engagement.
- **P1** — Medium correctly takes immediate wins and blocks immediate threats. Documented; not automated this engagement (needs deterministic board-state seeding).
- **P1** — the ~1.5 s think delay is consistently observable (status flips to `computer-thinking` for a measurable window).

#### 5.5.4 Hint button *(maps to [EXPLORATION §5.4](EXPLORATION.md#54-hint-button))* — **bug area**
- **P0** — disabled while computer is thinking, after game over, and when it isn't the human's turn.
- **P0** — enabled on the human's turn during an active game.
- **P1 pending:#BUG-2** — hint should suggest a strategically useful move (winning move when one exists; blocking move when an immediate threat exists). **Currently broken** — picks an arbitrary empty cell. Regression-check assertion until fixed.
- **P1** — hint highlight clears after the human plays any cell.

#### 5.5.5 New Game *(maps to [EXPLORATION §5.5](EXPLORATION.md#55-new-game))*
- **P0** — clears the board, status returns to "Your turn", difficulty preserved.

#### 5.5.6 Reset *(maps to [EXPLORATION §5.6](EXPLORATION.md#56-reset))*
- **P0** — behaves equivalently to **New Game**. (If a meaningful difference emerges in implementation, split the cases.)

#### 5.5.7 Difficulty selector *(maps to [EXPLORATION §5.7](EXPLORATION.md#57-difficulty-selector))*
- **P0** — selector reflects the persisted user preference on login.
- **P0** — changing difficulty before any move applies immediately.
- **P0** — changing difficulty mid-game (with moves on the board) triggers a confirm dialog; OK clears the board with the new difficulty, Cancel reverts.
- **P0** — difficulty change persists to the user record (re-login → still set).
- **P2** — selector lacks a dropdown caret ([#BUG-4](BUGS.md#bug-4--difficulty-selector-lacks-a-dropdown-affordance)) — UX issue, no functional test.

### 5.6 History view *(maps to [EXPLORATION §6](EXPLORATION.md#6-history-view))*

- **P0** — empty state ("No games yet. Play one!") shown for a fresh user.
- **P0** — finishing a game appends one entry; New Game does not duplicate; Reset before game-end does not record.
- **P0** — table columns (Date, Difficulty, Result) reflect the underlying game.
- **P0** — newest entry first.
- **P0** — Clear History triggers a confirm; OK clears all rows, Cancel keeps them.
- **P1** — Clear History scopes to the current user only: clearing one user's history leaves another user's history untouched (no cross-user data loss in the shared `users` store).
- **P1** — date formatting uses the active locale (Gregorian for `en`, **Persian Solar Hijri / Jalali** for `fa`) — test the Jalali path, not just "different string".
- **P1** — table caps at 100 rows (seed via localStorage to validate).

### 5.7 Profile view *(maps to [EXPLORATION §7](EXPLORATION.md#7-profile-view))*

- **P0** — shows current name, "Created" date, and Win/Loss/Draw counts derived from history.
- **P0** — rename to a new unique name succeeds; greeting updates; subsequent login uses the new name.
- **P0** — rename to another existing user (case-insensitive) → `profileErrorExists`.
- **P1** — rename to own name in different case → succeeds (no self-collision false positive).
- **P0** — Delete Account triggers a confirm; OK removes the user record (re-login attempt → `authErrorNotFound`), Cancel is a no-op.
- **P1** — stats counts update after gameplay without requiring a reload.

### 5.8 Theming *(maps to [EXPLORATION §8](EXPLORATION.md#8-theming-details))*

- **P0** — theme toggle instantaneously updates the active theme (no flash, no layout shift).
- **P0** — theme persists across reload, across logout, and across multi-user switches (global preference).

### 5.9 Localization *(maps to [EXPLORATION §9](EXPLORATION.md#9-localization-details))* — **bug area**

- **P0** — language switch translates all visible labels (where translations exist), flips RTL/LTR layout, persists across reload.
- **P1 pending:#BUG-3** — game title and subtitle should translate to Persian. **Currently broken**. Documented; not automated this engagement.
- **P1** — language switch mid-game does **not** reset the board.
- **P1** — translation sweep: walk every view in `fa` mode, assert no English-text bleeds into translated UI (driven from the en/fa key map; catches sibling missed-translation bugs beyond #BUG-3).
- **P1** — Jalali calendar correctness: history dates in `fa` mode are Jalali (different month names, different year), not translated Gregorian.

### 5.10 Persistence *(maps to [EXPLORATION §10](EXPLORATION.md#10-persistence-summary-what-survives-a-reload))*

- **P0** — theme, language, session, and user records survive reload.
- **P0** — in-progress game board does **not** survive reload (reload → fresh empty board).
- **P0** — currently selected view (Profile/History) does not survive reload; user lands on Play.
- **P1** — logout clears session but keeps user records (login again works).
- **P1** — localStorage corruption (non-JSON in `users`) → app falls back gracefully (still loads, no crash).

### 5.11 Browser confirm dialogs *(maps to [EXPLORATION §11](EXPLORATION.md#11-browser-confirm-dialogs))*

- **P0** — three sites use `window.confirm`: mid-game difficulty change, Clear History, Delete Account. Each is exercised with both **OK** and **Cancel** paths in its respective area above; this section just ensures the suite has a consistent confirm-handling helper.

---

## 6. Entry & exit criteria

- **Entry**: SUT is reachable at the `WDIO_BASE_URL` configured for the run (host-side: `http://localhost:8080` after `npm run serve`; dockerized: `http://app` after the compose healthcheck goes green).
- **Exit (per merge)**: all P0 scenarios pass (or are explicitly `pending:#BUG-N` with the reference); typecheck clean; no console errors during runs.
- **Exit (engagement)**: P0 fully automated, P1/P2 documented but explicitly out of automation scope, bugs filed for everything the suite cannot validate today, README + DECISIONS up to date.

## 7. Deliverables

- Exploration notes (`docs/EXPLORATION.md`).
- This plan (`docs/TESTPLAN.md`).
- Test cases (`docs/test-cases/` — one file per area, see [`README`](test-cases/README.md)).
- Bug reports (`docs/BUGS.md`).
- Test-automation design decisions + rationale (`docs/DECISIONS.md`).
- Automated specs covering **P0 only** (`tests/specs/`).
- CI pipeline running the suite + quality gates and publishing the Allure report (`.github/workflows/ci.yml` — see `DECISIONS.md` DEC-10).
- README orienting reviewers (`README.md`).