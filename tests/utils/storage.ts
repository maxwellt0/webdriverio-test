/**
 * Thin wrappers around `localStorage` for the SUT's four keys: `theme`, `lang`, `session`, `users`.
 *
 * Specs should rarely need to read storage directly — assertions belong on the rendered UI.
 * Storage helpers are mainly for **seeding** state (e.g. starting with N pre-existing users)
 * and for verifying side effects that the UI does not surface (e.g. that `session` is cleared
 * after logout).
 */

export type StorageKey = 'theme' | 'lang' | 'session' | 'users';

/** The SUT prefixes every key in localStorage with `ttt:`. Specs pass the unprefixed name. */
const PREFIX = 'ttt:';
const prefixed = (k: StorageKey) => `${PREFIX}${k}`;

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
    }, prefixed(key)) as Promise<T | null>;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameResult = 'win' | 'loss' | 'draw';

export interface HistoryEntry {
    finishedAt: number;
    difficulty: Difficulty;
    result: GameResult;
}

/** Shape of one entry under the `users` map in localStorage. */
export interface StoredUser {
    name: string;
    createdAt: number;
    difficulty: Difficulty;
    history: HistoryEntry[];
}

export interface SeedUserOptions {
    name: string;
    difficulty?: Difficulty;
    history?: HistoryEntry[];
    createdAt?: number;
}

/**
 * Seed a user record into `users`. Useful for tests that need an existing account
 * without going through the register flow (TC-REG-05 duplicate-name, TC-DIF-01 difficulty
 * persistence, TC-HIS-09 100-row cap, etc.).
 *
 * Does not set the session — the user is not signed in. Combine with the auth flow if needed.
 */
export async function seedUser(opts: SeedUserOptions): Promise<void> {
    await browser.execute(
        (u: SeedUserOptions, key: string) => {
            let users: Record<string, StoredUser> = {};
            try {
                users = JSON.parse(window.localStorage.getItem(key) ?? '{}') as Record<
                    string,
                    StoredUser
                >;
            } catch {
                users = {};
            }
            // The SUT keys users by their lowercased display name.
            users[u.name.toLowerCase()] = {
                name: u.name,
                createdAt: u.createdAt ?? Date.now(),
                difficulty: u.difficulty ?? 'easy',
                history: u.history ?? [],
            };
            window.localStorage.setItem(key, JSON.stringify(users));
        },
        opts,
        prefixed('users'),
    );
}
