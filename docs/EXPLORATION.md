# Exploration Notes — Tic-Tac-Toe SUT

Exploratory testing notes describing what the SUT does and how it behaves. Captured by exercising `src/index.html` in a browser — no source-code references, only what a user observes or a tester can confirm via the UI / devtools.

## 1. Environment & entry

- Single self-contained HTML page. No network calls. Works fully offline.
- Page title: **Tic-Tac-Toe**.
- Viewport scales for mobile. The app card is centered with a soft radial-gradient background.
- All persistent state lives in browser `localStorage` for the current origin.
- DevTools console prints a version string on load: **`v0.0.9-beta`**. No errors, warnings, or unhandled rejections are emitted during normal use.

## 2. Persistent UI — header (always visible)

Top-right of the app card has two controls present on every view:

- **Language selector** (dropdown). Options: **English**, **فارسی** (Persian). Switching to فارسی flips the layout to right-to-left and translates every label on the page; the document `lang` attribute and `dir` attribute change accordingly.
- **Theme toggle button**. Toggles between **Light theme** and **Dark theme**. Button label reflects the *next* theme (i.e. shows "Dark theme" when currently light). The document `data-theme` attribute switches between `light` and `dark`.

Both selections persist across page reloads.

## 3. Authentication

When no user is signed in, the only thing visible (below the header) is an auth card. There are two modes:

### 3.1 Register ("Create Account")
- Single field: **Player name** (placeholder example: *Sara*).
- Submit button labelled **Create Account**.
- A link/button below switches to login mode: *"Have an account? Sign in"*.

**Observed validation**:
- Empty or whitespace-only name → inline error "Please enter your name."
- 1 character → inline error "Name must be at least 2 characters."
- Name already exists (matched **case-insensitively** — "Sara" and "sara" collide) → inline error "An account with this name already exists."
- Valid new name → user is created and immediately signed in; the app navigates to the Play view.
- **No upper length limit** — names of arbitrary length (hundreds / thousands of characters) are accepted and rendered as-is, breaking layout. See [#BUG-6](BUGS.md#bug-6--no-upper-length-limit-on-name-register-login-profile-rename).

### 3.2 Login ("Sign in")
- Same single Player name field.
- Switch link: *"New here? Create one"*.

**Observed validation**:
- Empty / whitespace → "Please enter your name."
- Name not found (case-insensitive lookup) → "No account with this name. Sign up first."
- Found → signed in, lands on Play view.
- Same missing upper length limit applies on this form — see [#BUG-6](BUGS.md#bug-6--no-upper-length-limit-on-name-register-login-profile-rename).

### 3.3 Mode switching
- Toggling between modes via the switch link clears any previously displayed error message.
- The name field is auto-focused after the auth card renders.

## 4. Navigation (post-login)

After login, a nav bar appears at the top of the card. From left to right:

- **Avatar circle** — single uppercase initial of the player's name on a colored disc.
- **Greeting** — "Hi, *Name*" (using the user's stored capitalization, not the lowercased form).
- **Play** — primary game view (default after login).
- **Profile** — user settings & stats.
- **History** — past games table.
- **Log Out** — clears the session and returns to the auth card.

The active view is visually highlighted in the nav.

## 5. Play view

Layout, top to bottom:

1. **Toolbar** with a **Difficulty** dropdown. Options: **Easy**, **Medium**, **Hard**.
2. **Status pill** — short message about whose turn it is or the game result; has a small colored dot.
3. **3×3 game board** — square cells.
4. **Action row** — three buttons: **New Game**, **Get Hint**, **Reset**.

### 5.1 Status pill — observed states

- Initial / human's turn → "Your turn (X)".
- Right after a human click → "Computer is thinking…" (the dot pulses).
- Win → "You win!".
- Loss → "Computer wins."
- Draw → "Draw."

### 5.2 Board behavior

- Human plays **X**, computer plays **O**. Human moves first.
- Clicking an empty cell places **X** in it immediately.
- Cells already containing X or O are visually disabled and cannot be clicked.
- While the computer is thinking, **all** cells are disabled.
- Once the game ends (win / loss / draw), all cells stay disabled until **New game** or **Reset** is pressed.
- Cells that form the winning line are visually highlighted (subtle background change).
- A "hinted" cell is also visually highlighted until it is played or the hint state clears.

### 5.3 Computer behavior

- Computer move arrives after roughly **1.5 seconds** of "thinking" — long enough to notice the delay deliberately.
- **Easy**: picks a seemingly random empty cell. Plays winning moves only by accident; weak overall but **stronger than Hard** in observed play.
- **Medium**: takes a winning move if available; blocks the human's imminent win; otherwise picks randomly. **The strongest of the three observed difficulties** — beatable, but clearly the hardest to win against.
- **Hard**: **the weakest in observed play** — moves look effectively random and the human can win freely. Additionally, the computer can **overwrite a cell the human has already played** — the human's X is replaced by the computer's O instead of the computer picking an empty cell. Suspected defects; see `docs/concerns.md` items 5 and 6 (consolidated as #BUG-1).

**Observed difficulty ordering (strongest → weakest): Medium > Easy > Hard.** The advertised order should be Hard > Medium > Easy, so the difficulty levels are effectively inverted around Hard.

### 5.4 Hint button

- Disabled while computer is thinking.
- Disabled after the game ends.
- Enabled on the human's turn during an active game.
- Clicking it highlights a single empty cell on the board. **The suggestion does not appear to be strategic** — it picks an empty cell with no apparent correlation to a winning move or to blocking the computer's win. Across many trials the hint behaves like "pick an empty cell at random" rather than "best move". Suspected defect; see `docs/concerns.md` #BUG-2. The board has an aria-live region that announces the hint.
- The highlight clears as soon as the human plays any cell (whether the hinted one or not).

### 5.5 New game

- Resets the board to all empty.
- Status returns to "Your turn".
- Difficulty selection is preserved.

### 5.6 Reset

- Behaves identically to **New game** in the observed runs (same outcome: empty board, "Your turn", same difficulty).

### 5.7 Difficulty selector

- Visually looks like a plain text input — **no chevron / dropdown caret** is rendered, unlike the Language selector in the header which does show one. A user is unlikely to discover it is a dropdown without clicking it. See `docs/concerns.md` triage item 3.
- Changes apply immediately if the board is empty.
- Changing difficulty **after at least one cell has been played** triggers a browser confirm dialog: *"Change difficulty? The current game will be reset."*
  - **OK** → board clears and the new difficulty is selected.
  - **Cancel** → board untouched, the dropdown reverts to the previous value.
- The selected difficulty is remembered per user — it is what is preselected next time the same user signs in.

## 6. History view

- Header: **Game History**.
- If no games have been finished yet: empty-state text *"No games yet. Play one!"*.
- Otherwise: a 3-column table — **Date**, **Difficulty**, **Result**.
  - **Date**: formatted using the current language locale. English → Gregorian (`M/D/YYYY, h:mm:ss A`). Persian → **Persian Solar Hijri (Jalali) calendar** with Persian digits — i.e. an entirely different calendar system (different year, different month names like Farvardin / Ordibehesht / …), not a translated Gregorian date.
  - **Difficulty**: localized (Easy / Medium / Hard).
  - **Result**: Win / Loss / Draw, also localized.
- Newest entry first.
- A **Clear History** button appears below the table when there is at least one entry. Clicking it shows a browser confirm dialog *"Clear all game history?"*. OK clears; Cancel keeps the rows.
- A finished game is recorded exactly once at the moment the status changes to win/loss/draw. Pressing New game does not duplicate the previous result; pressing Reset before the game ends records nothing.
- Visual scan suggests the table caps at around 100 rows even after many games.

## 7. Profile view

- Header: **Profile**.
- **Player name** input (editable) with a **Save** button.
- After saving:
  - On success: green "Profile saved" message; header greeting updates; the renamed user can sign in with the new name after logout.
  - Renaming to a name already used by another account (case-insensitive) → "This name is already taken."
  - Renaming to the same name in a different case (e.g. "Sara" → "SARA") → succeeds (not treated as collision against self).
  - Same missing upper length limit as Register / Login — see [#BUG-6](BUGS.md#bug-6--no-upper-length-limit-on-name-register-login-profile-rename).
- **Stats block** (read-only, key-value):
  - **Created** *(date)*.
  - **Win**, **Loss**, **Draw** — counts derived from the user's history (labels are singular, even though they show totals).
- **Delete account** button (danger-styled). Click triggers a confirm dialog: *"Delete this account and all its data? This cannot be undone."*
  - OK → user record is removed, session cleared, app returns to the auth card. Attempting to log back in with that name fails ("No account…").
  - Cancel → nothing happens.

## 8. Theming details

- Theme toggle is instantaneous; no flash; all colors swap including the status pill dot and game cells.
- Theme persists across reload **and** across sign-out/sign-in (it's a UI preference, not per-user).

## 9. Localization details

- Switching language re-renders most visible labels; the dropdown options for difficulty also become localized ("Easy" → "آسان", etc.).
- **Exception (defect):** the app header's **game name ("Tic-Tac-Toe")** and the **subtitle / description** below it remain in English even after switching to Persian. Suspected defect; see `docs/concerns.md` #BUG-3.
- The Persian rendering uses Persian digits for dates and counters.
- Language persists across reloads, and like theme, is a global UI setting (not per-user).
- Switching language **mid-game does not reset the board** — moves and status remain; only the strings around the board change.

## 10. Persistence summary (what survives a reload)

| Data                                                   | Survives reload? | Notes                                                                          |
|--------------------------------------------------------|------------------|--------------------------------------------------------------------------------|
| Theme                                                  | Yes              | Global.                                                                        |
| Language                                               | Yes              | Global.                                                                        |
| Session (logged-in user)                               | Yes              | Reload keeps user on Play/Profile/History.                                     |
| User records (name, member-since, history, difficulty) | Yes              | Even after logout. Deleted only by Delete account.                             |
| In-progress game board                                 | **No**           | Reload starts a fresh empty board.                                             |
| Currently selected view (Play/Profile/History)         | **No**           | Reload always returns to the **Play** view, regardless of which view was open. |
| Auth error / profile success messages                  | No               | Cleared on any re-render.                                                      |

## 11. Browser confirm dialogs

Native `window.confirm` (not a custom modal) is used in three places:
- Mid-game **difficulty change** with moves on the board.
- **Clear History**.
- **Delete account**.

Cancel = no-op; OK = action proceeds.

## 12. Accessibility surfaces observed

- The board has `role="grid"` and each cell has `role="gridcell"`, an `aria-label` describing position and contents (e.g. *"row 1, column 2, empty"*), and an `aria-disabled` reflecting whether it's playable.
- Status pill has `role="status"` and `aria-live="polite"`.
- Auth error and profile messages use `role="alert"` / `role="status"`.
- Hint announcement uses an aria-live region.

## 13. Instrumentation visible to automation

Every interactive element exposes a stable `data-testid` attribute (visible via devtools). Examples seen:

- Board / cells: `board`, `cell-0` … `cell-8`.
- Status: `status`.
- Actions: `btn-new-game`, `btn-hint`, `btn-reset`.
- Difficulty: `select-difficulty`.
- Nav: `nav`, `nav-hello`, `view-play`, `view-profile`, `view-history`, plus a logout button.
- Auth: `auth-form`, fields and submit buttons, `auth-error`.
- Profile: `view-profile`, name input + save button, `profile-wins` / `profile-losses` / `profile-draws`, delete button.
- History: per-row testids include the row index, plus column-specific cells.