/**
 * Post-login navigation bar — shared by Play, Profile, and History views.
 * Exposes Play / Profile / History switch and Log Out, plus the avatar / greeting.
 *
 * Not a "page" (it has no path of its own), so it doesn't extend BasePage.
 * Specs use it via composition: `await new NavComponent().goToProfile()`.
 */
export class NavComponent {
    private byTestId(id: string) {
        return $(`[data-testid="${id}"]`);
    }

    get root() {
        return this.byTestId('nav');
    }
    get greeting() {
        return this.byTestId('nav-hello');
    }
    get avatar() {
        return this.byTestId('nav-avatar');
    }
    get playButton() {
        return this.byTestId('nav-play');
    }
    get profileButton() {
        return this.byTestId('nav-profile');
    }
    get historyButton() {
        return this.byTestId('nav-history');
    }
    get logoutButton() {
        return this.byTestId('btn-logout');
    }

    async isVisible(): Promise<boolean> {
        return this.root.isDisplayed();
    }

    async getGreeting(): Promise<string> {
        return this.greeting.getText();
    }

    async getAvatarInitial(): Promise<string> {
        return this.avatar.getText();
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
