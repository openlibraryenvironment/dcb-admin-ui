import {
	getGridStringOperators,
	GridFilterOperator,
} from "@mui/x-data-grid-premium";

// EXACT phrase match, despite the "Contains" label. `field:"term"` compiles to
// `column = 'term'` on the backend, NOT to a substring match: the Lucene bridge
// builds a criteria equality predicate for a quoted field node.
//
// It does NOT work around a backend limitation. Leading wildcards are supported
// (QueryService.allowLeadingWildcard defaults to true) and `field:*term*` becomes
// `column ILIKE '%term%'`, so plain "contains" is the right operator whenever a
// partial term should match - which is nearly always. Reach for this one only when
// whole-value equality is genuinely what you want, and relabel it if you do.
//
// The punctuation problem this once addressed is handled properly now: buildFilterQuery
// escapes Lucene specials (including the ":" in "Tracking failed: Supplying System")
// before wrapping the term.
export const luceneContainsPhrase: GridFilterOperator[] =
	getGridStringOperators()
		.filter((operator) => operator.value === "contains")
		.map((operator) => ({
			...operator,
			value: "containsPhrase",
			label: "Contains",
		}));
