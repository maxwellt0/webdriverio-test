import { HistoryPage } from '../pages/history.page';
import { PlayPage } from '../pages/play.page';
import { NavComponent } from '../pages/nav.component';
import { registerAndLand } from '../features/auth.feature';
import { playUntilGameOver } from '../features/play.feature';
import { acceptNextConfirm, cancelNextConfirm } from '../utils/confirm';

/**
 * History-view specs — implements docs/test-cases/06-history.md.
 *
 * Each `it` registers a fresh user (no prior history) and exercises the
 * history-recording rules via real gameplay where possible.
 */
describe('History', () => {
    const play = new PlayPage();
    const history = new HistoryPage();
    const nav = new NavComponent();

    beforeEach(async () => {
        await registerAndLand();
    });

    it('[TC-HIS-01] empty state shown for a fresh user', async () => {
        await nav.goToHistory();
        await history.loaded();

        expect(await history.isEmpty()).toBe(true);
        expect(await history.rowCount()).toBe(0);
        await expect(history.clearButton).not.toBeDisplayed();
    });

    it('[TC-HIS-02] finishing a game appends exactly one row', async () => {
        await play.setDifficulty('easy');
        await playUntilGameOver(play);

        await nav.goToHistory();
        await history.loaded();

        expect(await history.rowCount()).toBe(1);
    });

    it('[TC-HIS-03] New Game does not duplicate the previous history row', async () => {
        await play.setDifficulty('easy');
        await playUntilGameOver(play);

        await play.clickNewGame();

        await nav.goToHistory();
        await history.loaded();
        expect(await history.rowCount()).toBe(1);
    });

    it('[TC-HIS-04] Reset before game-end does not record anything', async () => {
        await play.playMove(0); // one move; game not over
        await play.clickReset();

        await nav.goToHistory();
        await history.loaded();
        expect(await history.rowCount()).toBe(0);
        expect(await history.isEmpty()).toBe(true);
    });

    it('[TC-HIS-05] table columns reflect actual game data', async () => {
        await play.setDifficulty('medium');
        await playUntilGameOver(play);
        const finalStatus = await play.getStatus(); // 'human' | 'computer' | 'draw'

        await nav.goToHistory();
        await history.loaded();

        const row = await history.getRow(0);
        expect(row.difficulty).toMatch(/medium/i);

        const expectedResult = finalStatus === 'human' ? /win/i
            : finalStatus === 'computer' ? /loss/i
            : /draw/i;
        expect(row.result).toMatch(expectedResult);

        // Date is locale-formatted; we only require non-empty here. Locale-specific
        // assertions live in tests/specs/i18n.spec.ts.
        expect(row.date.trim().length).toBeGreaterThan(0);
    });

    it('[TC-HIS-06] newest entry appears first', async () => {
        await play.setDifficulty('easy');
        await playUntilGameOver(play); // game A

        await play.clickNewGame();
        await play.setDifficulty('hard');
        await playUntilGameOver(play); // game B

        await nav.goToHistory();
        await history.loaded();

        expect(await history.rowCount()).toBe(2);
        const first = await history.getRow(0);
        const second = await history.getRow(1);
        expect(first.difficulty).toMatch(/hard/i);
        expect(second.difficulty).toMatch(/easy/i);
    });

    it('[TC-HIS-07] Clear History — Cancel keeps rows, OK clears them', async () => {
        await play.setDifficulty('easy');
        await playUntilGameOver(play);
        await nav.goToHistory();
        await history.loaded();
        expect(await history.rowCount()).toBe(1);

        await cancelNextConfirm();
        await history.clearHistory();
        expect(await history.rowCount()).toBe(1);

        await acceptNextConfirm();
        await history.clearHistory();
        expect(await history.isEmpty()).toBe(true);
        expect(await history.rowCount()).toBe(0);
    });
});
