import { z } from "@schemas/zod";

import { HOST_LMS_CLASSES } from "@constants/hostLmsClasses";
import type { LibrarySetupStepId } from "@helpers/librarySetup";

/**
 * Adding a library, as one conversation: which system, how DCB reaches it, then the
 * library itself. The first answers live in the URL until the library exists; after that
 * every answer is a server record, so anyone with the link sees the same progress.
 */
export type IlsKey = keyof typeof HOST_LMS_CLASSES;

const ILS_KEYS = Object.keys(HOST_LMS_CLASSES) as [IlsKey, ...IlsKey[]];

export const ilsKeyOf = (
	lmsClientClass: string | null | undefined,
): IlsKey | undefined =>
	ILS_KEYS.find((key) => HOST_LMS_CLASSES[key] === lmsClientClass);

export type LibraryFlowStepId = "system" | "connection" | LibrarySetupStepId;

/** Asked before the library exists, at /libraries/new/$step. */
export const NEW_LIBRARY_STEPS = ["system", "connection", "profile"] as const;
export type NewLibraryStepId = (typeof NEW_LIBRARY_STEPS)[number];

/** Asked once it does, at /libraries/$libraryId/setup/$step. */
export const LIBRARY_SETUP_STEPS = [
	"profile",
	"contacts",
	"group",
	"refMappings",
	"numMappings",
	"locations",
] as const satisfies readonly LibrarySetupStepId[];

export const isNewLibraryStepId = (step: string): step is NewLibraryStepId =>
	(NEW_LIBRARY_STEPS as readonly string[]).includes(step);

export const isLibrarySetupStepId = (
	step: string,
): step is (typeof LIBRARY_SETUP_STEPS)[number] =>
	(LIBRARY_SETUP_STEPS as readonly string[]).includes(step);

/**
 * The answers given before the library exists. Never a credential: those are typed again.
 * `agency` is the default agency code a new Host LMS was given, offered on the profile.
 */
export const newLibrarySearchSchema = z.object({
	ils: z.enum(ILS_KEYS).optional().catch(undefined),
	hostLms: z.string().trim().min(1).max(64).optional().catch(undefined),
	agency: z.string().trim().min(1).max(64).optional().catch(undefined),
	from: z.enum(["setup"]).optional().catch(undefined),
});

/**
 * "setup" when the library was added from consortium setup, so its Done page can offer the
 * way back. Every library setup route retains it (`retainSearchParams`), so it is set once.
 */
export const librarySetupSearchSchema = newLibrarySearchSchema.pick({
	from: true,
});
export type NewLibrarySearch = z.infer<typeof newLibrarySearchSchema>;

export interface LibraryFlowStep {
	id: LibraryFlowStepId;
	complete: boolean;
	available: boolean;
}

export interface LibraryFlowState {
	steps: LibraryFlowStep[];
	progress: { outstanding: number; skipped: number; percent: number };
	firstIncompleteStep?: LibraryFlowStepId;
}

const NUMERIC_RANGE_ILS: ReadonlySet<IlsKey> = new Set(["sierra", "polaris"]);

export const withProgress = (steps: LibraryFlowStep[]): LibraryFlowState => {
	const done = steps.filter((step) => step.complete).length;
	return {
		steps,
		progress: {
			outstanding: steps.length - done,
			skipped: 0,
			percent: steps.length === 0 ? 0 : Math.round((done / steps.length) * 100),
		},
		firstIncompleteStep: steps.find((step) => !step.complete)?.id,
	};
};

const LATER_STEPS = (numericRanges: boolean): LibraryFlowStepId[] =>
	LIBRARY_SETUP_STEPS.filter(
		(step) => step !== "profile" && (numericRanges || step !== "numMappings"),
	);

/** Before the library exists: what the URL has answered. */
export const newLibraryFlowState = ({
	ils,
	hostLms,
}: NewLibrarySearch): LibraryFlowState =>
	withProgress([
		{ id: "system", complete: !!ils, available: true },
		{ id: "connection", complete: !!hostLms, available: !!ils },
		{ id: "profile", complete: false, available: !!ils && !!hostLms },
		...LATER_STEPS(!!ils && NUMERIC_RANGE_ILS.has(ils)).map((id) => ({
			id,
			complete: false,
			available: false,
		})),
	]);
