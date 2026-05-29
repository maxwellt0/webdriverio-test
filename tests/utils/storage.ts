/**
 * Thin wrappers around `localStorage` for the SUT's four keys: `theme`, `lang`, `session`, `users`.
 *
 * Specs should rarely need to read storage directly — assertions belong on the rendered UI.
 * Storage helpers are mainly for **seeding** state (e.g. starting with N pre-existing users)
 * and for verifying side effects that the UI does not surface (e.g. that `session` is cleared
 * after logout).
 */

export type StorageKey = 'theme' | 'lang' | 'session' | 'users';

/** Clear all storage on the current origin. */
export async function clearStorage(): Promise<void> {
    await browser.execute(() => window.localStorage.clear());
}

/** Read a key. If the stored value is JSON, returns the parsed object; otherwise the raw string. */
export async function readStorage<T = unknown>(key: StorageKey): Promise<T | null> {
    return browser.execute((k: string) => {
        const v = window.localStorage.getItem(k);
        if (v === null) return null;
        try {
            return JSON.parse(v) as unknown;
        } catch {
            return v;
        }
    }, key) as Promise<T | null>;
}

/** Write a raw string or JSON-serialize an object. */
export async function writeStorage(key: StorageKey, value: unknown): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await browser.execute(
        (k: string, v: string) => {
            window.localStorage.setItem(k, v);
        },
        key,
        serialized,
    );
}

export interface SeedUserOptions {
    name: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    history?: Array<{ finishedAt: number; difficulty: string; result: 'win' | 'loss' | 'draw' }>;
    createdAt?: number;
}

/**
 * Seed a user record into `users`. Useful for tests that need an existing account
 * without going through the register flow (TC-REG-05 duplicate-name, TC-DIF-01 difficulty
 * persistence, TC-HIS-09 100-row cap, etc.).
 *
 * Does not set the session — the user is not signed in. Combine with the auth flow
 * or `writeStorage('session', ...)` if needed.
 */
export async function seedUser(opts: SeedUserOptions): Promise<void> {
    await browser.execute((u: SeedUserOptions) => {
        let users: Record<string, unknown> = {};
        try {
            users = JSON.parse(window.localStorage.getItem('users') ?? '{}') as Record<
                string,
                unknown
            >;
        } catch {
            users = {};
        }
        users[u.name.toLowerCase()] = {
            name: u.name,
            createdAt: u.createdAt ?? Date.now(),
            difficulty: u.difficulty ?? 'easy',
            history: u.history ?? [],
        };
        window.localStorage.setItem('users', JSON.stringify(users));
    }, opts);
}
