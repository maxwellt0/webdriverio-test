import { AuthPage } from '../pages/auth.page';
import { NavComponent } from '../pages/nav.component';
import { HeaderComponent } from '../pages/header.component';
import { registerAndLand } from '../fixtures/auth.fixture';

/**
 * Theme specs — implements docs/test-cases/08-theme.md.
 *
 * Focused on theme-specific behavior: instantaneous toggle, persistence across
 * reload / logout / user switch. The toggle mechanics shared with the language
 * selector are covered in header.spec.ts.
 */
describe('Theme', () => {
    const auth = new AuthPage();
    const nav = new NavComponent();
    const header = new HeaderComponent();

    it('[TC-THM-01] theme toggle updates the active theme synchronously', async () => {
        await auth.loaded();
        expect(await header.getDocumentTheme()).toBe('light');

        await header.toggleTheme();
        expect(await header.getDocumentTheme()).toBe('dark');

        await header.toggleTheme();
        expect(await header.getDocumentTheme()).toBe('light');
    });

    it('[TC-THM-02] theme persists across reload, logout, and user switch', async () => {
        await registerAndLand();
        await header.toggleTheme(); // light → dark
        expect(await header.getDocumentTheme()).toBe('dark');

        // Across reload
        await browser.refresh();
        expect(await header.getDocumentTheme()).toBe('dark');

        // Across logout — same browser, no user signed in
        await nav.logout();
        await auth.loaded();
        expect(await header.getDocumentTheme()).toBe('dark');

        // Across user switch — register a different user
        await registerAndLand();
        expect(await header.getDocumentTheme()).toBe('dark');
    });
});
