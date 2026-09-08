import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildSchema, parse, validate } from "graphql";
import { describe, expect, it } from "vitest";
import { getPatronRequests } from "@queries/getPatronRequests";
import { getPatronRequestDashboard } from "@queries/getPatronRequestDashboard";
import { getPatronRequestsForExport } from "@queries/getPatronRequestsForExport";

// The exact strings graphql-request posts, fragment interpolation and all.
const documents = {
	LoadPatronRequests: getPatronRequests,
	GetPatronRequestDashboard: getPatronRequestDashboard,
	LoadPatronRequestsForExport: getPatronRequestsForExport,
};

const schema = buildSchema(
	readFileSync(resolve(__dirname, "../../../schema.graphqls"), "utf8"),
);

/** Field names selected on a patron request row, via the shared fragment. */
const rowFields = (document: string): string[] => {
	const fragment = parse(document).definitions.find(
		(definition) =>
			definition.kind === "FragmentDefinition" &&
			definition.name.value === "PatronRequestFields",
	);
	if (!fragment || fragment.kind !== "FragmentDefinition") {
		throw new Error("PatronRequestFields fragment was not interpolated");
	}
	return fragment.selectionSet.selections
		.map((selection) =>
			selection.kind === "Field" ? selection.name.value : "",
		)
		.filter(Boolean)
		.sort();
};

describe("patron request grid documents", () => {
	// Codegen plucks the fragment as its own document, so it alone does not prove
	// the interpolated string sent at runtime is a valid, self-contained document.
	it.each(Object.entries(documents))(
		"%s is valid against the schema at runtime",
		(_name, document) => {
			expect(validate(schema, parse(document))).toEqual([]);
		},
	);

	it("all three grid documents request identical row fields", () => {
		// The invariant the shared fragment exists to enforce: the grids and the
		// export can never disagree about which columns have data behind them.
		const [grid, dashboard, exportDoc] =
			Object.values(documents).map(rowFields);
		expect(dashboard).toEqual(grid);
		expect(exportDoc).toEqual(grid);
	});

	it("covers the fields the previously drifting columns read", () => {
		expect(rowFields(getPatronRequests)).toEqual(
			expect.arrayContaining([
				"isExpeditedCheckout",
				"localItemType",
				"pickupItemId",
				"pickupRequestId",
				"pickupRequestStatus",
				"renewalCount",
				"resolutionCount",
			]),
		);
	});
});
