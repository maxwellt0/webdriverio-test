import { AuthPage } from '../pages/auth.page';
import { ProfilePage } from '../pages/profile.page';
import { HistoryPage } from '../pages/history.page';
import { PlayPage } from '../pages/play.page';
import { NavComponent } from '../pages/nav.component';
import { HeaderComponent } from '../pages/header.component';
import { registerAndLand } from '../features/auth.feature';

/**
 * Header specs — implements docs/test-cases/02-header.md.
 *
 * The header (language selector + theme button) is present on every view.
 * Functional details specific to each control live in theme.spec.ts and
 * i18n.spec.ts; this file focuses on the header *contract* — controls present,
 * translations apply, theme attribute flips, settings persist across reload.
 */
describe('Header — language & theme', () => {
    const auth = new AuthPage();
    const play = new PlayPage();
    const profile = new ProfilePage();
    const history = new HistoryPage();
    const nav = new NavComponent();
    const header = new HeaderComponent();

    it('[TC-HDR-01] language switch translates labels and flips RTL', async () => {
        await auth.loaded();
        const submitBefore = await auth.submitButton.getText();

        await header.setLanguage('fa');

        const submitAfter = await auth.submitButton.getText();
        expect(submitAfter).not.toBe(submitBefore);
        expect(await header.getDocumentLang()).toBe('fa');
        expect(await header.getDocumentDir()).toBe('rtl');
    });

    it('[TC-HDR-02] theme toggle flips data-theme and updates button label', async () => {
        await auth.loaded();
        expect(await header.getDocumentTheme()).toBe('light');
        const labelBefore = await header.getThemeButtonText();

        await header.toggleTheme();

        expect(await header.getDocumentTheme()).toBe('dark');
        const labelAfter = await header.getThemeButtonText();
        expect(labelAfter).not.toBe(labelBefore);
    });

    it('[TC-HDR-03] both selections persist across reload', async () => {
        await auth.loaded();
        await header.setLanguage('fa');
        await header.toggleTheme(); // light → dark

        await browser.refresh();
        await auth.loaded();

        expect(await header.getDocumentLang()).toBe('fa');
        expect(await header.getDocumentDir()).toBe('rtl');
        expect(await header.getDocumentTheme()).toBe('dark');
    });

    it('[TC-HDR-04] header controls present on every authenticated view', async () => {
        await registerAndLand();

        // Play
        await expect(header.langSelect).toBeDisplayed();
        await expect(header.themeButton).toBeDisplayed();

        await nav.goToProfile();
        await profile.loaded();
        await expect(header.langSelect).toBeDisplayed();
        await expect(header.themeButton).toBeDisplayed();

        await nav.goToHistory();
        await history.loaded();
        await expect(header.langSelect).toBeDisplayed();
        await expect(header.themeButton).toBeDisplayed();

        await nav.goToPlay();
        await play.loaded();
        await expect(header.langSelect).toBeDisplayed();
        await expect(header.themeButton).toBeDisplayed();
    });
});
