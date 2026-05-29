/**
 * Shared probe for XSS specs (TC-REG-06, TC-PRF-06).
 *
 * The probe is a `window.__xss` integer that XSS payloads attempt to set to a
 * non-zero value (e.g. `<script>window.__xss=1</script>`). If the payload is
 * rendered as literal text, the value stays at 0. Install the probe AFTER any
 * page refresh — refresh wipes `window` globals.
 */

declare global {
    interface Window {
        __xss?: number;
    }
}

/** Reset `window.__xss` to 0. Call after every navigation / refresh. */
export const installXssProbe = (): Promise<void> =>
    browser.execute(() => {
        window.__xss = 0;
    });

/** Assert that no XSS payload has executed since the probe was installed. */
export async function expectNoXss(): Promise<void> {
    const v = await browser.execute(() => window.__xss);
    expect(v).toBe(0);
}
