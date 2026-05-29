import { AuthPage } from '../pages/auth.page';
import { PlayPage } from '../pages/play.page';
import { NavComponent } from '../pages/nav.component';
import { HeaderComponent } from '../pages/header.component';
import { registerAndLand } from '../features/auth.feature';
import { readStorage } from '../utils/storage';

/**
 * Persistence specs — implements docs/test-cases/10-persistence.md.
 *
 * Covers what survives a reload (theme / language / session / user records),
 * what does NOT (in-progress game board, currently-selected view), plus the
 * "difficulty stored on the user record" check that needs a logout/login cycle.
 */
describe('Persistence', () => {
    const auth = new AuthPage();
    const play = new PlayPage();
    const nav = new NavComponent();
    const header = new HeaderComponent();

    it('[TC-PRS-01] theme, language, session, and user records survive reload', async () => {
        const name = await registerAndLand();
        await header.toggleTheme(); // dark
        await header.setLanguage('fa');

        await browser.refresh();
        await play.loaded();

        expect(await header.getDocumentTheme()).toBe('dark');
        expect(await header.getDocumentLang()).toBe('fa');
        expect(await readStorage<string>('session')).toBe(name.toLowerCase());

        const users = await readStorage<Record<string, unknown>>('users');
        expect(Object.keys(users ?? {})).toContain(name.toLowerCase());
    });

    it('[TC-PRS-02] in-progress game board does NOT survive reload', async () => {
        await registerAndLand();
        await play.playMove(0);

        const boardBefore = await play.getBoardState();
        expect(boardBefore.some((c) => c === 'x')).toBe(true);

        await browser.refresh();
        await play.loaded();

        const boardAfter = await play.getBoardState();
        expect(boardAfter.every((c) => c === 'empty')).toBe(true);
        expect(await play.getStatus()).toBe('playing');
    });

    it('[TC-PRS-03] reload always lands on Play view, regardless of pre-reload view', async () => {
        await registerAndLand();
        await nav.goToHistory();

        await browser.refresh();

        await play.loaded();
        expect(await play.isOpen()).toBe(true);
    });

    it('[TC-DIF-01 / TC-PRS-04] difficulty persists to user record (re-login → still set)', async () => {
        const name = await registerAndLand();
        await play.setDifficulty('hard');
        expect(await play.getDifficulty()).toBe('hard');

        await nav.logout();
        await auth.loaded();
        await auth.login(name);
        await play.loaded();

        expect(await play.getDifficulty()).toBe('hard');
    });
});
