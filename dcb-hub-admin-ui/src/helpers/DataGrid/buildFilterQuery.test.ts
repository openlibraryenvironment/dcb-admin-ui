import { describe, it, expect } from "vitest";
import { buildFilterQuery } from "@helpers/dataGrid/buildFilterQuery";
import { processGridFilterModel } from "@helpers/dataGrid/utilities";
import { queries } from "@constants/patronRequestGridQueries";
import { GridFilterModel } from "@mui/x-data-grid-premium";

describe("buildFilterQuery: singleSelect operators", () => {
	it("negates the term for 'is not' rather than falling through to equals", () => {
		expect(buildFilterQuery("status", "not", "LOANED")).toBe(
			"*:* AND NOT (status:LOANED)",
		);
		expect(buildFilterQuery("status", "not", "LOANED")).not.toBe(
			buildFilterQuery("status", "is", "LOANED"),
		);
	});

	it("builds an OR group for 'is any of'", () => {
		expect(buildFilterQuery("status", "isAnyOf", ["LOANED", "CONFIRMED"])).toBe(
			"(status:LOANED OR status:CONFIRMED)",
		);
	});

	it("returns no clause when 'is any of' has no selections", () => {
		expect(buildFilterQuery("status", "isAnyOf", [])).toBe("");
	});

	it("escapes spaces in 'is any of' values", () => {
		expect(
			buildFilterQuery("pickupLocationCode", "isAnyOf", ["Main Desk"]),
		).toBe("(pickupLocationCode:Main?Desk)");
	});

	it("still equals on 'is'", () => {
		expect(buildFilterQuery("status", "is", "ERROR")).toBe("status:ERROR");
	});
});

describe("buildFilterQuery: existing operators are unchanged", () => {
	it.each([
		["contains", "err", "errorMessage:*err*"],
		["equals", "err", "errorMessage:err"],
		["does not equal", "err", "*:* AND NOT (errorMessage:err)"],
		["does not contain", "err", "*:* AND NOT (errorMessage:*err*)"],
	])("%s", (operator, value, expected) => {
		expect(buildFilterQuery("errorMessage", operator, value)).toBe(expected);
	});

	it("converts days to seconds for duration fields", () => {
		expect(buildFilterQuery("elapsedTimeInCurrentStatus", ">", 2)).toBe(
			"elapsedTimeInCurrentStatus:{172800 TO *}",
		);
	});
});

describe("processGridFilterModel: status filters compose with the tab base query", () => {
	const model = (operator: string, value: unknown): GridFilterModel => ({
		items: [{ id: 1, field: "status", operator, value }],
	});

	it("ANDs an 'is not' clause onto the active tab query", () => {
		expect(
			processGridFilterModel(model("not", "LOANED"), queries.inProgress),
		).toBe(`${queries.inProgress} AND ((*:* AND NOT (status:LOANED)))`);
	});

	it("ANDs an 'is any of' clause onto the active tab query", () => {
		expect(
			processGridFilterModel(
				model("isAnyOf", ["LOANED", "CONFIRMED"]),
				queries.inProgress,
			),
		).toBe(`${queries.inProgress} AND (((status:LOANED OR status:CONFIRMED)))`);
	});

	it("leaves the base query untouched when 'is any of' is empty", () => {
		expect(
			processGridFilterModel(model("isAnyOf", []), queries.inProgress),
		).toBe(queries.inProgress);
	});
});
