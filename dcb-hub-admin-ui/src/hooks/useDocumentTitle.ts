import { useEffect } from "react";

/**
 * The browser tab's title for a route. Page name first, then the app.
 *
 * Why that order, and the four routes that had no title at all:
 * docs/accessibility.md, "Every route is titled".
 */
export const APP_TITLE = "DCB Admin";

export const documentTitleFor = (title?: string): string =>
	title?.trim() ? `${title.trim()} · ${APP_TITLE}` : APP_TITLE;

export function useDocumentTitle(title?: string): void {
	useEffect(() => {
		document.title = documentTitleFor(title);
		// Restored on unmount so a route that sets no title of its own does not
		// inherit the last one.
		return () => {
			document.title = APP_TITLE;
		};
	}, [title]);
}
