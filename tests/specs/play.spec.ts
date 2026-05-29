import { PlayPage } from '../pages/play.page';
import { registerAndLand } from '../features/auth.feature';
import { playUntilGameOver } from '../features/play.feature';
import { acceptNextConfirm, cancelNextConfirm } from '../utils/confirm';

/**
 * Play-view specs — implements docs/test-cases/05-play.md.
 *
 * Covers status pill, board behavior, computer AI, hint, new game / reset,
 * and the difficulty selector. Per-test reset (localStorage cleared + reload)
 * runs in wdio.conf.ts → beforeTest; each `it` then registers a fresh user
 * and lands on the Play view.
 */
describe('Play', () => {
    const play = new PlayPage();

    beforeEach(async () => {
        await registerAndLand();
    });

    // ─── Status pill ────────────────────────────────────────────────────────

    describe('Status pill', () => {
        it('[TC-STAT-01] initial status is "Your turn (X)"', async () => {
            expect(await play.getStatus()).toBe('playing');
            await expect(play.status).toHaveText(/your turn/i);
        });

        it('[TC-STAT-02] status transitions human → computer-thinking → human', async () => {
            await play.clickCell(0);
            await play.waitForComputerThinking();
            await play.waitWhileComputerThinking();

            expect(await play.getStatus()).toBe('playing');
        });
    });

    // ─── Board behavior ─────────────────────────────────────────────────────

    describe('Board', () => {
        it('[TC-BRD-01] clicking an empty cell places X', async () => {
            await play.clickCell(0);
            expect(await play.getCellState(0)).toBe('x');
        });

        it('[TC-BRD-02] clicking an occupied cell is a no-op', async () => {
            await play.playMove(0);

            const before = await play.getBoardState();
            // Cell 0 is now `x` and disabled — click should be ignored.
            await play.clickCell(0).catch(() => undefined);
            const after = await play.getBoardState();

            expect(after).toEqual(before);
        });

        it('[TC-BRD-03] all cells disabled while computer is thinking', async () => {
            await play.clickCell(0);
            await play.waitForComputerThinking();

            for (let i = 0; i < 9; i++) {
                await expect(play.cell(i)).toBeDisabled();
            }
            await play.waitWhileComputerThinking();
        });

        it('[TC-BRD-04] all cells disabled after game ends', async () => {
            await play.setDifficulty('easy');
            await playUntilGameOver(play);

            for (let i = 0; i < 9; i++) {
                await expect(play.cell(i)).toBeDisabled();
            }
        });
    });

    // ─── Computer AI ────────────────────────────────────────────────────────

    describe('Computer AI', () => {
        it('[TC-AI-01] computer never plays into an occupied cell (Easy & Medium)', async () => {
            for (const difficulty of ['easy', 'medium'] as const) {
                await play.clickNewGame();
                await play.setDifficulty(difficulty);

                for (let move = 0; move < 4; move++) {
                    const beforeBoard = await play.getBoardState();
                    const emptyIdx = beforeBoard.findIndex((s) => s === 'empty');
                    if (emptyIdx < 0) break;

                    await play.playMove(emptyIdx);

                    const afterBoard = await play.getBoardState();
                    // No cell that was `x` or `o` should have changed.
                    afterBoard.forEach((cell, i) => {
                        if (beforeBoard[i] !== 'empty') {
                            expect(cell).toBe(beforeBoard[i]);
                        }
                    });

                    if (['human', 'computer', 'draw'].includes(await play.getStatus())) break;
                }
            }
        });

        // TC-AI-02 — pending:#BUG-1 (Hard overwrites human cells). Skipped until fixed;
        // once #BUG-1 is closed, remove `.skip` and the test will assert the post-fix invariant.
        it.skip('[TC-AI-02] computer never plays into an occupied cell on Hard (pending:#BUG-1)', async () => {
            await play.setDifficulty('hard');

            for (let move = 0; move < 4; move++) {
                const beforeBoard = await play.getBoardState();
                const emptyIdx = beforeBoard.findIndex((s) => s === 'empty');
                if (emptyIdx < 0) break;

                await play.playMove(emptyIdx);

                const afterBoard = await play.getBoardState();
                afterBoard.forEach((cell, i) => {
                    if (beforeBoard[i] !== 'empty') {
                        expect(cell).toBe(beforeBoard[i]);
                    }
                });
            }
        });

        // TC-AI-03 (Medium takes immediate win) and TC-AI-04 (Medium blocks immediate
        // threat) require constructing a specific mid-game board state. Medium's random
        // fallback for non-forcing positions makes scripted-move setup unreliable in a
        // single attempt. Documented in the test plan and the test-cases manifest;
        // implementing them deterministically needs a fixture / retry strategy that is
        // out of scope for the first automation pass.
        it.skip('[TC-AI-03] Medium takes an immediate win (needs deterministic fixture)', async () => {
            // intentionally empty
        });

        it.skip('[TC-AI-04] Medium blocks an immediate human threat (needs deterministic fixture)', async () => {
            // intentionally empty
        });

        // TC-AI-05 — pending:#BUG-1 (Hard plays no stronger than Easy). Skipped until
        // #BUG-1 is fixed; post-fix, the assertion becomes `status !== 'human'` after
        // a full game.
        it.skip('[TC-AI-05] Hard is unwinnable from any opening (pending:#BUG-1)', async () => {
            // intentionally empty
        });
    });

    // ─── Hint button ────────────────────────────────────────────────────────

    describe('Hint', () => {
        it('[TC-HNT-01] disabled while computer is thinking', async () => {
            await play.clickCell(0);
            await play.waitForComputerThinking();
            await expect(play.hintButton).toBeDisabled();
            await play.waitWhileComputerThinking();
        });

        it('[TC-HNT-02] disabled after game ends', async () => {
            await play.setDifficulty('easy');
            await playUntilGameOver(play);

            await expect(play.hintButton).toBeDisabled();
        });

        it('[TC-HNT-03] enabled on human turn during active game', async () => {
            await expect(play.hintButton).toBeEnabled();
        });
    });

    // ─── New Game / Reset ───────────────────────────────────────────────────

    describe('New Game / Reset', () => {
        it('[TC-NEW-01] New Game clears the board and resets status', async () => {
            await play.setDifficulty('easy');
            await play.playMove(0);

            await play.clickNewGame();

            const board = await play.getBoardState();
            expect(board.every((c) => c === 'empty')).toBe(true);
            expect(await play.getStatus()).toBe('playing');
            expect(await play.getDifficulty()).toBe('easy');
        });

        it('[TC-RST-01] Reset behaves equivalently to New Game', async () => {
            await play.setDifficulty('medium');
            await play.playMove(0);

            await play.clickReset();

            const board = await play.getBoardState();
            expect(board.every((c) => c === 'empty')).toBe(true);
            expect(await play.getStatus()).toBe('playing');
            expect(await play.getDifficulty()).toBe('medium');
        });
    });

    // ─── Difficulty selector ────────────────────────────────────────────────

    describe('Difficulty selector', () => {
        it('[TC-DIF-02] changing difficulty before any move applies immediately', async () => {
            await play.setDifficulty('hard');
            expect(await play.getDifficulty()).toBe('hard');

            const board = await play.getBoardState();
            expect(board.every((c) => c === 'empty')).toBe(true);
            expect(await play.getStatus()).toBe('playing');
        });

        it('[TC-DIF-03] mid-game change — accept confirm clears board with new difficulty', async () => {
            await play.setDifficulty('easy');
            await play.playMove(0);

            await acceptNextConfirm();
            await play.setDifficulty('medium');

            expect(await play.getDifficulty()).toBe('medium');
            const board = await play.getBoardState();
            expect(board.every((c) => c === 'empty')).toBe(true);
        });

        it('[TC-DIF-04] mid-game change — cancel confirm keeps board and reverts dropdown', async () => {
            await play.setDifficulty('easy');
            await play.playMove(0);
            const before = await play.getBoardState();

            await cancelNextConfirm();
            await play.setDifficulty('medium');

            expect(await play.getDifficulty()).toBe('easy');
            expect(await play.getBoardState()).toEqual(before);
        });

        it('[TC-DIF-05] difficulty change persists to the user record', async () => {
            await play.setDifficulty('medium');

            // The setting is persisted on the user record — verify via reload (in-progress board does NOT survive, but difficulty does).
            await browser.refresh();
            await play.loaded();

            expect(await play.getDifficulty()).toBe('medium');
        });

        // TC-DIF-01 (selector reflects persisted preference on login) requires logging
        // out and back in. Covered in tests/specs/persistence.spec.ts via a logout flow.
    });
});
