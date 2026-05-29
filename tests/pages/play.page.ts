import { BasePage } from '../core/base.page';
import { byTestId } from '../core/selectors';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type CellState = 'empty' | 'x' | 'o';

/** Game-over states reflected on `[data-testid="status"]`'s `data-status` attribute. */
export type TerminalStatus = 'human' | 'computer' | 'draw';
/** All values the `data-status` attribute can take. */
export type PlayStatus = TerminalStatus | 'your-turn' | 'computer-thinking';

export const TERMINAL_STATUSES: readonly TerminalStatus[] = ['human', 'computer', 'draw'];
export const isTerminal = (s: string): s is TerminalStatus =>
    (TERMINAL_STATUSES as readonly string[]).includes(s);

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
        return byTestId('board');
    }
    get status() {
        return byTestId('status');
    }
    get newGameButton() {
        return byTestId('btn-new');
    }
    get hintButton() {
        return byTestId('btn-hint');
    }
    get resetButton() {
        return byTestId('btn-reset');
    }
    get difficultySelect() {
        return byTestId('select-difficulty');
    }

    cell(index: number) {
        return byTestId(`cell-${index}`);
    }

    async getCellState(index: number): Promise<CellState> {
        const state = await this.cell(index).getAttribute('data-state');
        return (state as CellState) ?? 'empty';
    }

    /** Read all 9 cell states in a single round-trip via `browser.execute`. */
    async getBoardState(): Promise<CellState[]> {
        return browser.execute(() => {
            const out: string[] = Array(9).fill('empty');
            for (const el of document.querySelectorAll('[data-testid^="cell-"]')) {
                const id = el.getAttribute('data-testid') ?? '';
                const i = Number(id.slice('cell-'.length));
                if (Number.isInteger(i) && i >= 0 && i < 9) {
                    out[i] = el.getAttribute('data-state') ?? 'empty';
                }
            }
            return out;
        }) as Promise<CellState[]>;
    }

    /** Typed `data-status` value. */
    async getStatus(): Promise<PlayStatus> {
        return ((await this.status.getAttribute('data-status')) ?? '') as PlayStatus;
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

    /** Wait until `getStatus()` satisfies `pred`. Shared body for all wait helpers below. */
    private waitForStatus(
        pred: (s: PlayStatus) => boolean,
        timeoutMsg: string,
        timeout = 5000,
    ): Promise<true | void> {
        return browser.waitUntil(async () => pred(await this.getStatus()), { timeout, timeoutMsg });
    }

    async waitForComputerThinking(): Promise<void> {
        await this.waitForStatus(
            (s) => s === 'computer-thinking',
            'Status never became computer-thinking',
            5000,
        );
    }

    async waitWhileComputerThinking(): Promise<void> {
        await this.waitForStatus(
            (s) => s !== 'computer-thinking',
            'Status stuck on computer-thinking',
            5000,
        );
    }

    async waitForGameOver(): Promise<void> {
        await this.waitForStatus(isTerminal, 'Game did not reach a terminal state', 10000);
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
