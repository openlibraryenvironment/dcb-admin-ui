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
 * The minimum height of the row holding the sidebar and the page, so the footer never
 * paints inside the first viewport. On the row, not the shell: on the shell, flex gives
 * the row `viewport - footer` and the footer jumps when content arrives. `vh`, not `dvh`,
 * which changes as a mobile URL bar hides. docs/performance-budget.md, "Layout shift on
 * every route".
 */
export const PAGE_ROW_MIN_HEIGHT = "100vh";
