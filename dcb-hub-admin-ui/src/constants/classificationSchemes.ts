/**
 * dcb-service's `ClassificationScheme` enum: the schemes a shelf sort key can be computed
 * for. MARC 084 "other" is deliberately absent — its `$2` names an arbitrary scheme, so a
 * library could declare a browse that cannot be built.
 */
export const CLASSIFICATION_SCHEMES = ["DEWEY", "LCC"] as const;

export type ClassificationScheme = (typeof CLASSIFICATION_SCHEMES)[number];

const LABEL_KEYS: Record<string, string> = {
	DEWEY: "libraries.classification.dewey",
	LCC: "libraries.classification.lcc",
};

/**
 * The label key for a scheme, or null when there is none.
 *
 * Null rather than a key built by string manipulation: an unknown value means dcb-service has
 * gained a scheme this build has never heard of, and rendering `libraries.classification.udc`
 * as a missing translation is worse than rendering the value itself, which is at least what
 * an administrator can search the release notes for.
 */
export const classificationSchemeLabelKey = (scheme: string): string | null =>
	LABEL_KEYS[scheme] ?? null;
