import { BasePage } from '../core/base.page';

export interface ProfileStats {
    wins: number;
    losses: number;
    draws: number;
}

/**
 * Profile view — username edit, stats (Win / Loss / Draw), delete account.
 */
export class ProfilePage extends BasePage {
    readonly path = '/';
    readonly readyTestId = 'view-profile';

    get nameInput() { return this.byTestId('input-profile-name'); }
    get saveButton() { return this.byTestId('btn-save-profile'); }
    get successMessage() { return this.byTestId('profile-message'); }
    get errorMessage() { return this.byTestId('profile-error'); }
    get deleteAccountButton() { return this.byTestId('btn-delete-account'); }
    get createdValue() { return this.byTestId('profile-created'); }
    get winsValue() { return this.byTestId('profile-wins'); }
    get lossesValue() { return this.byTestId('profile-losses'); }
    get drawsValue() { return this.byTestId('profile-draws'); }

    /** Replace the username and click Save. */
    async rename(newName: string): Promise<void> {
        await this.nameInput.setValue(newName);
        await this.saveButton.click();
    }

    async getStats(): Promise<ProfileStats> {
        return {
            wins: Number(await this.winsValue.getText()),
            losses: Number(await this.lossesValue.getText()),
            draws: Number(await this.drawsValue.getText()),
        };
    }

    async getError(): Promise<string> {
        const el = this.errorMessage;
        return (await el.isDisplayed()) ? el.getText() : '';
    }

    async getSuccess(): Promise<string> {
        const el = this.successMessage;
        return (await el.isDisplayed()) ? el.getText() : '';
    }

    /**
     * Click Delete Account. Caller is responsible for handling the
     * `window.confirm` dialog before / after this call.
     */
    async deleteAccount(): Promise<void> {
        await this.deleteAccountButton.click();
    }
}