import { CellState, Difficulty, PlayPage, TerminalStatus, isTerminal } from '../pages/play.page';

const WINNING_LINES: ReadonlyArray<readonly [number, number, number]> = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // cols
    [0, 4, 8],
    [2, 4, 6], // diagonals
];

/** Returns the empty cell that would complete a winning line for `symbol`, or -1. */
function findCompletingMove(board: ReadonlyArray<CellState>, symbol: 'x' | 'o'): number {
    for (const line of WINNING_LINES) {
        const states = line.map((i) => board[i]);
        const symbolCount = states.filter((s) => s === symbol).length;
        const emptyCount = states.filter((s) => s === 'empty').length;
        if (symbolCount === 2 && emptyCount === 1) {
            const emptyOffset = states.indexOf('empty');
            return line[emptyOffset];
        }
    }
    return -1;
}

type TargetWinner = 'human' | 'computer';

/**
 * Play one game aiming for a specific winner **without recording any off-target
 * game**. A draw is only ever finalized on the human's 9th move — the board fills on
 * the last move, and since the human moves first that move is always the human's — so
 * if completing the board wouldn't produce `winner`, we abandon the game *before* that
 * move. An abandoned game stays in-progress (never terminal), so the SUT records
 * nothing; the caller resets via New Game and retries.
 *
 * - `winner: 'human'` — take any immediate win, else block, else center → corners →
 *   edges. Effectively always wins against Easy's random play.
 * - `winner: 'computer'` — play passively (edges → corners → center) and never
 *   complete a human line, letting a rule-based opponent (Medium) build its own win.
 *
 * Returns the terminal status, or `'abandoned'` if we bailed before recording.
 */
async function playForWinner(
    play: PlayPage,
    winner: TargetWinner,
): Promise<TerminalStatus | 'abandoned'> {
    const order =
        winner === 'human'
            ? [4, 0, 2, 6, 8, 1, 3, 5, 7] // center, corners, edges
            : [1, 3, 5, 7, 0, 2, 6, 8, 4]; // edges, corners, center

    for (let move = 0; move < 9; move++) {
        const board = await play.getBoardState();
        const winningMove = findCompletingMove(board, 'x');

        let next: number;
        if (winner === 'human') {
            next = winningMove; // take the win
            if (next < 0) next = findCompletingMove(board, 'o'); // else block
            if (next < 0) next = order.find((i) => board[i] === 'empty') ?? -1;
        } else {
            // Losing on purpose: never complete a human line.
            next = order.find((i) => board[i] === 'empty' && i !== winningMove) ?? -1;
        }
        if (next < 0) return 'abandoned';

        // Abandon before the board-filling final move if it wouldn't produce our target
        // winner (a human win), so no draw — or off-target last-move win — is recorded.
        const isLastCell = board.filter((s) => s === 'empty').length === 1;
        const completesWin = winner === 'human' && next === winningMove;
        if (isLastCell && !completesWin) return 'abandoned';

        await play.playMove(next);

        const status = await play.getStatus();
        if (isTerminal(status)) return status;
    }
    return 'abandoned';
}

/**
 * Play moves into the first empty cell until the game reaches a terminal status
 * (`human`, `computer`, or `draw`). Capped at 9 moves (board size). The outcome
 * is unspecified — use this when the spec only cares that a game was finished
 * (e.g. to populate one history row), not who won.
 */
export async function playUntilGameOver(play: PlayPage): Promise<void> {
    for (let move = 0; move < 9; move++) {
        const board = await play.getBoardState();
        const idx = board.findIndex((s) => s === 'empty');
        if (idx < 0) break;
        await play.playMove(idx);
        if (isTerminal(await play.getStatus())) return;
    }
    await play.waitForGameOver();
}

/**
 * Play games on Easy until the human wins, retrying via **New Game**. Off-target
 * games are abandoned before they record (see `playForWinner`), so a win is the
 * only history row this leaves. Caps attempts so bad luck can't hang the suite.
 */
export async function playUntilWin(play: PlayPage, maxAttempts = 8): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) await play.clickNewGame();
        if ((await playForWinner(play, 'human')) === 'human') return true;
    }
    return false;
}

/**
 * Play games on the current difficulty until the human loses, retrying via **New
 * Game**. Off-target games (including draws) are abandoned before they record, so a
 * loss is the only history row this leaves. Use with Medium (which exploits
 * non-threatening play); on Easy losses are too rare and this would exhaust attempts.
 */
export async function playUntilLoss(play: PlayPage, maxAttempts = 8): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) await play.clickNewGame();
        if ((await playForWinner(play, 'computer')) === 'computer') return true;
    }
    return false;
}

/**
 * Convenience wrapper: set the difficulty (default `easy`), then force a human win.
 * Throws if the attempt cap is exhausted — use the lower-level `playUntilWin` if
 * the caller wants to inspect the boolean outcome.
 */
export async function winOneGame(play: PlayPage, difficulty: Difficulty = 'easy'): Promise<void> {
    await play.setDifficulty(difficulty);
    const won = await playUntilWin(play);
    if (!won) throw new Error(`winOneGame: could not win on ${difficulty} within attempt cap`);
}

/**
 * Convenience wrapper: set the difficulty (default `medium` — Easy is too random
 * to lose reliably; Hard is currently broken per #BUG-1), then force a human loss.
 * Throws if the attempt cap is exhausted.
 */
export async function loseOneGame(
    play: PlayPage,
    difficulty: Difficulty = 'medium',
): Promise<void> {
    await play.setDifficulty(difficulty);
    const lost = await playUntilLoss(play);
    if (!lost) throw new Error(`loseOneGame: could not lose on ${difficulty} within attempt cap`);
}

/**
 * Play up to `maxMoves` human moves into the first empty cell and assert that no
 * previously-occupied cell ever changes. Covers the "computer never overwrites"
 * invariant for TC-AI-01 (Easy / Medium) and TC-AI-02 (Hard, currently pending #BUG-1).
 * Stops early if the game ends within the loop.
 */
export async function assertComputerDoesNotOverwriteCells(
    play: PlayPage,
    maxMoves = 4,
): Promise<void> {
    for (let move = 0; move < maxMoves; move++) {
        const before = await play.getBoardState();
        const emptyIdx = before.findIndex((s) => s === 'empty');
        if (emptyIdx < 0) break;

        await play.playMove(emptyIdx);

        const after = await play.getBoardState();
        after.forEach((cell, i) => {
            if (before[i] !== 'empty') expect(cell).toBe(before[i]);
        });

        if (isTerminal(await play.getStatus())) break;
    }
}
