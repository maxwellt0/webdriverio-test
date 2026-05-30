# §3 — Authentication

Implements [plan §5.3](../TESTPLAN.md). For conventions / preconditions / test data see [README](README.md).

Covers Register (§3.1), Login (§3.2), Mode switching (§3.3).

---

## §3.1 Register

### TC-REG-01

**Happy path: register with a valid new name** — P0 — plan §5.3.1

- **Precondition**: PRE-CLEAN.
- **Steps**:
  1. Enter a unique username (per "Test data").
  2. Submit.
- **Expected**:
  - Auth card disappears; Play view is shown.
  - Nav bar shows greeting with the entered name (original casing).
  - A user record is persisted in `localStorage` under `users`, keyed by the lowercased name.
  - A session record exists under `session`.

---

### TC-REG-02

**Reject empty name** — P0 — plan §5.3.1

- **Precondition**: PRE-CLEAN.
- **Steps**:
  1. Submit the register form with the name field empty.
- **Expected**:
  - Inline error: "Please enter your name."
  - Stays on auth view; no user created.

---

### TC-REG-03

**Reject whitespace-only name** — P0 — plan §5.3.1

- **Precondition**: PRE-CLEAN.
- **Steps**:
  1. Submit with the name field containing only spaces / tabs.
- **Expected**:
  - Same error as TC-REG-02 (whitespace counts as empty after trim).

---

### TC-REG-04

**Reject 1-character name** — P0 — plan §5.3.1

- **Precondition**: PRE-CLEAN.
- **Steps**:
  1. Submit with name `A`.
- **Expected**:
  - Inline error: "Name must be at least 2 characters."
  - Stays on auth view; no user created.

---

### TC-REG-05

**Reject duplicate name (case-insensitive)** — P0 — plan §5.3.1

- **Precondition**: PRE-CLEAN; a user `Sara` already exists in `users`.
- **Steps**:
  1. Attempt to register with name `sara` (different case).
  2. Repeat with `SARA`.
- **Expected**:
  - Inline error: "An account with this name already exists." for both.
  - Existing record unchanged.

---

### TC-REG-06

**Name injection / XSS does not execute** — P0 — plan §5.3.1

- **Precondition**: PRE-CLEAN; install a probe: `await browser.execute(() => { window.__xss = 0 })`.
- **Steps**: For each XSS payload in "Test data":
  1. Submit register with the payload as the name.
  2. After landing on Play, visit Profile and History.
  3. Read `window.__xss`.
- **Expected**:
  - Account is created with the literal payload as the stored name.
  - `window.__xss === 0` at every step (no payload executed).
  - The literal payload text is visible (HTML-escaped) wherever the name renders — nav greeting, avatar tooltip, profile name field, history rows (if any).
- **Notes**: Strong-signal security check. If `window.__xss === 1`, raise a Critical bug under [`BUGS.md`](../BUGS.md) and tag the test accordingly.

---

### TC-REG-07

**Stored name preserves original casing** — P1 — plan §5.3.1

- **Precondition**: PRE-CLEAN.
- **Steps**:
  1. Register `SaRa`.
  2. Read the nav greeting text.
- **Expected**:
  - Greeting reads "Hi, SaRa" (original casing preserved in display).

---

### TC-REG-08

**Input edge cases (sweep)** — P1 — plan §5.3.1

- **Precondition**: PRE-CLEAN.
- **Steps**: For each of: leading/trailing whitespace (`"  Sara  "`), very long name (≥256 chars — covered standalone in [TC-REG-09](#tc-reg-09)), emoji / combining marks, zero-width chars, control chars (``): submit register, then attempt re-register with the same input and with a stripped variant.
- **Expected**:
  - Whitespace either trimmed or consistently treated for uniqueness (no `"Sara"` vs `" Sara "` collision ambiguity).
  - Long names rejected with an inline upper-bound error (currently fails — see [#BUG-6](../BUGS.md#bug-6--no-upper-length-limit-on-name-register-login-profile-rename)).
  - Unicode renders correctly and does not confuse uniqueness lookups.
  - Control characters rejected or rendered safely.
- **Notes**: P1 — documented only, not automated this engagement.

---

### TC-REG-09

**Reject name exceeding the maximum length** — P1, `pending:`[`#BUG-6`](../BUGS.md#bug-6--no-upper-length-limit-on-name-register-login-profile-rename) — plan §5.3.1

- **Precondition**: PRE-CLEAN.
- **Steps**:
  1. Submit register with a 500-character name (`'A'.repeat(500)`).
- **Expected (target)**:
  - Inline error: "Name is too long" (or equivalent ≤ max-length message).
  - Stays on auth view; no user created.
- **Expected (current — regression check)**:
  - Form accepts the input; the long name is stored as-is and rendered in the nav greeting, breaking layout. See [#BUG-6](../BUGS.md#bug-6--no-upper-length-limit-on-name-register-login-profile-rename).

---

## §3.2 Login

### TC-LGN-01

**Happy path: login with an existing name** — P0 — plan §5.3.2

- **Precondition**: PRE-CLEAN; a user `Sara` exists.
- **Steps**:
  1. Switch auth mode to "Sign in".
  2. Enter `Sara` and submit.
- **Expected**:
  - Lands on Play view; nav greets "Hi, Sara".

---

### TC-LGN-02

**Case-insensitive lookup** — P1 — plan §5.3.2

- **Precondition**: PRE-CLEAN; user `Sara` exists.
- **Steps**:
  1. In Sign-in mode, submit `SARA`.
  2. Repeat with `sara`.
- **Expected**:
  - Both succeed; greeting always shows the *stored* casing (`Sara`).

---

### TC-LGN-03

**Reject non-existent name** — P0 — plan §5.3.2

- **Precondition**: PRE-CLEAN; no user `Ghost` exists.
- **Steps**:
  1. In Sign-in mode, submit `Ghost`.
- **Expected**:
  - Inline error: "No account with this name. Sign up first."
  - Stays on auth view.

---

### TC-LGN-04

**Reject empty / whitespace name** — P0 — plan §5.3.2

- **Precondition**: PRE-CLEAN.
- **Steps**:
  1. In Sign-in mode, submit empty / whitespace-only name.
- **Expected**:
  - Inline error: "Please enter your name."

---

### TC-LGN-05

**Reject login name exceeding maximum length** — P1, `pending:`[`#BUG-6`](../BUGS.md#bug-6--no-upper-length-limit-on-name-register-login-profile-rename) — plan §5.3.2

- **Precondition**: PRE-CLEAN.
- **Steps**:
  1. In Sign-in mode, submit a 500-character name.
- **Expected (target)**:
  - Inline error rejecting the over-length input.
- **Expected (current — regression check)**:
  - Form accepts the input and proceeds to the user-lookup step. See [#BUG-6](../BUGS.md#bug-6--no-upper-length-limit-on-name-register-login-profile-rename).

---

### TC-LGN-06

**Log out and log back in as the same user** — P1 — plan §5.3.2

- **Precondition**: PRE-USER (a freshly registered user, signed in on the Play view).
- **Steps**:
  1. Note the stored name (original casing).
  2. Click **Log Out** — the auth card returns.
  3. Switch to **Sign in** mode.
  4. Enter the same name and submit.
- **Expected**:
  - Lands on the Play view; nav greeting shows the same stored name.
  - A `session` record exists again; `localStorage.users` still has exactly the one record (no duplicate created).
- **Notes**: Round-trips the session lifecycle within one browser session. Complements [TC-PRS-04](10-persistence.md#tc-prs-04) (storage-level assertions on the same flow) and [TC-NAV-03](04-navigation.md#tc-nav-03) (logout only).

---

## §3.3 Mode switching

### TC-MOD-01

**Switching mode clears the prior error** — P1 — plan §5.3.3

- **Precondition**: PRE-CLEAN.
- **Steps**:
  1. In Register mode, submit empty name (error shown).
  2. Click the "Sign in" link to switch modes.
- **Expected**:
  - The error message is no longer displayed.

---

### TC-MOD-02

**Name field receives focus on render** — P1 — plan §5.3.3

- **Precondition**: PRE-CLEAN.
- **Steps**:
  1. Open the page.
  2. Switch between Register and Sign-in.
- **Expected**:
  - In both modes, the name field is the active (focused) element on render.