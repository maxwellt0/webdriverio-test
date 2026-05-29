/** Escape a string for safe literal use inside a `RegExp`. */
export function escapeRegex(s: string): string {
    return s.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}