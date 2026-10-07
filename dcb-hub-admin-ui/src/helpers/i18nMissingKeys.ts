/**
 * Records translation keys i18next could not resolve, for the CI gate to read.
 *
 * Why a runtime collector and not a static scan: docs/i18n.md.
 */

/** The shape e2e/i18n-missing.spec.ts reads off the page. */
export interface MissingKeyReport {
	language: string;
	namespace: string;
	key: string;
}

declare global {
	interface Window {
		__I18N_MISSING__?: MissingKeyReport[];
	}
}

/**
 * On only where something is watching. `saveMissing` costs a handler call per
 * unresolved key, and a production build has nothing to do with the answer.
 */
/**
 * On only where something is watching, and only from `import.meta.env` - NOT from the
 * injected runtime config. A build-time switch cannot be turned on against a deployed
 * artefact, which is the point: a production bundle has nothing to do with the answer.
 */
export const isMissingKeyReportingEnabled = (): boolean =>
	String(import.meta.env.VITE_I18N_REPORT_MISSING).toLowerCase() === "true";

/**
 * i18next calls this INSTEAD of the backend's own saveMissing when it is set
 * (Translator.translate, i18next 23.11.5), so nothing is posted anywhere.
 */
/**
 * Arms the collector: the array exists from boot, so its PRESENCE proves the switch
 * is on. Without that, a gate asserting "no missing keys" passes identically on a
 * build where nothing was ever recording - which is the one failure a gate must not
 * have. e2e/i18n-missing.spec.ts checks for it first.
 */
export const armMissingKeyReporting = (): void => {
	if (typeof window === "undefined") return;
	window.__I18N_MISSING__ ??= [];
};

export const recordMissingKey = (
	language: string,
	namespace: string,
	key: string,
): void => {
	if (typeof window === "undefined") return;
	window.__I18N_MISSING__ ??= [];
	// Deduplicated: a key missing in a grid renders once per row, and a list of
	// four hundred identical entries tells a reader nothing the first one did not.
	const alreadySeen = window.__I18N_MISSING__.some(
		(entry) =>
			entry.key === key &&
			entry.namespace === namespace &&
			entry.language === language,
	);
	if (alreadySeen) return;
	window.__I18N_MISSING__.push({ language, namespace, key });
};
