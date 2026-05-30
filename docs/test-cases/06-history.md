# §6 — History view

Implements [plan §5.6](../TESTPLAN.md). For conventions / preconditions / test data see [README](README.md).

---

### TC-HIS-01

**Empty state shown for a fresh user** — P0 — plan §5.6

- **Precondition**: PRE-USER (no games yet).
- **Steps**:
  1. Navigate to **History**.
- **Expected**:
  - The empty-state message "No games yet. Play one!" is visible.
  - No table rows rendered.
  - No **Clear History** button.

---

### TC-HIS-02

**Finishing a game appends exactly one history row** — P0 — plan §5.6

- **Precondition**: PRE-USER; difficulty `easy`; History view initially empty.
- **Steps**:
  1. Play a game to completion.
  2. Navigate to **History**.
- **Expected**:
  - History table has exactly one row.
  - Result column matches the actual game outcome.

---

### TC-HIS-03

**New Game does not duplicate the previous history row** — P0 — plan §5.6

- **Precondition**: One finished game in history (per TC-HIS-02).
- **Steps**:
  1. Click **New Game** on the Play view.
  2. Navigate to **History**.
- **Expected**:
  - History row count unchanged (still 1).

---

### TC-HIS-04

**Reset before game-end does not record anything** — P0 — plan §5.6

- **Precondition**: PRE-USER; empty history; at least one human move played but the game not over.
- **Steps**:
  1. Click **Reset**.
  2. Navigate to **History**.
- **Expected**:
  - History remains empty / row count unchanged.

---

### TC-HIS-05

**Table columns reflect actual game data** — P0 — plan §5.6

- **Precondition**: PRE-USER; play a game on `medium` ending in a draw.
- **Steps**:
  1. Navigate to **History**.
  2. Inspect the first row's three columns.
- **Expected**:
  - **Date** column shows a date close to "now" (within a few seconds).
  - **Difficulty** column shows "Medium" (or localized equivalent).
  - **Result** column shows "Draw".

---

### TC-HIS-06

**Newest entry appears first** — P0 — plan §5.6

- **Precondition**: PRE-USER; empty history.
- **Steps**:
  1. Play game A to completion on `easy` (force a quick result).
  2. Play game B to completion on `hard`.
  3. Navigate to **History**.
- **Expected**:
  - Row 0 corresponds to game B (Difficulty = Hard).
  - Row 1 corresponds to game A.

---

### TC-HIS-07

**Clear History confirm — OK clears, Cancel keeps** — P0 — plan §5.6

- **Precondition**: PRE-USER; ≥ 1 row in history.
- **Steps**:
  1. Click **Clear History**.
  2. **Cancel** the confirm dialog; verify rows are unchanged.
  3. Click **Clear History** again; **OK** the confirm dialog.
- **Expected**:
  - After Cancel: rows unchanged.
  - After OK: history reverts to empty state ("No games yet…").

---

### TC-HIS-08

**Date column uses the active locale** — P1 — plan §5.6

- **Precondition**: PRE-USER; ≥ 1 row in history.
- **Steps**:
  1. Set language to `en`; read the date cell text.
  2. Set language to `fa`; re-read.
- **Expected**:
  - `en`: Gregorian formatting (e.g. `M/D/YYYY, h:mm:ss A`).
  - `fa`: Persian Solar Hijri (Jalali) calendar with Persian digits — different month names (Farvardin / Ordibehesht / …) and a different year. See also [TC-I18N-05](09-i18n.md#tc-i18n-05).

---

### TC-HIS-09

**Table caps at 100 rows** — P1 — plan §5.6

- **Precondition**: PRE-USER; seed the user's `history` array in `localStorage` with 101 fabricated entries (oldest at the tail).
- **Steps**:
  1. Reload the page.
  2. Navigate to **History**.
- **Expected**:
  - The table has exactly 100 rows.
  - The oldest seeded entry (index 100) is not present.

---

### TC-HIS-10

**Missing padding above the Game History header** — P2, `pending:`[`#BUG-5`](../BUGS.md#bug-5--missing-padding-above-the-game-history-header) — plan §5.6

- Documentation-only. Not automated. The History view header sits flush against the nav bar, missing the breathing room used on other views. See [#BUG-5](../BUGS.md#bug-5--missing-padding-above-the-game-history-header).

---

### TC-HIS-11

**Clearing history affects only the current user** — P1 — plan §5.6

- **Precondition**: PRE-CLEAN. Two users each with ≥ 1 finished game in their own history:
  1. Register user A; play a game to completion (A now has ≥ 1 history row).
  2. Log out; register user B; play a game to completion (B now has ≥ 1 history row).
- **Steps**:
  1. As user B, navigate to **History**, click **Clear History**, and **OK** the confirm.
  2. Verify B's history is now in the empty state.
  3. Log out and log back in as user A.
  4. Navigate to **History**.
- **Expected**:
  - User A's history still shows their original row(s) — **Clear History** scopes to the acting user's record only.
  - `localStorage.users` shows B's `history` empty while A's `history` is untouched.
- **Notes**: Guards against cross-user data loss in the shared `ttt:users` store. P1 — documented only, not automated this engagement.