import { AuthPage } from '../pages/auth.page';
import { PlayPage } from '../pages/play.page';
import { uniqueUsername } from '../utils/test-data';

/**
 * Navigate to the SUT, clear all storage, and reload — leaves the browser on a
 * pristine logged-out auth card. Cheap to call repeatedly; the canonical way for
 * a spec's `beforeEach` to start from a known state.
 */
export async function resetAndOpen(): Promise<void> {
    await browser.url('/');
    await browser.execute(() => window.localStorage.clear());
    await browser.refresh();
    await new AuthPage().loaded();
}

/**
 * Register a fresh user from the *currently displayed* auth card and wait until
 * Play is interactive. Returns the username used. Does NOT touch storage — so it
 * preserves global prefs (theme / lang) across calls, supporting "user switch"
 * scenarios. For a clean per-test slate use `resetAndOpen` in `beforeEach`.
 */
export async function registerAndLand(name = uniqueUsername()): Promise<string> {
    const auth = new AuthPage();
    const play = new PlayPage();
    await auth.register(name);
    await play.loaded();
    return name;
}
