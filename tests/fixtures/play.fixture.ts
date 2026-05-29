import { CellState, Difficulty, PlayPage } from '../pages/play.page';

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

/**
 * Play a single game using a near-optimal heuristic: take any immediate win,
 * else block any immediate threat, else fill center → corners → edges in order.
 * Resolves once the game reaches a terminal status, with the final outcome.
 */
async function playStrategicGame(play: PlayPage): Promise<'human' | 'computer' | 'draw'> {
    const priorities = [4, 0, 2, 6, 8, 1, 3, 5, 7]; // center, corners, edges
    for (let move = 0; move < 9; move++) {
        const board = await play.getBoardState();

        let next = findCompletingMove(board, 'x');
        if (next < 0) next = findCompletingMove(board, 'o');
        if (next < 0) next = priorities.find((i) => board[i] === 'empty') ?? -1;
        if (next < 0) break;

        await play.playMove(next);

        const status = await play.getStatus();
        if (status === 'human' || status === 'computer' || status === 'draw') {
            return status;
        }
    }
    await play.waitForGameOver();
    return (await play.getStatus()) as 'human' | 'computer' | 'draw';
}

/**
 * Play a single game passively — pick the next empty cell in a non-threatening order
 * (edges first, then corners, then center). Designed to let a rule-based computer (Medium)
 * build its own winning line.
 */
async function playPassiveGame(play: PlayPage): Promise<'human' | 'computer' | 'draw'> {
    const passive = [1, 3, 5, 7, 0, 2, 6, 8, 4]; // edges, corners, center
    for (let move = 0; move < 9; move++) {
        const board = await play.getBoardState();
        const next = passive.find((i) => board[i] === 'empty');
        if (next === undefined) break;

        await play.playMove(next);

        const status = await play.getStatus();
        if (status === 'human' || status === 'computer' || status === 'draw') {
            return status;
        }
    }
    await play.waitForGameOver();
    return (await play.getStatus()) as 'human' | 'computer' | 'draw';
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
        const status = await play.getStatus();
        if (status === 'human' || status === 'computer' || status === 'draw') return;
    }
    await play.waitForGameOver();
}

/**
 * Play games on Easy until the human wins. Each attempt resets the board via
 * **New Game**. Caps attempts so a string of bad luck against random play can't
 * hang the suite.
 */
export async function playUntilWin(play: PlayPage, maxAttempts = 8): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) await play.clickNewGame();
        const outcome = await playStrategicGame(play);
        if (outcome === 'human') return true;
    }
    return false;
}

/**
 * Play games on the current difficulty until the human loses. Used with Medium
 * (which reliably exploits non-threatening play); on Easy the loss rate is low
 * enough that this would frequently exhaust attempts, so callers should set
 * difficulty to Medium first.
 */
export async function playUntilLoss(play: PlayPage, maxAttempts = 8): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) await play.clickNewGame();
        const outcome = await playPassiveGame(play);
        if (outcome === 'computer') return true;
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

        const status = await play.getStatus();
        if (status === 'human' || status === 'computer' || status === 'draw') break;
    }
}
