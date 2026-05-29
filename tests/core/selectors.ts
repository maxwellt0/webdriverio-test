/**
 * Single source of truth for the testid locator convention.
 * Used by `BasePage`, components, and any future helper — keeps the
 * `[data-testid="…"]` string in exactly one place.
 */
export const byTestId = (id: string) => $(`[data-testid="${id}"]`);
