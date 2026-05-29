import { AuthPage } from '../pages/auth.page';
import { PlayPage } from '../pages/play.page';
import { NavComponent } from '../pages/nav.component';
import { escapeRegex } from '../utils/regex';
import { readStorage, seedUser } from '../utils/storage';
import { uniqueUsername, XSS_PAYLOADS } from '../utils/test-data';

/**
 * Auth specs — implements docs/test-cases/03-auth.md.
 *
 * Per-test reset (localStorage cleared + page reloaded) runs in wdio.conf.ts → beforeTest,
 * so every `it` starts on the auth card with no user signed in and `lang=en`, `theme=light`.
 */
describe('Authentication', () => {
    const auth = new AuthPage();
    const play = new PlayPage();
    const nav = new NavComponent();

    describe('Register', () => {
        it('[TC-REG-01] happy path: register with a valid new name', async () => {
            const name = uniqueUsername();

            await auth.register(name);

            await play.loaded();
            await expect(nav.greeting).toHaveText(new RegExp(escapeRegex(name)));

            const users = await readStorage<Record<string, unknown>>('users');
            expect(Object.keys(users ?? {})).toContain(name.toLowerCase());
            expect(await readStorage<string>('session')).toBe(name.toLowerCase());
        });

        it('[TC-REG-02] rejects empty name', async () => {
            await auth.register('');

            await expect(auth.errorMessage).toBeDisplayed();
            await expect(auth.errorMessage).toHaveText(/enter your name/i);
            expect(await auth.isOpen()).toBe(true);
        });

        it('[TC-REG-03] rejects whitespace-only name', async () => {
            await auth.register('   ');

            await expect(auth.errorMessage).toBeDisplayed();
            await expect(auth.errorMessage).toHaveText(/enter your name/i);
        });

        it('[TC-REG-04] rejects 1-character name', async () => {
            await auth.register('A');

            await expect(auth.errorMessage).toBeDisplayed();
            await expect(auth.errorMessage).toHaveText(/at least 2/i);
        });

        it('[TC-REG-05] rejects duplicate name (case-insensitive)', async () => {
            const existing = uniqueUsername();
            await seedUser({ name: existing });

            for (const variant of [existing, existing.toUpperCase(), existing.toLowerCase()]) {
                await auth.register(variant);
                await expect(auth.errorMessage).toBeDisplayed();
                await expect(auth.errorMessage).toHaveText(/already exists/i);
            }
        });

        it('[TC-REG-06] name injection / XSS does not execute on register', async () => {
            for (const payload of XSS_PAYLOADS) {
                // Each iteration starts fresh: clear storage, install probe, reload.
                await browser.execute(() => {
                    window.localStorage.clear();
                    (window as unknown as { __xss: number }).__xss = 0;
                });
                await browser.refresh();
                await auth.loaded();

                await auth.register(payload);
                await play.loaded();

                const xss = await browser.execute(
                    () => (window as unknown as { __xss: number }).__xss,
                );
                expect(xss).toBe(0);

                // Greeting must render the payload as literal text, not as HTML.
                await expect(nav.greeting).toHaveText(new RegExp(escapeRegex(payload)));
            }
        });
    });

    describe('Login', () => {
        it('[TC-LGN-01] happy path: login with an existing name', async () => {
            const name = uniqueUsername();
            await seedUser({ name });

            await auth.login(name);

            await play.loaded();
            await expect(nav.greeting).toHaveText(new RegExp(escapeRegex(name)));
        });

        it('[TC-LGN-02] case-insensitive lookup', async () => {
            const stored = uniqueUsername('Mixed');
            await seedUser({ name: stored });

            for (const variant of [stored.toUpperCase(), stored.toLowerCase()]) {
                await auth.login(variant);
                await play.loaded();
                // Greeting always shows the *stored* casing, regardless of which form variant was used.
                await expect(nav.greeting).toHaveText(new RegExp(escapeRegex(stored)));
                await nav.logout();
                await auth.loaded();
            }
        });

        it('[TC-LGN-03] rejects non-existent name', async () => {
            await auth.login(uniqueUsername('ghost'));

            await expect(auth.errorMessage).toBeDisplayed();
            await expect(auth.errorMessage).toHaveText(/no account/i);
            expect(await auth.isOpen()).toBe(true);
        });

        it('[TC-LGN-04] rejects empty / whitespace name', async () => {
            await auth.login('   ');

            await expect(auth.errorMessage).toBeDisplayed();
            await expect(auth.errorMessage).toHaveText(/enter your name/i);
        });
    });

    describe('Mode switching', () => {
        it('[TC-MOD-01] switching modes clears the prior error', async () => {
            await auth.register(''); // produce an error in register mode
            await expect(auth.errorMessage).toBeDisplayed();

            await auth.switchModeLink.click();

            await expect(auth.errorMessage).not.toBeDisplayed();
            expect(await auth.getMode()).toBe('login');
        });
    });
});
