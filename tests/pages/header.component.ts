/**
 * Header — language selector + theme toggle. Present on every view (auth, play,
 * profile, history). Functionally a component, not a page object, hence no
 * `BasePage` inheritance and no `readyTestId`.
 */
export class HeaderComponent {
    private byTestId(id: string) {
        return $(`[data-testid="${id}"]`);
    }

    get langSelect() {
        return this.byTestId('lang-select');
    }
    get themeButton() {
        return this.byTestId('btn-theme');
    }
    get title() {
        return this.byTestId('app-title');
    }
    get subtitle() {
        return this.byTestId('app-subtitle');
    }

    async setLanguage(lang: 'en' | 'fa'): Promise<void> {
        await this.langSelect.selectByAttribute('value', lang);
    }

    async getLanguage(): Promise<string> {
        return this.langSelect.getValue();
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
