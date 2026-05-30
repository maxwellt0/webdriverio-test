# Bugs — Tic-Tac-Toe SUT

Defects found during exploratory testing of `src/index.html` (version `v0.0.9-beta`, as printed in the DevTools console). Bugs are listed in severity order.

## Summary

| ID | Severity | Area | Title |
|----|----------|------|-------|
| [#BUG-1](#bug-1--hard-difficulty-weak-play-and-overwrites-the-humans-move) | **Critical** | Play / AI | Hard difficulty: weak play **and** overwrites the human's move |
| [#BUG-2](#bug-2--hint-does-not-suggest-a-strategic-move) | Medium | Play / Hint | Hint does not suggest a strategic move |
| [#BUG-3](#bug-3--game-title-and-subtitle-are-not-translated-to-persian) | Medium | i18n | Game title and subtitle are not translated to Persian |
| [#BUG-4](#bug-4--difficulty-selector-lacks-a-dropdown-affordance) | Low | Play / UX | Difficulty selector lacks a dropdown affordance (looks like a text input) |
| [#BUG-5](#bug-5--missing-padding-above-the-game-history-header) | Low | History / UX | Missing padding above the **Game History** header |
| [#BUG-6](#bug-6--no-upper-length-limit-on-name-register-login-profile-rename) | Low | Auth / Profile | No upper length limit on name (register, login, profile rename) |

---

## #BUG-1 — Hard difficulty: weak play **and** overwrites the human's move

| Field | Value |
|-------|-------|
| Severity | **Critical** — core gameplay is broken and game state is corrupted |
| Area | Play view → Computer AI (Hard difficulty) |
| Version | v0.0.9-beta |
| Reproducibility | 100 % |

### Symptoms

This bug has **two observable symptoms** that almost certainly share a root cause.

**Symptom A — Hard is the *weakest* observed difficulty**
- The computer's moves on Hard look effectively random.
- The human can win freely from any opening.
- Observed difficulty ordering across the three labels: **Medium > Easy > Hard** (strongest to weakest). The advertised ordering is Hard > Medium > Easy, so the levels are effectively inverted — Hard plays *weaker* than Easy, not just weaker than Medium.

**Symptom B — Computer overwrites the human's cell**
- After the human places an X in a cell, the computer's next move sometimes lands in **the same cell**, replacing the X with an O.
- The cell ends up showing the computer's O even though it was already occupied by the human.
- This violates the basic rule that cells, once played, are immutable until New Game / Reset.

### Steps to reproduce
1. Open the app, register or sign in.
2. On the Play view, set **Difficulty** to **Hard**.
3. Click any empty cell to place an X.
4. Wait ~1.5 s for the computer's move.
5. Observe both: the computer either picks at random (Symptom A) and/or lands its O on the same cell that was just played (Symptom B).
6. Try several openings (corner, edge, center) — symptoms are consistent.

### Expected
- Hard should be the strongest difficulty: never loses from a fresh board, and forces the human into a draw or loss from any opening. Strictly harder than Medium.
- The computer must only play into **empty** cells; a played cell is immutable for the rest of the game.

### Actual
- Computer behaves like Easy (random) — Symptom A.
- Computer can overwrite a cell the human has already played — Symptom B.

### Notes
- The two symptoms likely share a root cause — e.g. on Hard the move-selection routine returns an invalid / unguarded cell index that bypasses both the strong-AI path and the "is cell empty?" check.
- Suggested fix: ensure (1) the difficulty value reaches the strong-AI branch on Hard and (2) the chosen index is validated against the current board state before being applied.
- Impact on automation — affected test cases:
  - [`TC-AI-02`](test-cases/05-play.md#tc-ai-02) — computer must not overwrite a played cell on Hard (Symptom B).
  - [`TC-AI-05`](test-cases/05-play.md#tc-ai-05) — Hard must be unwinnable (Symptom A).
  - Both are marked `pending:#BUG-1` — documented with the current (broken) behavior captured, but not automated this engagement (see `DECISIONS.md` DEC-3).

---

## #BUG-2 — Hint does not suggest a strategic move

| Field | Value |
|-------|-------|
| Severity | **Medium** — feature is present but provides no value to the user |
| Area | Play view → Hint button |
| Version | v0.0.9-beta |
| Reproducibility | 100 % |

### Steps to reproduce
1. Open the app, sign in.
2. Play a game to a state where there is an obvious best move — for example:
   - Set up a board where the human has two X's in a row with the third cell empty (immediate winning move available).
   - Or set up a board where the computer has two O's in a row and is one move away from winning (immediate blocking move required).
3. Click **Hint**.

### Expected
The hint should highlight the cell that wins the game (when an immediate win exists) or blocks the computer's win (when an immediate threat exists). At minimum it should be a strategically useful suggestion, not arbitrary.

### Actual
The hint highlights an empty cell with no apparent strategic correlation. Across many trials with different board states (including states with a clear immediate win or required block), the suggested cell is effectively any empty cell — it does not consistently match the winning or blocking move.

### Notes
- Likely the move-selection routine for hints is returning an arbitrary empty cell instead of running a best-move search (similar in spirit to #BUG-1 if both share a "weakened AI" cause).
- Impact on automation — affected test case: [`TC-HNT-04`](test-cases/05-play.md#tc-hnt-04). Marked `pending:#BUG-2`.

---

## #BUG-3 — Game title and subtitle are not translated to Persian

| Field | Value |
|-------|-------|
| Severity | **Medium** — visible to every Persian user on every page load |
| Area | App header (title + subtitle) under Persian (`fa`) locale |
| Version | v0.0.9-beta |
| Reproducibility | 100 % |

### Steps to reproduce
1. Open the app.
2. In the header language selector, choose **فارسی** (Persian).
3. Observe the app card header.

### Expected
Every visible string in the app should be localized to Persian, including the game name ("Tic-Tac-Toe") and the descriptive subtitle below it.

### Actual
The game title and subtitle remain in English. Layout flips to RTL and other labels (nav, buttons, status, difficulty options, etc.) do translate — but the header text does not. The mismatch is visible on every view because the header is persistent.

### Notes
- This appears to be a missing translation key rather than a layout/RTL issue (the English text renders fine, it's just not swapped out).
- Other strings may also be missed — a full sweep across all views in `fa` mode is recommended to catch siblings.
- Impact on automation — affected test case: [`TC-I18N-02`](test-cases/09-i18n.md#tc-i18n-02) (game title/subtitle translate to Persian). Marked `pending:#BUG-3`.

---

## #BUG-4 — Difficulty selector lacks a dropdown affordance

| Field | Value |
|-------|-------|
| Severity | **Low** — purely visual; control is functional |
| Area | Play view → Difficulty selector |
| Version | v0.0.9-beta |
| Reproducibility | 100 % |

### Steps to reproduce
1. Open the app, sign in, land on the Play view.
2. Look at the **Difficulty** control in the toolbar.

### Expected
The Difficulty control is a `<select>`. As such, it should display the standard dropdown affordance (a chevron / caret on the trailing edge) so users recognize it as a dropdown rather than a text field — consistent with the **Language** selector in the header, which does render a caret.

### Actual
The Difficulty selector renders as a plain bordered box with no chevron / caret. Visually it is indistinguishable from a single-line text input. Users are unlikely to discover it is a dropdown without clicking it.

### Notes
- Inconsistent with the Language selector in the header, which has the affordance.
- Fix is cosmetic: add the same `background-image` chevron rule the language selector uses (or remove the custom appearance reset on this element so the native chevron renders).
- Impact on automation — referenced test case: [`TC-DIF-06`](test-cases/05-play.md#tc-dif-06) (P2 — documentation-only, not automated).

---

## #BUG-5 — Missing padding above the Game History header

| Field | Value |
|-------|-------|
| Severity | **Low** — visual / spacing |
| Area | History view |
| Version | v0.0.9-beta |
| Reproducibility | 100 % |

### Steps to reproduce
1. Open the app, sign in.
2. Navigate to the **History** view via the nav.
3. Observe the spacing between the nav bar and the **Game History** header.

### Expected
The Game History view follows the same vertical-rhythm / padding convention as the Play and Profile views, with breathing room between the nav bar and the section heading.

### Actual
The **Game History** heading sits flush (or nearly flush) against the nav bar, with noticeably less padding than the other views. The layout looks crowded compared to Play / Profile.

### Notes
- Cosmetic only; no functional impact.
- Fix likely a single missing margin/padding rule on the history section container.
- Impact on automation — referenced test case: [`TC-HIS-10`](test-cases/06-history.md#tc-his-10) (P2 — documentation-only, not automated).

---

## #BUG-6 — No upper length limit on name (register, login, profile rename)

| Field | Value |
|-------|-------|
| Severity | **Low** — UX / data-quality; allows arbitrarily long names to be stored and rendered |
| Area | Auth (register, login) and Profile (rename) |
| Version | v0.0.9-beta |
| Reproducibility | 100 % |

### Steps to reproduce

For each of the three entry points, paste a very long string (e.g. 500+ characters: `Aaaaaaaa…` repeated) into the name field and submit:

1. **Register** — on the auth card in Register mode.
2. **Login** — after creating such an account, sign back in with the same long name.
3. **Profile rename** — sign in, navigate to Profile, replace the name with a 500+ char string, click Save.

### Expected

A reasonable upper bound on name length (e.g. 32 or 50 characters) is enforced with a clear inline error. Names beyond that are rejected at the form rather than stored / rendered.

### Actual

No upper bound is enforced. Names of any length are:
- accepted by the register form,
- looked up successfully on login (proving they were persisted in full),
- accepted by the profile rename form,
- rendered as-is in the nav greeting, avatar tooltip, profile name field, and any history rows — breaking the layout (overflow, ellipsis on the nav, oversized profile field, etc.).

### Notes
- Min-length validation (≥ 2 characters / non-empty) works correctly; this bug is **only** about the missing upper bound.
- No exact value to enforce is documented — proposed: 32 chars (covers virtually all real names and keeps the nav tidy).
- Impact on automation — dedicated max-length test cases (all P1, documentation-only):
  - [`TC-REG-09`](test-cases/03-auth.md#tc-reg-09) — Register form rejects over-length names.
  - [`TC-LGN-05`](test-cases/03-auth.md#tc-lgn-05) — Login form rejects over-length names.
  - [`TC-PRF-08`](test-cases/07-profile.md#tc-prf-08) — Profile rename rejects over-length names.
  - Plus the broader edge-case sweep in [`TC-REG-08`](test-cases/03-auth.md#tc-reg-08).
