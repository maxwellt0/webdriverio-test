import { AuthPage } from '../pages/auth.page';
import { PlayPage } from '../pages/play.page';
import { uniqueUsername } from '../utils/test-data';

/**
 * Register a fresh user and wait until the Play view is interactive.
 * Returns the username used (caller can pass one in, or let the helper generate one).
 *
 * This is the only auth-related cross-page workflow worth abstracting — the rest
 * of auth coverage lives directly in tests/specs/auth.spec.ts via the AuthPage
 * primitives.
 */
export async function registerAndLand(name = uniqueUsername()): Promise<string> {
    const auth = new AuthPage();
    const play = new PlayPage();

    await auth.loaded();
    await auth.register(name);
    await play.loaded();

    return name;
}
