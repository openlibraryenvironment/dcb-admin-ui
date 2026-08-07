import { getILS } from "@helpers/getILS";

/**
 * Which parts of a library's setup are done, and which are not.
 *
 * The onboarding grid worked this out inline and then repeated the same
 * "is anything missing" expression three times in one file (to sort, to pick an
 * icon, and to build a tooltip). One of those copies read a field name the
 * query never returned, so a column was permanently red. Deciding it once, here,
 * is what lets the library page offer "finish setup" and mean the same thing.
 */

export type LibrarySetupStepId =
	| "profile"
	| "contacts"
	| "group"
	| "refMappings"
	| "numMappings"
	| "locations";

/** Counts of the records each step is considered done by having. */
export interface LibrarySetupCounts {
	itemTypeMappingCount?: number;
	patronTypeMappingCount?: number;
	locationMappingCount?: number;
	pickupLocationCount?: number;
	/** null when the library's ILS does not use numeric range mappings. */
	numericRangeMappingCount?: number | null;
}

/**
 * Requests a library has actually taken part in. Deliberately NOT part of
 * setup completeness: a library can be configured perfectly and still never
 * have borrowed or supplied anything, and staff need to see that separately.
 * Folding it into "is anything missing" (as the onboarding grid used to) says
 * the configuration is wrong when it is fine and simply unused.
 */
export interface LibraryTrafficCounts {
	patronRequestCount?: number;
	supplierRequestCount?: number;
}

export interface LibraryTrafficState {
	/** The library has placed at least one request as the borrower. */
	hasBorrowed: boolean;
	/** The library has supplied at least one request. */
	hasSupplied: boolean;
	hasAnyTraffic: boolean;
	/** Configured and ready, but nothing has ever flowed through it. */
	isDormant: boolean;
}

export const evaluateLibraryTraffic = (
	counts: LibraryTrafficCounts = {},
	setup?: LibrarySetupState,
): LibraryTrafficState => {
	const hasBorrowed = (counts.patronRequestCount ?? 0) > 0;
	const hasSupplied = (counts.supplierRequestCount ?? 0) > 0;
	const hasAnyTraffic = hasBorrowed || hasSupplied;

	return {
		hasBorrowed,
		hasSupplied,
		hasAnyTraffic,
		// Only meaningful once setup is done - a half-configured library having no
		// traffic is not news, it is the expected consequence.
		isDormant: (setup?.isComplete ?? false) && !hasAnyTraffic,
	};
};

export interface LibrarySetupStep {
	id: LibrarySetupStepId;
	complete: boolean;
	/** False for steps this library's ILS does not need (numeric ranges). */
	applicable: boolean;
}

export interface LibrarySetupState {
	steps: LibrarySetupStep[];
	/** Where "finish setup" should drop the user in. */
	firstIncompleteStep?: LibrarySetupStepId;
	isComplete: boolean;
	/** Profile fields the library is missing, for messaging. */
	missingProfileFields: string[];
}

/**
 * Only Sierra and Polaris map patron and item types by numeric range; for
 * everything else the step is not shown and must not count against the library.
 */
export const requiresNumericRangeMappings = (library: any): boolean => {
	const ils = getILS(library?.agency?.hostLms?.lmsClientClass ?? "");
	return ils === "Sierra" || ils === "Polaris";
};

/**
 * Every field LibraryInput declares non-null, plus the coordinates. Libraries
 * created before the wizard enforced these will be missing them, which is
 * exactly the case "finish setup" exists to catch.
 */
export const REQUIRED_PROFILE_FIELDS = [
	"fullName",
	"shortName",
	"abbreviatedName",
	"address",
	"type",
	"agencyCode",
	"latitude",
	"longitude",
] as const;

const isPresent = (value: unknown): boolean => {
	if (value === null || value === undefined) return false;
	// An empty string satisfies GraphQL's non-null check but is not an answer.
	if (typeof value === "string") return value.trim().length > 0;
	return true;
};

export const missingProfileFields = (library: any): string[] =>
	REQUIRED_PROFILE_FIELDS.filter((field) => !isPresent(library?.[field]));

export const evaluateLibrarySetup = (
	library: any,
	counts: LibrarySetupCounts = {},
): LibrarySetupState => {
	const missing = missingProfileFields(library);
	const needsNumeric = requiresNumericRangeMappings(library);

	const steps: LibrarySetupStep[] = [
		{
			id: "profile",
			applicable: true,
			complete: missing.length === 0,
		},
		{
			id: "contacts",
			applicable: true,
			complete: (library?.contacts?.length ?? 0) > 0,
		},
		{
			id: "group",
			applicable: true,
			complete: (library?.membership?.length ?? 0) > 0,
		},
		{
			id: "refMappings",
			applicable: true,
			// All three categories are needed to route a request end to end, so
			// having only one of them is not "done".
			complete:
				(counts.itemTypeMappingCount ?? 0) > 0 &&
				(counts.patronTypeMappingCount ?? 0) > 0 &&
				(counts.locationMappingCount ?? 0) > 0,
		},
		{
			id: "numMappings",
			applicable: needsNumeric,
			complete: !needsNumeric || (counts.numericRangeMappingCount ?? 0) > 0,
		},
		{
			id: "locations",
			applicable: true,
			// Specifically a PICKUP location: a library with locations but none
			// enabled for pickup cannot receive a request.
			complete: (counts.pickupLocationCount ?? 0) > 0,
		},
	];

	const outstanding = steps.filter((step) => step.applicable && !step.complete);

	return {
		steps,
		firstIncompleteStep: outstanding[0]?.id,
		isComplete: outstanding.length === 0,
		missingProfileFields: missing,
	};
};
