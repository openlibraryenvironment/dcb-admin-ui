import { LOCAL_HOLDS_FIELDS } from "@constants/serviceCapabilities";
import { isLocalHoldsEnabled } from "@helpers/featureFlags";

/**
 * `maxLocalHolds`, or nothing.
 *
 * A FUNCTION, and the documents that use it are functions too. window.__APP_ENV__ is
 * assigned after an await in main.tsx, so anything evaluated at module scope reads the
 * flag before it exists and bakes in "off" for the session.
 */
export const localHoldsSelection = (): string =>
	isLocalHoldsEnabled() ? LOCAL_HOLDS_FIELDS.join("\n\t\t\t\t\t") : "";

/**
 * The same field removed from mutation variables when the deployment cannot store it.
 *
 * REMOVED, not blanked: `maxLocalHolds: null` is still an unknown field to 8.71.0 and
 * fails validation exactly as selecting it does.
 */
export const stripUnsupportedAgencyInput = <T extends Record<string, any>>(
	input: T,
): Partial<T> => {
	if (isLocalHoldsEnabled()) {
		return { ...input };
	}

	const supported = { ...input };

	for (const field of LOCAL_HOLDS_FIELDS) {
		delete supported[field];
	}

	return supported;
};
