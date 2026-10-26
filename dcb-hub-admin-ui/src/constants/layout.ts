/**
 * The fixed Header's height, in CSS pixels.
 *
 * Four files need this number and all four hardcoded it: the AppBar caps itself at it,
 * the Sidebar and the login shell clear it, and StructuralLayout pads the page by it.
 * They cannot be allowed to disagree - the Sidebar clearing less than the AppBar's
 * height puts the first nav item under it.
 */
export const HEADER_HEIGHT_PX = 70;

export const HEADER_HEIGHT = `${HEADER_HEIGHT_PX}px`;

/**
 * The viewport below the fixed Header. A route reserves it only where its loaded page is
 * taller than the viewport, or can land either side of it, so the footer starts below the
 * fold and does not move when the data lands. docs/performance-budget.md, "Layout shift
 * on every route".
 */
export const VIEWPORT_BELOW_HEADER = `calc(100vh - ${HEADER_HEIGHT})`;
