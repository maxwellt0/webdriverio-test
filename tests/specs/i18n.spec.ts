import { AuthPage } from '../pages/auth.page';
import { PlayPage } from '../pages/play.page';
import { HeaderComponent } from '../pages/header.component';
import { registerAndLand } from '../features/auth.feature';

/**
 * Localization specs — implements docs/test-cases/09-i18n.md.
 *
 * Language switch + RTL + mid-game stability. The Jalali calendar case
 * (TC-I18N-05) is P1 and is not automated this engagement.
 */
describe('Localization', () => {
    const auth = new AuthPage();
    const play = new PlayPage();
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

    // TC-I18N-02 — pending:#BUG-3. Game title / subtitle do not translate to Persian.
    // Skipped until the bug is fixed; the post-fix assertion is that the title text
    // differs between `en` and `fa`.
    it.skip('[TC-I18N-02] game title and subtitle translate to Persian (pending:#BUG-3)', async () => {
        await auth.loaded();
        const titleEn = await header.title.getText();
        await header.setLanguage('fa');
        const titleFa = await header.title.getText();

        expect(titleFa).not.toBe(titleEn);
    });

    it('[TC-I18N-03] language switch mid-game does not reset the board', async () => {
        await registerAndLand();
        await play.playMove(0); // one human + computer move

        const boardBefore = await play.getBoardState();
        const statusBefore = await play.getStatus();

        await header.setLanguage('fa');

        const boardAfter = await play.getBoardState();
        const statusAfter = await play.getStatus();

        expect(boardAfter).toEqual(boardBefore);
        // Status pill text is translated, but the logical status (data-status) is unchanged.
        expect(statusAfter).toBe(statusBefore);
        expect(await header.getDocumentLang()).toBe('fa');
    });
});
