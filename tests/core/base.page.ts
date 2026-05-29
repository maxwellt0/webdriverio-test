/**
 * Abstract base for every page object in the suite.
 *
 * Conventions:
 * - Locators are `data-testid` only. The SUT exposes one on every interactive
 *   surface (see EXPLORATION §13), so CSS / XPath are off-limits in subclasses.
 * - `open()` navigates and then waits for the page-specific ready signal.
 * - `loaded()` is the single readiness primitive: subclasses either rely on
 *   the default (wait for `readyTestId` to be displayed) or override for
 *   compound conditions.
 */
export abstract class BasePage {
    /** Path appended to `baseUrl`. The SUT is a single page, so concrete pages use `/`. */
    abstract readonly path: string;

    /**
     * `data-testid` of an element that exists only when this page / view has rendered.
     * Used by the default `loaded()` implementation.
     */
    abstract readonly readyTestId: string;

    /** Navigate to this page and wait until it is ready. */
    async open(): Promise<void> {
        await browser.url(this.path);
        await this.loaded();
    }

    /** Resolves once the page is rendered and ready to interact with. */
    async loaded(): Promise<void> {
        await this.byTestId(this.readyTestId).waitForDisplayed();
    }

    /** True if the page-ready element is currently displayed (no waiting). */
    async isOpen(): Promise<boolean> {
        return this.byTestId(this.readyTestId).isDisplayed();
    }

    /** Convenience locator: `[data-testid="<id>"]`. */
    protected byTestId(id: string) {
        return $(`[data-testid="${id}"]`);
    }
}
