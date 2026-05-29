import { byTestId } from '../core/selectors';

/**
 * Post-login navigation bar — shared by Play, Profile, and History views.
 * Exposes Play / Profile / History switch and Log Out, plus the avatar / greeting.
 *
 * Not a "page" (it has no path of its own), so it doesn't extend BasePage.
 * Specs use it via composition: `await new NavComponent().goToProfile()`.
 */
export class NavComponent {
    get root() {
        return byTestId('nav');
    }
    get greeting() {
        return byTestId('hello-user');
    }
    get avatar() {
        return byTestId('avatar');
    }
    get playButton() {
        return byTestId('nav-play');
    }
    get profileButton() {
        return byTestId('nav-profile');
    }
    get historyButton() {
        return byTestId('nav-history');
    }
    get logoutButton() {
        return byTestId('btn-logout');
    }

    async isVisible(): Promise<boolean> {
        return this.root.isDisplayed();
    }

    async goToPlay(): Promise<void> {
        await this.playButton.click();
    }

    async goToProfile(): Promise<void> {
        await this.profileButton.click();
    }

    async goToHistory(): Promise<void> {
        await this.historyButton.click();
    }

    async logout(): Promise<void> {
        await this.logoutButton.click();
    }
}
