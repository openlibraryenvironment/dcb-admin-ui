import { useEffect } from "react";

import { useThemeStore } from "@hooks/useThemeStore";
import { motionAttribute } from "@themes/display";

/**
 * Publishes the motion preference to the document, where the CSS can see it.
 *
 * Motion is the one display preference that is not a theme property, and deliberately.
 * Expressing it as `data-motion` on `<html>` plus two rules in the theme's CssBaseline
 * override (see `motionStyles` in themes/openRS.ts) buys three things a theme value would
 * not:
 *
 *   - the common case needs no JavaScript at all. `system` writes no attribute, so
 *     `@media (prefers-reduced-motion: reduce)` answers it on the first paint, before this
 *     hook has run;
 *   - it reaches animations MUI knows nothing about - the data grid's, the charts', and
 *     anything a dependency ships;
 *   - it stays out of the theme cache key, which would otherwise triple.
 *
 * Applied to the document element rather than to a wrapper, because `<html>` is the only
 * element that is an ancestor of everything - portals, dialogs, tooltips and the grid's
 * own overlays all render outside the React tree's DOM position.
 */
export function useMotionPreference(): void {
	const motion = useThemeStore((s) => s.motion);

	useEffect(() => {
		const attribute = motionAttribute(motion);
		const root = document.documentElement;

		if (attribute) {
			root.setAttribute("data-motion", attribute);
		} else {
			// Removed rather than set to "system": the CSS selects on the attribute's
			// ABSENCE, so leaving a value behind would defeat the media query.
			root.removeAttribute("data-motion");
		}
	}, [motion]);
}
