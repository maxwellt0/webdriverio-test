# §2 — Header (language & theme)

Implements [plan §5.2](../TESTPLAN.md). For conventions / preconditions / test data see [README](README.md).

---

### TC-HDR-01

**Language switch translates labels and flips RTL** — P0 — plan §5.2

- **Precondition**: PRE-CLEAN.
- **Steps**:
  1. Note the visible label of the auth submit button.
  2. Open the language selector and choose **فارسی**.
  3. Re-read the auth submit button label.
  4. Read `<html lang>` and `<html dir>` attributes.
- **Expected**:
  - Submit button label changes from English to Persian (per the en/fa string map).
  - `<html lang="fa">`, `<html dir="rtl">`.
- **Notes**: Title and subtitle remain English — see [#BUG-3](../BUGS.md#bug-3--game-title-and-subtitle-are-not-translated-to-persian) and [TC-I18N-02](09-i18n.md#tc-i18n-02). This case asserts only the labels that *do* translate.

---

### TC-HDR-02

**Theme toggle flips `data-theme` and updates the button label** — P0 — plan §5.2

- **Precondition**: PRE-CLEAN (default theme `light`).
- **Steps**:
  1. Read `<html data-theme>` and the theme button label.
  2. Click the theme button.
  3. Re-read both.
- **Expected**:
  - `data-theme` flips `light` → `dark`.
  - Button label flips to advertise the *next* theme (i.e. "Light theme" while currently dark).

---

### TC-HDR-03

**Theme and language persist across reload** — P0 — plan §5.2

- **Precondition**: PRE-CLEAN.
- **Steps**:
  1. Set language to `fa` and theme to `dark` via the header controls.
  2. Reload the page.
  3. Read `<html lang>`, `<html dir>`, `<html data-theme>`.
- **Expected**:
  - `lang="fa"`, `dir="rtl"`, `data-theme="dark"`.

---

### TC-HDR-04

**Header controls present on every view** — P0 — plan §5.2

- **Precondition**: PRE-USER.
- **Steps**:
  1. On each view (Play, Profile, History), verify the language selector and theme button are visible and clickable.
- **Expected**:
  - Both controls present on all three views; no exception.

---

### TC-HDR-05

**Settings are global (not per-user)** — P1 — plan §5.2

- **Precondition**: PRE-USER as user A; theme set to `dark`, language to `fa`.
- **Steps**:
  1. Log out.
  2. Register a new user B.
  3. Observe `<html>` attributes after the auth flow lands on Play.
- **Expected**:
  - `data-theme="dark"`, `lang="fa"` — preferences carried across users (they are global, not per-user).