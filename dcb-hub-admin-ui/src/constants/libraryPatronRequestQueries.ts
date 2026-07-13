import { queries } from "./patronRequestGridQueries";

// Per-bucket Lucene queries for a single library's patron requests, scoped by
// its patron-facing Host LMS code. These mirror the bespoke baseQuery each
// library patronRequests page already sends to its grid, centralised here so
// the sub-tab counts and the grids cannot drift apart. `active` keeps its
// existing (slightly narrower) definition rather than reusing queries.inProgress
// so the tab count matches what the Active grid actually returns.
export const getLibraryPatronRequestQueries = (code: string) => ({
	all: `patronHostlmsCode: "${code}"`,
	outOfSequence: `patronHostlmsCode: "${code}" AND ${queries.outOfSequence}`,
	active: `patronHostlmsCode: "${code}" AND NOT status:"ERROR" AND NOT status: "NO_ITEMS_SELECTABLE_AT_ANY_AGENCY" AND NOT status: "CANCELLED" AND NOT status: "FINALISED" AND NOT status:"COMPLETED" AND outOfSequenceFlag:false`,
	completed: `patronHostlmsCode: "${code}" AND ${queries.finished}`,
	exception: `patronHostlmsCode: "${code}" AND status: "ERROR"`,
});

export type LibraryPatronRequestBucket = keyof ReturnType<
	typeof getLibraryPatronRequestQueries
>;
