/**
 * Handlers for the SUT's three `window.confirm` sites — mid-game difficulty change,
 * Clear History, Delete Account.
 *
 * The native confirm dialog is synchronous and tied to the user gesture that triggered it,
 * which makes WDIO's `acceptAlert` / `dismissAlert` racy in practice. We instead **stub**
 * `window.confirm` before the triggering click; the stub returns the desired value and the
 * SUT proceeds inline.
 */

/** Install a stub that makes any subsequent `window.confirm` return `response`. */
async function stubConfirm(response: boolean): Promise<void> {
    await browser.execute((r: boolean) => {
        window.confirm = () => r;
    }, response);
}

/** Any subsequent `window.confirm` resolves to OK / true. */
export async function acceptNextConfirm(): Promise<void> {
    await stubConfirm(true);
}

/** Any subsequent `window.confirm` resolves to Cancel / false. */
export async function cancelNextConfirm(): Promise<void> {
    await stubConfirm(false);
}
