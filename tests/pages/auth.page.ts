import { BasePage } from '../core/base.page';

/**
 * Auth view — shown when no user is signed in.
 * Has two modes: `register` and `login`, switchable via the link below the form.
 */
export class AuthPage extends BasePage {
    readonly path = '/';
    readonly readyTestId = 'auth-form';

    get nameInput() { return this.byTestId('auth-name'); }
    get submitButton() { return this.byTestId('auth-submit'); }
    get switchModeLink() { return this.byTestId('btn-switch-mode'); }
    get errorMessage() { return this.byTestId('auth-error'); }

    /** Current mode reflected by the `data-mode` attribute on the form. */
    async getMode(): Promise<'register' | 'login'> {
        const mode = await this.byTestId(this.readyTestId).getAttribute('data-mode');
        return mode === 'login' ? 'login' : 'register';
    }

    async ensureMode(mode: 'register' | 'login'): Promise<void> {
        if ((await this.getMode()) !== mode) {
            await this.switchModeLink.click();
        }
    }

    /** Register a brand-new user. Asserts post-condition is not part of this method. */
    async register(name: string): Promise<void> {
        await this.ensureMode('register');
        await this.nameInput.setValue(name);
        await this.submitButton.click();
    }

    /** Log in as an existing user. */
    async login(name: string): Promise<void> {
        await this.ensureMode('login');
        await this.nameInput.setValue(name);
        await this.submitButton.click();
    }
}