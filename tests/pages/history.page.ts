import { BasePage } from '../core/base.page';

export interface HistoryRow {
    date: string;
    difficulty: string;
    result: string;
}

/**
 * History view — table of past games, empty state, clear-history action.
 * Rows are 0-indexed, newest first.
 */
export class HistoryPage extends BasePage {
    readonly path = '/';
    readonly readyTestId = 'view-history';

    get emptyState() { return this.byTestId('history-empty'); }
    get clearButton() { return this.byTestId('btn-clear-history'); }

    async isEmpty(): Promise<boolean> {
        return this.emptyState.isDisplayed();
    }

    async rowCount(): Promise<number> {
        const rows = await $$('[data-testid^="history-row-"]');
        return rows.length;
    }

    async getRow(index: number): Promise<HistoryRow> {
        return {
            date: await this.byTestId(`history-date-${index}`).getText(),
            difficulty: await this.byTestId(`history-difficulty-${index}`).getText(),
            result: await this.byTestId(`history-result-${index}`).getText(),
        };
    }

    /**
     * Click Clear History. Caller is responsible for handling the
     * `window.confirm` dialog before / after this call.
     */
    async clearHistory(): Promise<void> {
        await this.clearButton.click();
    }
}