import { AuthPage } from '../pages/auth.page';
import { HeaderComponent } from '../pages/header.component';

/**
 * Localization specs — implements docs/test-cases/09-i18n.md.
 *
 * Only the P0 case is automated. TC-I18N-02/03/04/05 are documented in the
 * test-case manifest as P1 (no automation this engagement).
 */
describe('Localization', () => {
    const auth = new AuthPage();
    const header = new HeaderComponent();

    it('[TC-I18N-01] language switch translates labels and flips RTL', async () => {
        await auth.loaded();
        const submitEn = await auth.submitButton.getText();

        await header.setLanguage('fa');

        expect(await header.getDocumentLang()).toBe('fa');
        expect(await header.getDocumentDir()).toBe('rtl');

        const submitFa = await auth.submitButton.getText();
        expect(submitFa).not.toBe(submitEn);
        expect(submitFa.trim().length).toBeGreaterThan(0);
    });
});
