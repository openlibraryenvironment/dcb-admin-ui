/**
 * How far down the page a focused element has to land to clear what is painted over it.
 *
 * Two things are fixed or sticky at the top: the AppBar always, and the Insights subject
 * bar on the pages that have one. `scroll-padding-top` is the only thing that keeps focus
 * out from under them, and it has to be ONE number that both the theme and the sticky bar
 * agree on - a bar positioned at one offset while the scroll padding assumes another is
 * WCAG 2.2 SC 2.4.11 failing silently, because nothing throws and the focus ring is simply
 * somewhere the reader cannot see.
 */

/** The AppBar, position: fixed. */
export const APP_BAR_HEIGHT = 70;

/** The Insights subject bar, sticky directly beneath it. */
export const SUBJECT_BAR_HEIGHT = 49;

/** Where a sticky bar under the AppBar has to sit. */
export const SUBJECT_BAR_TOP = APP_BAR_HEIGHT;

/**
 * What `scroll-padding-top` must be on a page carrying both. Set globally rather than per
 * page: a page without the subject bar simply scrolls 49px further than it needs to, which
 * nobody notices, and the alternative is a value that is right on some routes and wrong on
 * others.
 */
export const SCROLL_PADDING_TOP = APP_BAR_HEIGHT + SUBJECT_BAR_HEIGHT;
