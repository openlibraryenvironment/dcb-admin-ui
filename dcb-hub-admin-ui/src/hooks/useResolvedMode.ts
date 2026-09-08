import { useEffect, useState } from "react";

import { useThemeStore } from "@hooks/useThemeStore";
import type { ThemeMode } from "@themes/openRS";

const DARK_QUERY = "(prefers-color-scheme: dark)";
const CONTRAST_QUERY = "(prefers-contrast: more)";

/**
 * What the operating system is asking for. Contrast outranks the colour scheme, and both
 * are SUBSCRIBED rather than sampled - they change while the app is open. Reasoning in
 * docs/theming.md section 5.
 */
function useSystemMode(): ThemeMode {
	const [systemMode, setSystemMode] = useState<ThemeMode>(readSystemMode);

	useEffect(() => {
		const queries = [
			window.matchMedia?.(CONTRAST_QUERY),
			window.matchMedia?.(DARK_QUERY),
		].filter((query): query is MediaQueryList => query != null);

		if (queries.length === 0) {
			return;
		}

		const onChange = () => setSystemMode(readSystemMode());
		queries.forEach((query) => query.addEventListener("change", onChange));
		return () =>
			queries.forEach((query) => query.removeEventListener("change", onChange));
	}, []);

	return systemMode;
}

export function readSystemMode(): ThemeMode {
	if (
		typeof window === "undefined" ||
		typeof window.matchMedia !== "function"
	) {
		return "light";
	}
	if (window.matchMedia(CONTRAST_QUERY).matches) {
		return "highContrast";
	}
	return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/**
 * The mode to render in: the user's choice, or the operating system's when they have made
 * none.
 *
 * The store holds null for "never chosen" and this is the only place that resolves it. A
 * user who HAS chosen keeps their choice on a device whose OS says otherwise, which is the
 * direction that matters: the setting on a shared or borrowed workstation is somebody
 * else's, and this application runs on shared workstations.
 */
export function useResolvedMode(): ThemeMode {
	const chosen = useThemeStore((s) => s.mode);
	const systemMode = useSystemMode();

	return chosen ?? systemMode;
}
