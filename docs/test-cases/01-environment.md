# §1 — Environment & entry

Implements [plan §5.1](../TESTPLAN.md). For conventions / preconditions / test data see [README](README.md).

---

### TC-ENV-01

**Page loads with the correct title and auth card visible** — P1 — plan §5.1

- **Precondition**: PRE-CLEAN.
- **Steps**:
  1. Navigate to `/`.
  2. Wait until `document.readyState === 'complete'`.
- **Expected**:
  - `document.title === 'Tic-Tac-Toe'`.
  - The auth card (register/login form) is visible.
  - No nav bar is shown.

---

### TC-ENV-02

**Version printed in console; no errors / warnings** — P1 — plan §5.1

- **Precondition**: PRE-CLEAN.
- **Steps**:
  1. Collect browser console messages from page load through 2 s of idle.
  2. Interact with one trivial control (e.g. toggle theme) to exercise normal use.
  3. Re-collect console messages.
- **Expected**:
  - Exactly one `log` entry matches `/^v\d+\.\d+\.\d+(-\w+)?$/` (currently `v0.0.9-beta`).
  - Zero entries with level `error` or `warning`.
  - Zero unhandled promise rejections.