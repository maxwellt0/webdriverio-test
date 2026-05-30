# Test Cases — Tic-Tac-Toe SUT

Concrete test cases derived from the [test plan](../TESTPLAN.md). One file per area, mirroring [`TESTPLAN.md §5`](../TESTPLAN.md#5-coverage-areas), which in turn mirrors [`EXPLORATION.md`](../EXPLORATION.md).

## Files

| #  | File                             | Area                                                  | Plan  | Cases                                                  |
|----|----------------------------------|-------------------------------------------------------|-------|--------------------------------------------------------|
| 01 | [Environment](01-environment.md) | Page load, console                                    | §5.1  | TC-ENV-01..02                                          |
| 02 | [Header](02-header.md)           | Language & theme controls                             | §5.2  | TC-HDR-01..05                                          |
| 03 | [Authentication](03-auth.md)     | Register / Login / Mode switching                     | §5.3  | TC-REG-01..09, TC-LGN-01..06, TC-MOD-01..02            |
| 04 | [Navigation](04-navigation.md)   | Nav bar                                               | §5.4  | TC-NAV-01..04                                          |
| 05 | [Play](05-play.md)               | Status / Board / AI / Hint / New / Reset / Difficulty | §5.5  | TC-STAT, TC-BRD, TC-AI, TC-HNT, TC-NEW, TC-RST, TC-DIF |
| 06 | [History](06-history.md)         | History view                                          | §5.6  | TC-HIS-01..11                                          |
| 07 | [Profile](07-profile.md)         | Profile view                                          | §5.7  | TC-PRF-01..08                                          |
| 08 | [Theme](08-theme.md)             | Theming                                               | §5.8  | TC-THM-01..02                                          |
| 09 | [Localization](09-i18n.md)       | i18n + Jalali dates                                   | §5.9  | TC-I18N-01..05                                         |
| 10 | [Persistence](10-persistence.md) | Reload survival                                       | §5.10 | TC-PRS-01..05                                          |

Browser confirm dialogs (plan §5.11) are exercised inside the cases that own each feature — TC-DIF-03/04 (difficulty), TC-HIS-07 (clear history), TC-PRF-05 (delete account).

## Conventions

- **ID format**: `TC-<AREA>-<NN>` (zero-padded, sequential per area).
- **Priority**: `P0` (in automation scope), `P1` / `P2` (documented only — see [plan §1](../TESTPLAN.md#1-scope--objective)).
- **`pending:#BUG-N`** means the expected behavior is currently violated by the referenced bug. These cases document both the target behavior and the current (broken) behavior, but are **not automated this engagement** (see [DEC-3](../DECISIONS.md)) — the filed bug is the deliverable.
- Every P0 case is implemented by a Mocha spec in `tests/specs/`; the spec docblock references its TC ID.
- Locators use `data-testid`. The mapping selector ↔ feature lives in the specs, not here.

## Common preconditions

- **PRE-CLEAN**: SUT served at `WDIO_BASE_URL`; browser `localStorage` cleared and page reloaded; default language `en`, default theme `light`, no signed-in user.
- **PRE-USER**: As PRE-CLEAN, plus a registered user `user_<timestamp>_<rand>` is signed in (on the Play view).

## Test data

- **Username**: `user_<timestamp>_<6 random alphanumeric>` — see [plan §4](../TESTPLAN.md#4-test-data).
- **XSS payloads**: `<script>window.__xss=1</script>`, `<img src=x onerror=window.__xss=1>`, `"><svg onload=window.__xss=1>`, `javascript:window.__xss=1`. Assertion: `window.__xss !== 1` at every render site.
- **Long-name payload**: `'A'.repeat(500)`.

## Bug ↔ test-case coverage

Every bug in [`BUGS.md`](../BUGS.md) is covered by at least one test case (regression check, or asserting the expected post-fix behavior).

| Bug                                                                                     | Severity | Covered by                                                                                                                                                            |
|-----------------------------------------------------------------------------------------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [#BUG-1](../BUGS.md#bug-1--hard-difficulty-weak-play-and-overwrites-the-humans-move)    | Critical | [TC-AI-02](05-play.md#tc-ai-02), [TC-AI-05](05-play.md#tc-ai-05)                                                                                                      |
| [#BUG-2](../BUGS.md#bug-2--hint-does-not-suggest-a-strategic-move)                      | Medium   | [TC-HNT-04](05-play.md#tc-hnt-04)                                                                                                                                     |
| [#BUG-3](../BUGS.md#bug-3--game-title-and-subtitle-are-not-translated-to-persian)       | Medium   | [TC-I18N-02](09-i18n.md#tc-i18n-02)                                                                                                                                   |
| [#BUG-4](../BUGS.md#bug-4--difficulty-selector-lacks-a-dropdown-affordance)             | Low      | [TC-DIF-06](05-play.md#tc-dif-06)                                                                                                                                     |
| [#BUG-5](../BUGS.md#bug-5--missing-padding-above-the-game-history-header)               | Low      | [TC-HIS-10](06-history.md#tc-his-10)                                                                                                                                  |
| [#BUG-6](../BUGS.md#bug-6--no-upper-length-limit-on-name-register-login-profile-rename) | Low      | [TC-REG-09](03-auth.md#tc-reg-09), [TC-LGN-05](03-auth.md#tc-lgn-05), [TC-PRF-08](07-profile.md#tc-prf-08) (plus the broader [TC-REG-08](03-auth.md#tc-reg-08) sweep) |