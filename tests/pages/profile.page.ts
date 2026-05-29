import { BasePage } from '../core/base.page';
import { byTestId } from '../core/selectors';

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

    get nameInput() {
        return byTestId('input-profile-name');
    }
    get saveButton() {
        return byTestId('btn-save-profile');
    }
    get successMessage() {
        return byTestId('profile-message');
    }
    get errorMessage() {
        return byTestId('profile-error');
    }
    get deleteAccountButton() {
        return byTestId('btn-delete-account');
    }
    get createdValue() {
        return byTestId('profile-created');
    }
    get winsValue() {
        return byTestId('profile-wins');
    }
    get lossesValue() {
        return byTestId('profile-losses');
    }
    get drawsValue() {
        return byTestId('profile-draws');
    }

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

    /**
     * Click Delete Account. Caller is responsible for handling the
     * `window.confirm` dialog before / after this call.
     */
    async deleteAccount(): Promise<void> {
        await this.deleteAccountButton.click();
    }
}
