/**
 * Which chapters of first-run setup are done, and which are not — W-5.
 *
 * The same idea as `librarySetup.ts`, one level up. That helper exists because the
 * onboarding grid worked "is anything missing" out inline three times and one copy read a
 * field the query never returned; this one exists so that the setup flow, the progress
 * rail, the home-page banner and the Consortium tab cannot disagree about how far along a
 * deployment is.
 *
 * <h2>Derived, never stored</h2>
 *
 * There is no onboarding-state table and no server-side "wizard progress" record. Progress
 * is read back out of the data the chapters write. That is not a shortcut - it is what
 * makes setup resumable across sessions, across users, and across a consortium that was
 * half-built by `dcb-service/scripts/libraries_setup.sh` before anybody opened DCB Admin.
 * A stored flag would have to be kept in step with the data by hand, and the first thing
 * to fall out of step would be the flag.
 *
 * The one thing that IS stored is a SKIP, in `useSetupStore` - because "I looked at
 * discovery branding and decided we do not want any" is a decision that leaves no trace in
 * the data, and re-asking forever is how a setup flow becomes something people click past.
 */

export type ConsortiumSetupStepId =
	| "appearance"
	| "consortium"
	| "howItWorks"
	| "contacts"
	| "discovery"
	| "libraries";

/** The chapters, in the order they are asked. */
export const CONSORTIUM_SETUP_STEPS: ConsortiumSetupStepId[] = [
	"appearance",
	"consortium",
	"howItWorks",
	"contacts",
	"discovery",
	"libraries",
];

/** Every field of a brand level a consortium could have set. Any one of them counts. */
const BRAND_FIELDS = [
	"brandLogoUrl",
	"brandHeaderIconUrl",
	"brandBackgroundImageUrl",
	"patronWelcome",
	"defaultThemeName",
] as const;

export interface ConsortiumSetupInputs {
	/**
	 * The consortium record, or null when there is none.
	 *
	 * Deliberately NOT `undefined`-tolerant: the caller resolves "we have not asked yet"
	 * and "the request failed" through `readConsortiumPresence` before it gets here, so
	 * a null reaching this function means the service answered and said there is none.
	 */
	consortium: any | null;
	/** How many libraries exist. One is enough for the chapter to be done. */
	libraryCount?: number;
	/** Chapters the user has explicitly chosen to skip. */
	skipped?: readonly ConsortiumSetupStepId[];
}

export interface ConsortiumSetupStep {
	id: ConsortiumSetupStepId;
	/**
	 * Whether the chapter's own work is done. A skipped chapter is NOT complete - it is
	 * settled, which is a different thing, and the finish screen says so.
	 */
	complete: boolean;
	skipped: boolean;
	/**
	 * False while the chapter cannot be attempted at all. Everything after the
	 * consortium record needs one to exist: `createLibrary` requires the consortium's
	 * group, and every other chapter is an update to a row that is not there yet.
	 */
	available: boolean;
}

export interface ConsortiumSetupState {
	steps: ConsortiumSetupStep[];
	/** Where "continue setting up" should drop the user in. */
	firstIncompleteStep?: ConsortiumSetupStepId;
	/** True when nothing is left outstanding - every chapter is done or settled. */
	isComplete: boolean;
	/** True when there is no consortium at all: a genuinely fresh instance. */
	isFresh: boolean;
}

const isPresent = (value: unknown): boolean => {
	if (value === null || value === undefined) return false;
	// An empty string satisfies a non-null column but is not an answer.
	if (typeof value === "string") return value.trim().length > 0;
	return true;
};

/** Whether the consortium carries any patron-facing brand at all. */
export const hasDiscoveryBrand = (consortium: any): boolean =>
	BRAND_FIELDS.some((field) => isPresent(consortium?.[field]));

export const evaluateConsortiumSetup = ({
	consortium,
	libraryCount = 0,
	skipped = [],
}: ConsortiumSetupInputs): ConsortiumSetupState => {
	const hasConsortium = !!consortium;
	const wasSkipped = (id: ConsortiumSetupStepId) => skipped.includes(id);

	const steps: ConsortiumSetupStep[] = [
		{
			id: "appearance",
			// Nothing is written, so there is nothing to check. The chapter is complete
			// the moment it has been seen, and being seen is recorded as a skip -
			// which is honest: the default IS a valid answer, and treating "I kept
			// Roboto" as unfinished business would leave the banner up forever.
			complete: wasSkipped("appearance"),
			skipped: wasSkipped("appearance"),
			available: true,
		},
		{
			id: "consortium",
			complete: hasConsortium,
			// Not skippable. Every other chapter and the whole libraries flow depend
			// on the record and its group existing.
			skipped: false,
			available: true,
		},
		{
			id: "howItWorks",
			complete: (consortium?.functionalSettings?.length ?? 0) > 0,
			skipped: wasSkipped("howItWorks"),
			available: hasConsortium,
		},
		{
			id: "contacts",
			complete: (consortium?.contacts?.length ?? 0) > 0,
			skipped: wasSkipped("contacts"),
			available: hasConsortium,
		},
		{
			id: "discovery",
			// An unbranded discovery service is a legitimate answer, so a skip settles
			// this one outright.
			complete: hasDiscoveryBrand(consortium),
			skipped: wasSkipped("discovery"),
			available: hasConsortium,
		},
		{
			id: "libraries",
			complete: libraryCount > 0,
			skipped: wasSkipped("libraries"),
			available: hasConsortium,
		},
	];

	const outstanding = steps.filter(
		(step) => step.available && !step.complete && !step.skipped,
	);

	return {
		steps,
		firstIncompleteStep: outstanding[0]?.id,
		isComplete: outstanding.length === 0,
		isFresh: !hasConsortium,
	};
};

/** A chapter's step number, for "Step 3 of 6" and for the rail. */
export const stepNumber = (id: ConsortiumSetupStepId): number =>
	CONSORTIUM_SETUP_STEPS.indexOf(id) + 1;

export const isConsortiumSetupStepId = (
	value: unknown,
): value is ConsortiumSetupStepId =>
	typeof value === "string" &&
	(CONSORTIUM_SETUP_STEPS as string[]).includes(value);

/** The chapter after this one, or undefined at the end of the flow. */
export const nextStep = (
	id: ConsortiumSetupStepId,
): ConsortiumSetupStepId | undefined =>
	CONSORTIUM_SETUP_STEPS[CONSORTIUM_SETUP_STEPS.indexOf(id) + 1];

/** The chapter before this one, or undefined at the start. */
export const previousStep = (
	id: ConsortiumSetupStepId,
): ConsortiumSetupStepId | undefined => {
	const index = CONSORTIUM_SETUP_STEPS.indexOf(id);
	return index > 0 ? CONSORTIUM_SETUP_STEPS[index - 1] : undefined;
};
