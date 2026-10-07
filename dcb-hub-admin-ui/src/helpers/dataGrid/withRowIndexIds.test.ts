import { describe, expect, it } from "vitest";

import { withRowIndexIds } from "./withRowIndexIds";

/**
 * The Request Errors pages crashed for every consortium with any matching error.
 * MUI X throws on a row with no id, so this is not a cosmetic defect - the route
 * rendered the generic error page instead of the grid.
 */
describe("rows from /sql get an id", () => {
	it("gives every row a unique id", () => {
		// errorOverview.sql selects exactly these five columns, and no id.
		const hits = [
			{
				description: "Read timeout, DCB-1450",
				namedSql: "errors/readTimeout",
				total: "12",
			},
			{
				description: "Already on hold, DCB-1452",
				namedSql: "errors/alreadyOnHold",
				total: "3",
			},
		];

		const rows = withRowIndexIds(hits);

		expect(rows.map((row) => row.id)).toEqual([0, 1]);
		expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
	});

	it("keeps every original column", () => {
		const rows = withRowIndexIds([{ Date: "2026-09-30", RequestId: "abc" }]);
		expect(rows[0]).toEqual({ Date: "2026-09-30", RequestId: "abc", id: 0 });
	});

	it("survives the empty and absent cases", () => {
		// `records?.hits` is undefined while the query is in flight, and the SQL
		// service omits `hits` entirely when it returns an error instead.
		expect(withRowIndexIds(undefined)).toEqual([]);
		expect(withRowIndexIds(null)).toEqual([]);
		expect(withRowIndexIds([])).toEqual([]);
	});

	it("does not reuse an id when a value repeats", () => {
		// Two rows can be identical in every selected column - a count of the same
		// description under two named queries - so the id cannot be derived from
		// the content.
		const rows = withRowIndexIds([{ total: "1" }, { total: "1" }]);
		expect(rows[0].id).not.toBe(rows[1].id);
	});
});
