import { BasePage } from '../core/base.page';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type CellState = 'empty' | 'x' | 'o';

/**
 * Play view — the game board, status pill, action row, difficulty selector.
 *
 * Sync model: the canonical readiness signal is the `data-status` attribute on
 * `[data-testid="status"]`. The ~1.5 s computer-move delay is observed via
 * `waitForHumanTurn()`. Never use `browser.pause`.
 */
export class PlayPage extends BasePage {
    readonly path = '/';
    readonly readyTestId = 'view-play';

    get board() {
        return this.byTestId('board');
    }
    get status() {
        return this.byTestId('status');
    }
    get newGameButton() {
        return this.byTestId('btn-new-game');
    }
    get hintButton() {
        return this.byTestId('btn-hint');
    }
    get resetButton() {
        return this.byTestId('btn-reset');
    }
    get difficultySelect() {
        return this.byTestId('select-difficulty');
    }

    cell(index: number) {
        return this.byTestId(`cell-${index}`);
    }

    async getCellState(index: number): Promise<CellState> {
        const state = await this.cell(index).getAttribute('data-state');
        return (state as CellState) ?? 'empty';
    }

    async getBoardState(): Promise<CellState[]> {
        return Promise.all([...Array(9).keys()].map((i) => this.getCellState(i)));
    }

    /** Raw `data-status` value, e.g. `"playing"`, `"computer-thinking"`, `"human"`, `"computer"`, `"draw"`. */
    async getStatus(): Promise<string> {
        return (await this.status.getAttribute('data-status')) ?? '';
    }

    async clickCell(index: number): Promise<void> {
        await this.cell(index).click();
    }

    /**
     * Make a human move and wait for the computer's response.
     * Resolves when the status returns to the human-turn state (or terminal).
     */
    async playMove(index: number): Promise<void> {
        await this.clickCell(index);
        await this.waitWhileComputerThinking();
    }

    async waitForComputerThinking(timeout = 2000): Promise<void> {
        await browser.waitUntil(async () => (await this.getStatus()) === 'computer-thinking', {
            timeout,
            timeoutMsg: 'Status never became computer-thinking',
        });
    }

    async waitWhileComputerThinking(timeout = 5000): Promise<void> {
        await browser.waitUntil(async () => (await this.getStatus()) !== 'computer-thinking', {
            timeout,
            timeoutMsg: 'Status stuck on computer-thinking',
        });
    }

    async waitForGameOver(timeout = 10000): Promise<void> {
        await browser.waitUntil(
            async () => ['human', 'computer', 'draw'].includes(await this.getStatus()),
            { timeout, timeoutMsg: 'Game did not reach a terminal state' },
        );
    }

    async setDifficulty(level: Difficulty): Promise<void> {
        await this.difficultySelect.selectByAttribute('value', level);
    }

    async getDifficulty(): Promise<Difficulty> {
        return (await this.difficultySelect.getValue()) as Difficulty;
    }

    async clickNewGame(): Promise<void> {
        await this.newGameButton.click();
    }
    async clickHint(): Promise<void> {
        await this.hintButton.click();
    }
    async clickReset(): Promise<void> {
        await this.resetButton.click();
    }
}
