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
	/**
	 * A chapter with nothing to finish. It never counts as outstanding, so it can neither
	 * hold setup open nor claim to be done.
	 */
	optional?: boolean;
}

/**
 * How far along, as numbers rather than as a feeling.
 *
 * The rail said which chapter was current and which were done, and never said how much was
 * left - the one thing somebody deciding whether to start now or after lunch actually wants
 * to know. The home-page banner counted it ("3 steps left"); the flow itself did not.
 *
 * `total` deliberately EXCLUDES the optional chapter. A denominator counting a chapter that
 * can never be outstanding could never reach 100%, so a fully configured consortium would
 * show a bar stuck at five sixths for the life of the deployment.
 */
export interface ConsortiumSetupProgress {
	/** Chapters that can hold setup open. The optional one is not among them. */
	total: number;
	/** Chapters whose work is actually done. */
	complete: number;
	/** Chapters settled by a decision not to do them. Never counted as complete. */
	skipped: number;
	/** Complete plus skipped: everything with nothing outstanding left in it. */
	settled: number;
	/** 0-100, for a determinate bar. Reaches 100 exactly when `isComplete` is true. */
	percent: number;
}

export interface ConsortiumSetupState {
	steps: ConsortiumSetupStep[];
	/** The first chapter with outstanding work. Undefined when nothing is outstanding. */
	firstIncompleteStep?: ConsortiumSetupStepId;
	/**
	 * Where to actually drop the user in, which is not always the same thing.
	 *
	 * A FRESH deployment starts at the beginning, even though the first chapter is
	 * optional and so never "outstanding". Appearance opens the flow on purpose: it
	 * writes nothing, it is instantly reversible, and it lets somebody who needs high
	 * contrast or a legible typeface set that BEFORE reading five screens of setup.
	 * Sending a brand new deployment straight to a form asking for a consortium name
	 * would be a different, worse opening move.
	 *
	 * A partly-done one resumes at the first outstanding chapter. A FINISHED one does not
	 * come through here at all - see `setupEntryPoint`, which sends it to the inventory.
	 * This still answers "appearance" for that case, because the value has to be some
	 * chapter, and the start of the flow is the least surprising one for a caller that
	 * ignores the distinction.
	 */
	resumeStep: ConsortiumSetupStepId;
	/** True when nothing is left outstanding - every chapter is done or settled. */
	isComplete: boolean;
	/** True when there is no consortium at all: a genuinely fresh instance. */
	isFresh: boolean;
	/** How much of the flow is behind the user. */
	progress: ConsortiumSetupProgress;
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
			// OPTIONAL, and neither complete nor skippable.
			//
			// It writes nothing to the server - the theme, mode and typeface are one
			// person's reading preferences, not a property of the consortium - so there is
			// nothing to read back and nothing to derive completeness from.
			//
			// It used to count "the user skipped past it" as done, which put the ONE piece
			// of browser state into a progress model whose whole point is being derived. The
			// consequences were all wrong in different directions: a brand new deployment
			// opened in an old browser claimed the chapter was done, the same consortium
			// opened on another machine claimed it was not, and two colleagues saw different
			// progress for the same system. "Complete" meant "this browser has been here",
			// which is not a fact about the consortium at all.
			//
			// So it is simply optional: always offered, never outstanding, never claimed as
			// done. When per-user preferences are stored server-side this could become a
			// real derived answer - "this user has chosen" - and until then saying nothing
			// is better than saying something untrue.
			complete: false,
			skipped: false,
			available: true,
			optional: true,
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
		(step) =>
			step.available && !step.optional && !step.complete && !step.skipped,
	);

	// Counted over every chapter that can hold setup open, whether or not it is reachable
	// yet: a fresh instance has five things to do, four of them behind the consortium
	// record. Shrinking the denominator to what is reachable TODAY would show a bar that
	// went backwards the moment creating the consortium unlocked the other four.
	const tracked = steps.filter((step) => !step.optional);
	const completeCount = tracked.filter((step) => step.complete).length;
	// A chapter that was skipped and later filled in is complete, not both.
	const skippedCount = tracked.filter(
		(step) => !step.complete && step.skipped,
	).length;
	const settledCount = completeCount + skippedCount;

	const firstIncompleteStep = outstanding[0]?.id;

	return {
		steps,
		firstIncompleteStep,
		resumeStep:
			!hasConsortium || !firstIncompleteStep
				? CONSORTIUM_SETUP_STEPS[0]
				: firstIncompleteStep,
		isComplete: outstanding.length === 0,
		isFresh: !hasConsortium,
		progress: {
			total: tracked.length,
			complete: completeCount,
			skipped: skippedCount,
			settled: settledCount,
			percent:
				tracked.length === 0
					? 0
					: Math.round((settledCount / tracked.length) * 100),
		},
	};
};

/**
 * Where `/setup` should actually send somebody.
 *
 * <h2>Why a finished setup no longer opens at chapter one</h2>
 *
 * It used to. The reasoning was that the flow is also how appearance, branding and
 * functional settings are changed afterwards - which is true - but it made the first screen
 * of a return visit the one thing the visitor is least likely to have come for. Somebody
 * opening setup from the Consortium tab to change a logo met a page about their own colour
 * scheme, and had to find the rail to get anywhere near branding.
 *
 * A finished setup opens at the inventory instead, which names every chapter, says what
 * happened to each and links all of them. That is the right shape for a return visit: an
 * index, not the start of a queue. An unfinished one still resumes where the work is.
 */
export type SetupEntryPoint =
	| { kind: "chapter"; step: ConsortiumSetupStepId }
	| { kind: "finish" };

export const setupEntryPoint = (
	state: Pick<ConsortiumSetupState, "isComplete" | "resumeStep">,
): SetupEntryPoint =>
	state.isComplete
		? { kind: "finish" }
		: { kind: "chapter", step: state.resumeStep };

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
