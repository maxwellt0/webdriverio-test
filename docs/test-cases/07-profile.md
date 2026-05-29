# §7 — Profile view

Implements [plan §5.7](../TESTPLAN.md). For conventions / preconditions / test data see [README](README.md).

---

### TC-PRF-01

**Shows current name, Created date, and Win/Loss/Draw counts** — P0 — plan §5.7

- **Precondition**: PRE-USER; a freshly-registered user with no games played.
- **Steps**:
  1. Navigate to **Profile**.
- **Expected**:
  - Name input value matches the stored name (with original casing).
  - **Created** field shows a date close to "now" (within a few seconds).
  - **Win**, **Loss**, **Draw** counters all read `0`.

---

### TC-PRF-02

**Rename to a new unique name succeeds** — P0 — plan §5.7

- **Precondition**: PRE-USER as `Sara`; no user `Maya` exists.
- **Steps**:
  1. On Profile, change the name to `Maya` and click **Save**.
- **Expected**:
  - "Profile saved" message appears.
  - Nav greeting updates to "Hi, Maya".
  - After logout, login as `Maya` succeeds; login as `Sara` reports "no account".
  - `localStorage.users` no longer has a `sara` key; has a `maya` key.

---

### TC-PRF-03

**Rename to an existing other user fails** — P0 — plan §5.7

- **Precondition**: PRE-USER as `Sara`; a user `Maya` already exists.
- **Steps**:
  1. On Profile, change name to `Maya` (or `MAYA` / `maya` for case-insensitive coverage) and click **Save**.
- **Expected**:
  - Error: "This name is already taken."
  - Stored name and greeting unchanged.

---

### TC-PRF-04

**Rename to own name in different case succeeds (no self-collision)** — P0 — plan §5.7

- **Precondition**: PRE-USER as `Sara`.
- **Steps**:
  1. Rename to `SARA`.
- **Expected**:
  - Save succeeds.
  - Greeting and stored name update to `SARA`.

---

### TC-PRF-05

**Delete Account confirm — OK removes record, Cancel no-op** — P0 — plan §5.7

- **Precondition**: PRE-USER.
- **Steps**:
  1. Click **Delete Account**; **Cancel** the confirm. Verify still on Profile and user still exists.
  2. Click **Delete Account** again; **OK** the confirm.
  3. After landing on the auth card, switch to Sign-in and attempt to log in with the deleted name.
- **Expected**:
  - After Cancel: no change.
  - After OK: returns to auth card; `localStorage.users` no longer has the key; login attempt fails with "No account…".

---

### TC-PRF-06

**Rename name injection / XSS does not execute** — P0 — plan §5.7

- **Precondition**: PRE-USER; install `window.__xss = 0` probe.
- **Steps**: For each XSS payload (same list as [TC-REG-06](03-auth.md#tc-reg-06)):
  1. Rename via Profile to the payload and save.
  2. Visit nav greeting, Profile, History (after finishing a game with the renamed user).
  3. Read `window.__xss`.
- **Expected**:
  - Save succeeds (the literal payload becomes the new name).
  - `window.__xss === 0` everywhere.
  - Payload text rendered as escaped literal in greeting / profile / history rows.

---

### TC-PRF-07

**Stats update without requiring a reload after gameplay** — P1 — plan §5.7

- **Precondition**: PRE-USER; freshly registered (all counters `0`).
- **Steps**:
  1. Play one game to a Win, one to a Loss, one to a Draw (use easy / medium to force outcomes).
  2. Without reloading, navigate to **Profile**.
- **Expected**:
  - Win = 1, Loss = 1, Draw = 1.

---

### TC-PRF-08

**Profile rename rejects a name exceeding the maximum length** — P1, `pending:`[`#BUG-6`](../BUGS.md#bug-6--no-upper-length-limit-on-name-register-login-profile-rename) — plan §5.7

- **Precondition**: PRE-USER.
- **Steps**:
  1. On Profile, replace the name with a 500-character string and click **Save**.
- **Expected (target)**:
  - Inline error rejecting the over-length input; stored name unchanged.
- **Expected (current — regression check)**:
  - Save succeeds; the long name is stored and rendered in the nav greeting, breaking layout. See [#BUG-6](../BUGS.md#bug-6--no-upper-length-limit-on-name-register-login-profile-rename).