import { ProfilePage } from '../pages/profile.page';
import { AuthPage } from '../pages/auth.page';
import { NavComponent } from '../pages/nav.component';
import { registerAndLand, resetAndOpen } from '../fixtures/auth.fixture';
import { acceptNextConfirm, cancelNextConfirm } from '../utils/confirm';
import { readStorage, seedUser } from '../utils/storage';
import { uniqueUsername, XSS_PAYLOADS } from '../utils/test-data';
import { escapeRegex } from '../utils/regex';
import { expectNoXss, installXssProbe } from '../utils/xss-probe';

/**
 * Profile-view specs — implements docs/test-cases/07-profile.md.
 *
 * Pre-test reset runs in wdio.conf.ts → beforeTest. Each `it` registers a
 * fresh user, navigates to Profile, and exercises the rename / stats / delete
 * surface.
 */
describe('Profile', () => {
    const auth = new AuthPage();
    const profile = new ProfilePage();
    const nav = new NavComponent();

    let currentName: string;

    beforeEach(async () => {
        await resetAndOpen();
        currentName = await registerAndLand();
        await nav.goToProfile();
        await profile.loaded();
    });

    it('[TC-PRF-01] shows current name, Created date, and zeroed stats', async () => {
        await expect(profile.nameInput).toHaveValue(currentName);
        await expect(profile.createdValue).not.toHaveText('');

        const stats = await profile.getStats();
        expect(stats).toEqual({ wins: 0, losses: 0, draws: 0 });
    });

    it('[TC-PRF-02] rename to a new unique name succeeds', async () => {
        const newName = uniqueUsername('renamed');

        await profile.rename(newName);

        await expect(profile.successMessage).toBeDisplayed();
        await expect(nav.greeting).toHaveText(new RegExp(escapeRegex(newName)));

        const users = await readStorage<Record<string, unknown>>('users');
        expect(Object.keys(users ?? {})).toContain(newName.toLowerCase());
        expect(Object.keys(users ?? {})).not.toContain(currentName.toLowerCase());
    });

    it('[TC-PRF-03] rename to an existing other user fails', async () => {
        const other = uniqueUsername('other');
        await seedUser({ name: other });

        await profile.rename(other);

        await expect(profile.errorMessage).toBeDisplayed();
        await expect(profile.errorMessage).toHaveText(/already uses this name/i);
        await expect(nav.greeting).toHaveText(new RegExp(escapeRegex(currentName)));
    });

    it('[TC-PRF-05] Delete Account — Cancel keeps the user, OK removes it', async () => {
        await cancelNextConfirm();
        await profile.deleteAccount();
        // Cancel keeps the user on the Profile view, account intact.
        await expect(profile.nameInput).toBeDisplayed();

        await acceptNextConfirm();
        await profile.deleteAccount();

        await auth.loaded();
        await auth.login(currentName);
        await expect(auth.errorMessage).toHaveText(/no account/i);
    });

    it('[TC-PRF-06] rename name injection / XSS does not execute', async () => {
        await installXssProbe();

        for (const payload of XSS_PAYLOADS) {
            await profile.rename(payload);
            await expect(profile.successMessage).toBeDisplayed();

            await expectNoXss();

            // Visit nav greeting; ensure the payload renders as text, not as HTML.
            await expect(nav.greeting).toHaveText(new RegExp(escapeRegex(payload)));

            // Navigate around to exercise additional render sites.
            await nav.goToHistory();
            await nav.goToProfile();
            await profile.loaded();

            await expectNoXss();
        }
    });
});
