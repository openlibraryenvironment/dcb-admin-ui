import { describe, expect, it } from "vitest";
import type { GridColDef } from "@mui/x-data-grid-premium";

import { doesNotContainFilter } from "./doesNotContainFilter";
import { doesNotEqualFilter } from "./doesNotEqualFilter";

const column = { field: "status" } as GridColDef;

// MUI X 7+ calls the filter with the cell VALUE first, not a params object
const keeps = (
	operator: typeof doesNotEqualFilter,
	filterValue: string,
	cell: unknown,
) =>
	operator.getApplyFilterFn(
		{ field: "status", operator: operator.value, value: filterValue },
		column,
	)!(cell, {}, column, { current: null } as never);

describe("does not equal", () => {
	it("keeps a row whose value differs, and drops one that matches", () => {
		expect(keeps(doesNotEqualFilter, "ERROR", "LOANED")).toBe(true);
		expect(keeps(doesNotEqualFilter, "ERROR", "ERROR")).toBe(false);
	});
});

describe("does not contain", () => {
	it("keeps a row without the term, and drops one with it in any case", () => {
		expect(keeps(doesNotContainFilter, "time", "Item lost")).toBe(true);
		expect(keeps(doesNotContainFilter, "time", "Read Timeout")).toBe(false);
	});

	it("keeps a row with no value", () => {
		expect(keeps(doesNotContainFilter, "time", null)).toBe(true);
	});
});
