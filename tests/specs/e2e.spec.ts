import { AuthPage } from '../pages/auth.page';
import { PlayPage } from '../pages/play.page';
import { ProfilePage } from '../pages/profile.page';
import { HistoryPage } from '../pages/history.page';
import { NavComponent } from '../pages/nav.component';
import { HeaderComponent } from '../pages/header.component';
import { registerAndLand } from '../fixtures/auth.fixture';
import { loseOneGame, playUntilGameOver, winOneGame } from '../fixtures/play.fixture';
import { readStorage } from '../utils/storage';
import { escapeRegex } from '../utils/regex';

/**
 * End-to-end user journeys — multi-feature happy paths that exercise the suite
 * top to bottom. Each `it` here represents a real user session, not an isolated
 * unit. These complement the per-area specs by validating that the features
 * compose correctly.
 */
describe('End-to-end flows', () => {
    const auth = new AuthPage();
    const play = new PlayPage();
    const profile = new ProfilePage();
    const history = new HistoryPage();
    const nav = new NavComponent();
    const header = new HeaderComponent();

    it('[E2E-01] new player: register → win on Easy → lose on Medium → see history → logout', async () => {
        // 1. Create a user
        const name = await registerAndLand();

        // 2. Win a game on Easy
        await winOneGame(play, 'easy');
        expect(await play.getStatus()).toBe('human');

        // 3. Lose a game on Medium
        await play.clickNewGame();
        await loseOneGame(play, 'medium');
        expect(await play.getStatus()).toBe('computer');

        // 4. See the history — two rows, newest first
        await nav.goToHistory();
        await history.loaded();
        expect(await history.rowCount()).toBe(2);

        const newest = await history.getRow(0);
        const older = await history.getRow(1);
        expect(newest.result).toMatch(/loss/i);
        expect(newest.difficulty).toMatch(/medium/i);
        expect(older.result).toMatch(/win/i);
        expect(older.difficulty).toMatch(/easy/i);

        // Stats on Profile reflect the same outcomes
        await nav.goToProfile();
        await profile.loaded();
        const stats = await profile.getStats();
        expect(stats).toEqual({ wins: 1, losses: 1, draws: 0 });
        await expect(profile.nameInput).toHaveValue(name);

        // 5. Log out — auth card returns, session cleared, user record kept
        await nav.logout();
        await auth.loaded();
        expect(await auth.isOpen()).toBe(true);
        expect(await readStorage<string>('session')).toBeNull();
        const users = await readStorage<Record<string, unknown>>('users');
        expect(Object.keys(users ?? {})).toContain(name.toLowerCase());
    });

    it('[E2E-02] returning player: register → set preferences → logout → log back in → preferences and account persist', async () => {
        const name = await registerAndLand();

        // Set a non-default theme, language, and difficulty.
        await header.toggleTheme(); // light → dark
        await header.setLanguage('fa');
        await play.setDifficulty('medium');

        // Play one game so the user has history to carry across sessions.
        // We don't care about the outcome for this assertion — just need a finished game.
        await playUntilGameOver(play);

        // Log out — global preferences (theme / language) stay because they are global,
        // session is cleared, user record is kept.
        await nav.logout();
        await auth.loaded();
        expect(await header.getDocumentTheme()).toBe('dark');
        expect(await header.getDocumentLang()).toBe('fa');

        // Log back in — difficulty preference and history come back from the user record.
        await auth.login(name);
        await play.loaded();

        expect(await play.getDifficulty()).toBe('medium');
        await expect(nav.greeting).toHaveText(new RegExp(escapeRegex(name)));

        await nav.goToHistory();
        await history.loaded();
        expect(await history.rowCount()).toBe(1);

        await nav.goToProfile();
        await profile.loaded();
        expect((await profile.getStats()).wins).toBe(1);
    });
});
