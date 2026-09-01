import type { LoadConsortiumQueryVariables } from "@generated/graphql";

/**
 * The consortium record's query, shared by its two routes and the component they render.
 *
 * Loader and component MUST agree on both key and variables, or `ensureQueryData` warms a
 * cache entry the component never reads and every visit refetches. With two routes on one
 * component that is now three places to agree, which is two too many to keep in step by
 * hand.
 *
 * Here rather than exported from the component: a module that exports both a component and
 * a constant breaks fast refresh, and eslint says so.
 */
export const CONSORTIUM_QUERY_KEY = ["LoadConsortium"];

/** The newest consortium - the record every one of these pages is about. */
export const CONSORTIUM_QUERY_VARIABLES: LoadConsortiumQueryVariables = {
	order: "id",
	orderBy: "DESC",
};
