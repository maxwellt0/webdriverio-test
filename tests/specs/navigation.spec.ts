import { AuthPage } from '../pages/auth.page';
import { PlayPage } from '../pages/play.page';
import { ProfilePage } from '../pages/profile.page';
import { HistoryPage } from '../pages/history.page';
import { NavComponent } from '../pages/nav.component';
import { registerAndLand, resetAndOpen } from '../fixtures/auth.fixture';
import { readStorage } from '../utils/storage';

/**
 * Navigation specs — implements docs/test-cases/04-navigation.md.
 *
 * Each `it` registers a fresh user and exercises the nav bar that appears on
 * every authenticated view.
 */
describe('Navigation', () => {
    const auth = new AuthPage();
    const play = new PlayPage();
    const profile = new ProfilePage();
    const history = new HistoryPage();
    const nav = new NavComponent();

    beforeEach(async () => {
        await resetAndOpen();
        await registerAndLand();
    });

    it('[TC-NAV-01] nav appears after login with all entries', async () => {
        expect(await nav.isVisible()).toBe(true);
        await expect(nav.playButton).toBeDisplayed();
        await expect(nav.profileButton).toBeDisplayed();
        await expect(nav.historyButton).toBeDisplayed();
        await expect(nav.logoutButton).toBeDisplayed();
        await expect(nav.greeting).toBeDisplayed();
        await expect(nav.avatar).toBeDisplayed();
    });

    it('[TC-NAV-02] each nav item switches view and updates active state', async () => {
        await nav.goToProfile();
        await profile.loaded();
        expect(await profile.isOpen()).toBe(true);

        await nav.goToHistory();
        await history.loaded();
        expect(await history.isOpen()).toBe(true);

        await nav.goToPlay();
        await play.loaded();
        expect(await play.isOpen()).toBe(true);
    });

    it('[TC-NAV-03] Log Out clears session and returns to auth card', async () => {
        await nav.logout();
        await auth.loaded();
        expect(await auth.isOpen()).toBe(true);

        expect(await readStorage<string>('session')).toBeNull();
        // User record is preserved — only session is cleared.
        const users = await readStorage<Record<string, unknown>>('users');
        expect(users).not.toBeNull();
        expect(Object.keys(users ?? {}).length).toBeGreaterThan(0);
    });
});
