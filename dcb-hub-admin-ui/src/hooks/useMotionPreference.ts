import { useEffect } from "react";

import { useThemeStore } from "@hooks/useThemeStore";
import { motionAttribute } from "@themes/display";

/**
 * Publishes the motion preference to `<html>`, where the CssBaseline rules can see it.
 * See docs/theming.md section 5.
 *
 * The document element, not a wrapper: portals, dialogs, tooltips and the grid's overlays
 * all render outside the React tree's DOM position.
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
