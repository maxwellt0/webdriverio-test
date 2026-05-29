# §8 — Theming

Implements [plan §5.8](../TESTPLAN.md). For conventions / preconditions / test data see [README](README.md).

---

### TC-THM-01

**Theme toggle updates instantly (no flash, no layout shift)** — P0 — plan §5.8

- **Precondition**: PRE-CLEAN.
- **Steps**:
  1. Read `<html data-theme>` (expected `light`).
  2. Click the theme toggle.
  3. Re-read `<html data-theme>` and verify it's `dark`.
- **Expected**:
  - `data-theme` flips synchronously on click.
  - No FOUC / flash visible (the swap is instant — covered as a smoke assertion that there's no extra reload).

---

### TC-THM-02

**Theme persists across reload, logout, and user switch** — P0 — plan §5.8

- **Precondition**: PRE-USER as user A; theme set to `dark`.
- **Steps**:
  1. Reload the page. Verify `data-theme="dark"`.
  2. Log out. Verify `data-theme="dark"` on the auth card.
  3. Register a new user B. Verify `data-theme="dark"` on Play.
- **Expected**:
  - `data-theme="dark"` after every step (theme is a global preference).