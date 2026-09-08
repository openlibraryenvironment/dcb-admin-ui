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
 * Whether a library is even meant to borrow or supply.
 *
 * Only an explicit `false` counts as deliberately switched off. `null` means
 * nobody has said either way, which is not the same as "no" - a library nobody
 * has configured for borrowing that also has no borrowing traffic is still
 * worth asking about.
 */
export const isBorrowingDisabled = (library: any): boolean =>
	library?.agency?.isBorrowingAgency === false;

export const isSupplyingDisabled = (library: any): boolean =>
	library?.agency?.isSupplyingAgency === false;

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
	/** Most recent request in either direction, ISO string or null. */
	lastBorrowingRequestAt?: string | null;
	lastSupplyingRequestAt?: string | null;
}

export interface LibraryTrafficState {
	/** The library has placed at least one request as the borrower. */
	hasBorrowed: boolean;
	/** The library has supplied at least one request. */
	hasSupplied: boolean;
	hasAnyTraffic: boolean;
	borrowingDisabled: boolean;
	supplyingDisabled: boolean;
	/** Switched off in both directions - silence is the intended outcome. */
	isFullyDisabled: boolean;
	/**
	 * Configured, enabled in at least one direction, and still nothing has
	 * flowed through it.
	 */
	isDormant: boolean;
	/** Most recent request in either direction. */
	lastRequestAt: string | null;
}

const latestOf = (...dates: (string | null | undefined)[]): string | null => {
	const usable = dates.filter((date): date is string => !!date);
	if (usable.length === 0) return null;
	return usable.reduce((latest, date) =>
		new Date(date) > new Date(latest) ? date : latest,
	);
};

export const evaluateLibraryTraffic = (
	counts: LibraryTrafficCounts = {},
	setup?: LibrarySetupState,
	library?: any,
): LibraryTrafficState => {
	const hasBorrowed = (counts.patronRequestCount ?? 0) > 0;
	const hasSupplied = (counts.supplierRequestCount ?? 0) > 0;
	const hasAnyTraffic = hasBorrowed || hasSupplied;

	const borrowingDisabled = isBorrowingDisabled(library);
	const supplyingDisabled = isSupplyingDisabled(library);
	const isFullyDisabled = borrowingDisabled && supplyingDisabled;

	// Silence only counts as dormancy in a direction the library is actually
	// meant to operate in. A borrowing-disabled library with no borrowing
	// requests is working exactly as configured, and flagging it trains people
	// to ignore the indicator.
	const hasTrafficWhereEnabled =
		(!borrowingDisabled && hasBorrowed) || (!supplyingDisabled && hasSupplied);

	return {
		hasBorrowed,
		hasSupplied,
		hasAnyTraffic,
		borrowingDisabled,
		supplyingDisabled,
		isFullyDisabled,
		// Only meaningful once setup is done - a half-configured library having no
		// traffic is not news, it is the expected consequence.
		isDormant:
			(setup?.isComplete ?? false) &&
			!isFullyDisabled &&
			!hasTrafficWhereEnabled,
		lastRequestAt: latestOf(
			counts.lastBorrowingRequestAt,
			counts.lastSupplyingRequestAt,
		),
	};
};

/**
 * Has the library's catalogue actually been ingested?
 *
 * Ingest is configured on the Host LMS rather than in the library wizard, so
 * it is not a setup step - but zero bib records means the library cannot supply
 * anything at all, whatever else is configured. That is a distinct failure from
 * "the wizard was not finished" and from "nobody has requested anything".
 */
export interface LibraryIngestCounts {
	bibCount?: number;
}

export interface LibraryIngestState {
	bibCount: number;
	hasBibs: boolean;
	/**
	 * Nothing ingested, and the library is expected to supply - so this is a
	 * problem rather than a setting.
	 */
	isIngestOutstanding: boolean;
}

export const evaluateLibraryIngest = (
	counts: LibraryIngestCounts = {},
	library?: any,
): LibraryIngestState => {
	const bibCount = counts.bibCount ?? 0;
	const hasBibs = bibCount > 0;

	return {
		bibCount,
		hasBibs,
		isIngestOutstanding: !hasBibs && !isSupplyingDisabled(library),
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
	/** Per-category mapping detail, for the one "mappings" indicator. */
	mappings: LibraryMappingsState;
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
 * The four mapping categories, evaluated together.
 *
 * The grid shows one "mappings" indicator, but the answer staff need is which
 * category is missing - "item types are mapped, locations are not" is a
 * different job from "nothing is mapped at all". Deciding it here means the
 * indicator, its tooltip, and the two wizard steps cannot disagree.
 */
export type MappingCategoryId =
	"itemType" | "patronType" | "locationType" | "numericRange";

export interface MappingCategoryState {
	id: MappingCategoryId;
	count: number;
	/** False for categories this library's ILS does not use. */
	applicable: boolean;
	complete: boolean;
}

export interface LibraryMappingsState {
	categories: MappingCategoryState[];
	/** Applicable categories with no mappings at all. */
	missing: MappingCategoryId[];
	isComplete: boolean;
	/**
	 * Some categories mapped, some not. Worth distinguishing: a library nobody
	 * has started on and a library somebody stopped halfway through call for
	 * different conversations.
	 */
	isPartial: boolean;
}

export const evaluateLibraryMappings = (
	counts: LibrarySetupCounts = {},
	library?: any,
): LibraryMappingsState => {
	const needsNumeric = requiresNumericRangeMappings(library);

	const categories: MappingCategoryState[] = (
		[
			{
				id: "itemType",
				count: counts.itemTypeMappingCount ?? 0,
				applicable: true,
			},
			{
				id: "patronType",
				count: counts.patronTypeMappingCount ?? 0,
				applicable: true,
			},
			{
				id: "locationType",
				count: counts.locationMappingCount ?? 0,
				applicable: true,
			},
			{
				id: "numericRange",
				count: counts.numericRangeMappingCount ?? 0,
				applicable: needsNumeric,
			},
		] as const
	).map((category) => ({ ...category, complete: category.count > 0 }));

	const applicable = categories.filter((category) => category.applicable);
	const missing = applicable
		.filter((category) => !category.complete)
		.map((category) => category.id);

	return {
		categories,
		missing,
		isComplete: missing.length === 0,
		isPartial: missing.length > 0 && missing.length < applicable.length,
	};
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
	// The wizard has two mapping screens, so setup keeps two steps - but both
	// read the same evaluation, so the banner and the grid cannot disagree about
	// what "mapped" means.
	const mappings = evaluateLibraryMappings(counts, library);
	const isMapped = (id: MappingCategoryId) =>
		mappings.categories.find((category) => category.id === id)?.complete ??
		false;

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
				isMapped("itemType") &&
				isMapped("patronType") &&
				isMapped("locationType"),
		},
		{
			id: "numMappings",
			applicable: needsNumeric,
			complete: !needsNumeric || isMapped("numericRange"),
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
		mappings,
	};
};
