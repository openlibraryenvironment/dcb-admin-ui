import { GridColDef, GridFilterModel } from "@mui/x-data-grid-premium";
import { describe, expect, it } from "vitest";
import { describeActiveFilters, generateFilterDescription } from "./utilities";

const columns = [
	{ field: "status", headerName: "Status" },
	{
		field: "supplyingAgencyCode",
		headerName: "Supplying library",
		type: "singleSelect",
		valueOptions: [{ value: "ACAD", label: "Academy Library" }],
	},
	{ field: "dateCreated", headerName: "Request created" },
] as GridColDef[];

const model = (overrides: Partial<GridFilterModel>): GridFilterModel => ({
	items: [],
	...overrides,
});

describe("describeActiveFilters", () => {
	it("names the column by its header, not its raw field", () => {
		const summary = describeActiveFilters(
			model({
				items: [{ field: "status", operator: "is", value: "COMPLETED" }],
			}),
			columns,
		);

		expect(summary).toEqual(["Status is COMPLETED"]);
	});

	it("shows the singleSelect label the user picked, not the code", () => {
		const summary = describeActiveFilters(
			model({
				items: [
					{ field: "supplyingAgencyCode", operator: "is", value: "ACAD" },
				],
			}),
			columns,
		);

		expect(summary).toEqual(["Supplying library is Academy Library"]);
	});

	it("ignores filter items the user has not given a value yet", () => {
		const summary = describeActiveFilters(
			model({
				items: [
					{ field: "status", operator: "is", value: "COMPLETED" },
					{ field: "supplyingAgencyCode", operator: "is", value: "" },
				],
			}),
			columns,
		);

		expect(summary).toEqual(["Status is COMPLETED"]);
	});

	it("describes a date range as a readable span", () => {
		const summary = describeActiveFilters(
			model({
				items: [
					{
						field: "dateCreated",
						operator: "luceneDateRange",
						value: ["2026-01-01T00:00:00Z", "2026-06-30T00:00:00Z"],
					},
				],
			}),
			columns,
		);

		expect(summary).toHaveLength(1);
		expect(summary[0]).toContain("Request created");
		expect(summary[0]).toContain("2026-01-01");
		expect(summary[0]).toContain("2026-06-30");
	});

	it("describes the search term only when the grid actually searches on it", () => {
		const searched = model({ quickFilterValues: ["smith"] });

		// Mirrors processGridFilterModel: no quickFilterFields, no applied search -
		// so promising the user it narrows the export would be a lie.
		expect(describeActiveFilters(searched, columns)).toEqual([]);
		expect(describeActiveFilters(searched, columns, ["patronBarcode"])).toEqual(
			["Search: smith"],
		);
	});

	it("reports nothing for an empty or blank model", () => {
		expect(describeActiveFilters(undefined, columns)).toEqual([]);
		expect(describeActiveFilters(model({}), columns)).toEqual([]);
		expect(
			describeActiveFilters(model({ quickFilterValues: ["  "] }), columns, [
				"patronBarcode",
			]),
		).toEqual([]);
	});
});

describe("generateFilterDescription", () => {
	// It feeds export file names, so it keeps naming raw fields even though the
	// wizard summary now speaks in column headers.
	it("still describes filters by raw field name", () => {
		expect(
			generateFilterDescription(
				model({
					items: [{ field: "status", operator: "is", value: "COMPLETED" }],
				}),
			),
		).toContain("status is COMPLETED");
	});

	it("falls back to a generic label when nothing is active", () => {
		expect(generateFilterDescription(model({}))).toBe("Filters");
		expect(
			generateFilterDescription(
				model({ items: [{ field: "status", operator: "is", value: "" }] }),
			),
		).toBe("Filters");
	});
});
