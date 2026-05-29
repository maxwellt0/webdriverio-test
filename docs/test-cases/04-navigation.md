# §4 — Navigation

Implements [plan §5.4](../TESTPLAN.md). For conventions / preconditions / test data see [README](README.md).

---

### TC-NAV-01

**Nav appears after login with all entries** — P0 — plan §5.4

- **Precondition**: PRE-USER.
- **Steps**:
  1. Inspect the nav bar.
- **Expected**:
  - Visible entries: avatar, greeting, **Play**, **Profile**, **History**, **Log Out**.
  - Active item is **Play**.

---

### TC-NAV-02

**Each nav item switches view and updates active state** — P0 — plan §5.4

- **Precondition**: PRE-USER.
- **Steps**:
  1. Click **Profile** → verify Profile view rendered; **Profile** highlighted.
  2. Click **History** → verify History view; **History** highlighted.
  3. Click **Play** → verify Play view; **Play** highlighted.
- **Expected**:
  - View switches as expected; the active nav item is visually marked (only one at a time).

---

### TC-NAV-03

**Log Out clears session and returns to auth card** — P0 — plan §5.4

- **Precondition**: PRE-USER.
- **Steps**:
  1. Click **Log Out**.
  2. Reload.
- **Expected**:
  - Auth card is shown; nav bar is hidden.
  - `localStorage.session` is cleared.
  - `localStorage.users` still contains the user record.

---

### TC-NAV-04

**Avatar shows uppercase initial; greeting preserves casing** — P1 — plan §5.4

- **Precondition**: PRE-USER as `sara`.
- **Steps**:
  1. Read the avatar disc text and the greeting text.
- **Expected**:
  - Avatar disc shows `S`.
  - Greeting shows `Hi, sara`.