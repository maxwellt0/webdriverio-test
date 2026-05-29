# §5 — Play view

Implements [plan §5.5](../TESTPLAN.md). For conventions / preconditions / test data see [README](README.md).

Covers Status pill (§5.1), Board (§5.2), Computer behavior (§5.3), Hint (§5.4), New Game (§5.5), Reset (§5.6), Difficulty selector (§5.7).

---

## §5.1 Status pill

### TC-STAT-01

**Initial status is "Your turn (X)"** — P0 — plan §5.5.1

- **Precondition**: PRE-USER.
- **Steps**:
  1. Read the status pill text and `data-status`.
- **Expected**:
  - Text: "Your turn (X)".
  - `data-status="playing"` (or equivalent active-human marker).

---

### TC-STAT-02

**Status transitions across a human move** — P0 — plan §5.5.1

- **Precondition**: PRE-USER.
- **Steps**:
  1. Click an empty cell.
  2. Observe `data-status` immediately afterwards.
  3. Wait for the next transition.
- **Expected**:
  - Right after click: `data-status="computer-thinking"`.
  - After ~1.5 s: `data-status` returns to the human-turn state (assuming game not over).
- **Notes**: This case encodes the suite's primary sync signal — see [plan §3 Synchronization](../TESTPLAN.md#3-test-approach).

---

## §5.2 Board behavior

### TC-BRD-01

**Clicking an empty cell places X** — P0 — plan §5.5.2

- **Precondition**: PRE-USER.
- **Steps**:
  1. Click cell `[data-testid="cell-0"]`.
  2. Read its `data-state` and inner text.
- **Expected**:
  - `data-state="x"`; inner text `X`.

---

### TC-BRD-02

**Clicking an occupied cell is a no-op** — P0 — plan §5.5.2

- **Precondition**: PRE-USER; cell-0 already played by the human, and one computer move completed.
- **Steps**:
  1. Attempt to click cell-0 again.
- **Expected**:
  - Click does nothing (cell is `disabled`).
  - `data-state` and inner text unchanged.

---

### TC-BRD-03

**All cells disabled while computer is thinking** — P0 — plan §5.5.2

- **Precondition**: PRE-USER.
- **Steps**:
  1. Click an empty cell to trigger the computer turn.
  2. While `data-status="computer-thinking"`, attempt to click every other empty cell.
- **Expected**:
  - All cells (`cell-0`..`cell-8`) report `disabled`; no clicks register.

---

### TC-BRD-04

**All cells disabled after game ends** — P0 — plan §5.5.2

- **Precondition**: PRE-USER; a game played to completion (any of win / loss / draw).
- **Steps**:
  1. Attempt to click each empty cell.
- **Expected**:
  - All cells report `disabled`; no state change.
  - Status pill shows the terminal result.

---

### TC-BRD-05

**Winning line cells receive the win style** — P1 — plan §5.5.2

- **Precondition**: PRE-USER; difficulty `easy`; play a scripted human win.
- **Steps**:
  1. After the win, inspect the three cells of the winning line.
- **Expected**:
  - All three cells carry the `is-win` class (or equivalent visual marker).
  - No non-winning cell carries it.

---

## §5.3 Computer behavior

### TC-AI-01

**Computer never plays into an occupied cell (Easy & Medium)** — P0 — plan §5.5.3

- **Precondition**: PRE-USER.
- **Steps**: For each difficulty in {`easy`, `medium`}: play 5 short games, capturing the board state after every move.
- **Expected**:
  - At no point does any cell transition from `x` → `o` or `o` → `x`.
  - Computer moves only into cells with `data-state="empty"`.

---

### TC-AI-02

**Computer never plays into an occupied cell on Hard** — P1, `pending:`[`#BUG-1`](../BUGS.md#bug-1--hard-difficulty-weak-play-and-overwrites-the-humans-move) — plan §5.5.3

- **Precondition**: PRE-USER; difficulty `hard`.
- **Steps**: Same as TC-AI-01 but with difficulty `hard`.
- **Expected (target)**: Same as TC-AI-01.
- **Expected (current — regression check)**:
  - Bug reproduces: at least one cell transitions `x` → `o`. Assertion fails when [#BUG-1](../BUGS.md#bug-1--hard-difficulty-weak-play-and-overwrites-the-humans-move) is fixed.

---

### TC-AI-03

**Medium takes an immediate win** — P1 — plan §5.5.3

- **Precondition**: PRE-USER; difficulty `medium`.
- **Steps**:
  1. Construct a board where the computer (O) has two in a row with the third cell empty.
  2. Take a non-blocking human move.
  3. Wait for computer turn.
- **Expected**:
  - Computer plays the winning cell.
  - `data-status="computer"` (computer wins).

---

### TC-AI-04

**Medium blocks an immediate human threat** — P1 — plan §5.5.3

- **Precondition**: PRE-USER; difficulty `medium`.
- **Steps**:
  1. Construct a board where the human has two in a row with the third cell empty and the computer has no immediate winning move.
  2. Wait for computer turn.
- **Expected**:
  - Computer plays the cell that blocks the human win.

---

### TC-AI-05

**Hard is unwinnable from any opening** — P1, `pending:`[`#BUG-1`](../BUGS.md#bug-1--hard-difficulty-weak-play-and-overwrites-the-humans-move) — plan §5.5.3

- **Precondition**: PRE-USER; difficulty `hard`.
- **Steps**: Play 3 full games using different openings (corner cell-0, edge cell-1, center cell-4), always playing the move with the strongest local heuristic.
- **Expected (target)**: Every game ends in `computer` or `draw`; never `human`.
- **Expected (current — regression check)**: Human wins easily; assertion fails when [#BUG-1](../BUGS.md#bug-1--hard-difficulty-weak-play-and-overwrites-the-humans-move) is fixed.

---

## §5.4 Hint button

### TC-HNT-01

**Hint disabled when not the human's turn** — P0 — plan §5.5.4

- **Precondition**: PRE-USER.
- **Steps**:
  1. Click an empty cell (human turn → computer-thinking).
  2. While `data-status="computer-thinking"`, inspect the Hint button.
- **Expected**:
  - Hint button is disabled.

---

### TC-HNT-02

**Hint disabled after game ends** — P0 — plan §5.5.4

- **Precondition**: PRE-USER; a game played to a terminal state.
- **Steps**:
  1. Inspect the Hint button.
- **Expected**:
  - Hint button is disabled.

---

### TC-HNT-03

**Hint enabled on human's turn during active game** — P0 — plan §5.5.4

- **Precondition**: PRE-USER; status `Your turn`.
- **Steps**:
  1. Inspect the Hint button.
- **Expected**:
  - Hint button is enabled.

---

### TC-HNT-04

**Hint suggests a strategically useful move** — P1, `pending:`[`#BUG-2`](../BUGS.md#bug-2--hint-does-not-suggest-a-strategic-move) — plan §5.5.4

- **Precondition**: PRE-USER; board state with exactly one immediate-winning move for the human.
- **Steps**:
  1. Click Hint.
  2. Read the index of the highlighted cell.
- **Expected (target)**: Highlighted cell is the winning cell.
- **Expected (current — regression check)**: Highlighted cell is arbitrary; assertion fails when [#BUG-2](../BUGS.md#bug-2--hint-does-not-suggest-a-strategic-move) is fixed.

---

## §5.5 New Game

### TC-NEW-01

**New Game clears the board and resets status** — P0 — plan §5.5.5

- **Precondition**: PRE-USER; at least one human move played, with the computer having responded.
- **Steps**:
  1. Click **New Game**.
- **Expected**:
  - All 9 cells have `data-state="empty"`; inner text empty.
  - Status pill reads "Your turn (X)"; `data-status` is the active-human state.
  - Difficulty selector value unchanged.

---

## §5.6 Reset

### TC-RST-01

**Reset behaves equivalently to New Game** — P0 — plan §5.5.6

- **Precondition**: PRE-USER; at least one human move played.
- **Steps**:
  1. Click **Reset**.
- **Expected**:
  - Same outcome as TC-NEW-01 — empty board, "Your turn (X)", same difficulty.
- **Notes**: If a meaningful behavioral difference between Reset and New Game ever emerges, split into a dedicated case.

---

## §5.7 Difficulty selector

### TC-DIF-01

**Selector reflects the persisted user preference** — P0 — plan §5.5.7

- **Precondition**: PRE-CLEAN; a user record exists with `difficulty: "medium"`.
- **Steps**:
  1. Log in as that user.
  2. Read the Difficulty selector value.
- **Expected**:
  - Selected value is `medium`.

---

### TC-DIF-02

**Changing difficulty before any move applies immediately** — P0 — plan §5.5.7

- **Precondition**: PRE-USER; board empty.
- **Steps**:
  1. Change Difficulty from `easy` to `hard`.
- **Expected**:
  - No confirm dialog appears.
  - Selector value is now `hard`.
  - Board still empty; status still "Your turn".

---

### TC-DIF-03

**Mid-game difficulty change — accept confirm** — P0 — plan §5.5.7

- **Precondition**: PRE-USER; at least one human move played.
- **Steps**:
  1. Change Difficulty to a different value.
  2. Accept the confirm dialog ("Change difficulty? The current game will be reset.") with **OK**.
- **Expected**:
  - Board clears; new difficulty is applied; status returns to "Your turn".

---

### TC-DIF-04

**Mid-game difficulty change — cancel confirm** — P0 — plan §5.5.7

- **Precondition**: PRE-USER; at least one human move played.
- **Steps**:
  1. Note current difficulty value and board state.
  2. Open the Difficulty selector and pick a different value.
  3. **Cancel** the confirm dialog.
- **Expected**:
  - Board unchanged.
  - Selector reverts to its previous value.

---

### TC-DIF-05

**Difficulty change persists to the user record** — P0 — plan §5.5.7

- **Precondition**: PRE-USER (default difficulty `easy`).
- **Steps**:
  1. Change difficulty to `medium`.
  2. Log out and log back in as the same user.
  3. Read the Difficulty selector value.
- **Expected**:
  - Selected value is `medium` after re-login.

---

### TC-DIF-06

**Difficulty selector lacks a dropdown affordance** — P2, `pending:`[`#BUG-4`](../BUGS.md#bug-4--difficulty-selector-lacks-a-dropdown-affordance) — plan §5.5.7

- Documentation-only. Not automated. The Difficulty `<select>` visually renders without a chevron / caret, indistinguishable from a text input. See [#BUG-4](../BUGS.md#bug-4--difficulty-selector-lacks-a-dropdown-affordance).