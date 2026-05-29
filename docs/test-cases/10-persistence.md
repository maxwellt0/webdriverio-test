# §10 — Persistence

Implements [plan §5.10](../TESTPLAN.md). For conventions / preconditions / test data see [README](README.md).

---

### TC-PRS-01

**Theme, language, session, and user records survive reload** — P0 — plan §5.10

- **Precondition**: PRE-USER; theme `dark`; language `fa`.
- **Steps**:
  1. Reload the page.
  2. Read `<html data-theme>`, `<html lang>`, `localStorage.session`, `localStorage.users`.
- **Expected**:
  - `data-theme="dark"`, `lang="fa"`.
  - Session still points to the same user.
  - User record still present.

---

### TC-PRS-02

**In-progress game board does NOT survive reload** — P0 — plan §5.10

- **Precondition**: PRE-USER; play at least one human move (board not empty).
- **Steps**:
  1. Capture the board state.
  2. Reload.
- **Expected**:
  - All 9 cells have `data-state="empty"` after reload; the user is still signed in but the in-progress game is discarded.

---

### TC-PRS-03

**Reload always lands on the Play view** — P0 — plan §5.10

- **Precondition**: PRE-USER; navigate to **Profile**.
- **Steps**:
  1. Reload while on Profile.
  2. Repeat starting from History.
- **Expected**:
  - In both cases the post-reload active view is **Play** (regardless of pre-reload view).

---

### TC-PRS-04

**Logout clears session but keeps user record** — P1 — plan §5.10

- **Precondition**: PRE-USER.
- **Steps**:
  1. Log out.
  2. Inspect `localStorage`.
  3. In Sign-in mode, log in with the same name.
- **Expected**:
  - `localStorage.session` is absent / null after logout.
  - `localStorage.users` still contains the user record.
  - Login succeeds; greeting matches the previously stored name.

---

### TC-PRS-05

**LocalStorage corruption fallback** — P1 — plan §5.10

- **Precondition**: PRE-CLEAN.
- **Steps**:
  1. Set `localStorage.users = 'not-json{'` (deliberately invalid JSON).
  2. Reload.
- **Expected**:
  - App loads without crashing; auth card is visible.
  - Console shows no unhandled exception (a single benign log is acceptable).
  - Subsequent register flow works normally (the bad value is either overwritten or ignored).
- **Notes**: P1 — documented only, not automated this engagement.