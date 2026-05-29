import { byTestId } from '../core/selectors';

/**
 * Header — language selector + theme toggle. Present on every view (auth, play,
 * profile, history). Functionally a component, not a page object, hence no
 * `BasePage` inheritance and no `readyTestId`.
 */
export class HeaderComponent {
    get langSelect() {
        return byTestId('select-language');
    }
    get themeButton() {
        return byTestId('btn-theme');
    }
    get title() {
        return byTestId('title');
    }

    async setLanguage(lang: 'en' | 'fa'): Promise<void> {
        await this.langSelect.selectByAttribute('value', lang);
    }

    async toggleTheme(): Promise<void> {
        await this.themeButton.click();
    }

    async getThemeButtonText(): Promise<string> {
        return this.themeButton.getText();
    }

    /** Document-level reflection of the current language. */
    async getDocumentLang(): Promise<string> {
        return browser.execute(() => document.documentElement.lang);
    }

    /** Document-level reflection of LTR / RTL. */
    async getDocumentDir(): Promise<string> {
        return browser.execute(() => document.documentElement.dir);
    }

    /** Document-level reflection of the current theme (light/dark). */
    async getDocumentTheme(): Promise<string> {
        return browser.execute(() => document.documentElement.getAttribute('data-theme') ?? '');
    }
}
