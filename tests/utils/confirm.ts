/**
 * Handlers for the SUT's three `window.confirm` sites — mid-game difficulty change,
 * Clear History, Delete Account.
 *
 * The native confirm dialog is synchronous and tied to the user gesture that triggered it,
 * which makes WDIO's `acceptAlert` / `dismissAlert` racy in practice. We instead **stub**
 * `window.confirm` before the triggering click; the stub returns the desired value and the
 * SUT proceeds inline.
 */

/**
 * Install a stub that makes the next (and any subsequent) `window.confirm` return `response`.
 * Call this *before* the action that triggers the dialog.
 */
export async function stubConfirm(response: boolean): Promise<void> {
    await browser.execute((r: boolean) => {
        (window as unknown as { __confirmCalls: number }).__confirmCalls = 0;
        window.confirm = () => {
            (window as unknown as { __confirmCalls: number }).__confirmCalls += 1;
            return r;
        };
    }, response);
}

/** How many times the stubbed confirm was called since the most recent `stubConfirm`. */
export async function confirmCallCount(): Promise<number> {
    return browser.execute(() => (window as unknown as { __confirmCalls?: number }).__confirmCalls ?? 0);
}

/**
 * Run an action with a one-shot confirm response, asserting (optionally) that the dialog
 * actually appeared. The stub remains installed afterwards — call `clearConfirmStub` to
 * remove it, or simply reload the page (which restores native `confirm`).
 */
export async function withConfirm<T>(response: boolean, action: () => Promise<T>): Promise<T> {
    await stubConfirm(response);
    return action();
}

/** Reload the page to restore native `window.confirm`. Use only if a later spec needs the real dialog. */
export async function clearConfirmStub(): Promise<void> {
    await browser.refresh();
}