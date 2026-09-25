import { CLASSIFICATION_SCHEME_FIELDS } from "@constants/serviceCapabilities";
import { isShelfBrowseEnabled } from "@helpers/featureFlags";

/**
 * `classificationScheme`, or nothing — §V-22.2.
 *
 * A FUNCTION, and the documents that use it are functions too. `window.__APP_ENV__` is
 * assigned after an await in main.tsx, so anything evaluated at module scope reads the flag
 * before it exists and bakes in "off" for the session.
 */
export const classificationSchemeSelection = (): string =>
	isShelfBrowseEnabled() ? CLASSIFICATION_SCHEME_FIELDS.join("\n\t\t\t\t\t") : "";

/**
 * The same field removed from mutation variables when the deployment cannot store it.
 *
 * REMOVED, not blanked. `classificationScheme: null` is still an unknown field to a
 * dcb-service that does not declare it, and fails validation exactly as selecting it does —
 * which takes down the whole library update, not just this one value.
 */
export const stripUnsupportedLibraryInput = <T extends Record<string, any>>(
	input: T,
): Partial<T> => {
	if (isShelfBrowseEnabled()) {
		return { ...input };
	}

	const supported = { ...input };

	for (const field of CLASSIFICATION_SCHEME_FIELDS) {
		delete supported[field];
	}

	return supported;
};
