/**
 * Test-data generators / fixtures used across specs.
 * See docs/test-cases/README.md → "Test data".
 */

/** Generate a unique username per call. Prefix is configurable for legibility in logs. */
export function uniqueUsername(prefix = 'user'): string {
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${ts}_${rand}`;
}

/**
 * XSS payloads exercised by the name-injection cases (TC-REG-06, TC-PRF-06).
 * Assertion: `window.__xss !== 1` after rendering.
 */
export const XSS_PAYLOADS = [
    '<script>window.__xss=1</script>',
    '<img src=x onerror=window.__xss=1>',
    '"><svg onload=window.__xss=1>',
    'javascript:window.__xss=1',
] as const;

/** Payload for the no-upper-length-limit regression check (TC-REG-09 / LGN-05 / PRF-08). */
export const LONG_NAME = 'A'.repeat(500);
