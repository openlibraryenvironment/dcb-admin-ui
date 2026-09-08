import { describe, it, expect } from "vitest";
import { constrainToServerOperators } from "@filters/serverFilterOperators";
import { buildFilterQuery } from "@helpers/dataGrid/buildFilterQuery";
import { standardFilters } from "@filters/standardFilters";
import { dcbStatusValueOptions } from "@constants/statuses/DCBStatuses";
import {
	getGridSingleSelectOperators,
	GridColDef,
} from "@mui/x-data-grid-premium";

const operatorsFor = (column: GridColDef): string[] =>
	constrainToServerOperators([column])[0].filterOperators?.map(
		(operator) => operator.value,
	) ?? [];

describe("constrainToServerOperators", () => {
	it("strips the operators the Lucene builder cannot answer from a plain string column", () => {
		// No `filterOperators` declared, so MUI hands it the full default string set.
		const operators = operatorsFor({ field: "pickupRequestId" });

		expect(operators).not.toContain("startsWith");
		expect(operators).not.toContain("endsWith");
		expect(operators).not.toContain("isEmpty");
		expect(operators).not.toContain("isNotEmpty");
		expect(operators).toEqual(
			expect.arrayContaining(["contains", "equals", "isAnyOf"]),
		);
	});

	it("leaves a singleSelect status column alone - is / not / isAnyOf are all supported now", () => {
		const column: GridColDef = {
			field: "status",
			type: "singleSelect",
			valueOptions: dcbStatusValueOptions,
		};

		// Nothing to strip, so the column keeps MUI's defaults by reference.
		expect(constrainToServerOperators([column])[0]).toBe(column);
		expect(
			getGridSingleSelectOperators().map((operator) => operator.value),
		).toEqual(["is", "not", "isAnyOf"]);
	});

	it("strips isEmpty / isNotEmpty from a number column", () => {
		const operators = operatorsFor({ field: "pollCount", type: "number" });

		expect(operators).not.toContain("isEmpty");
		expect(operators).not.toContain("isNotEmpty");
		expect(operators).toEqual(expect.arrayContaining(["=", "!=", ">", "<"]));
	});

	it("leaves a column that already declares a supported-only set untouched", () => {
		const column: GridColDef = {
			field: "errorMessage",
			filterOperators: standardFilters,
		};

		// Same reference: nothing to constrain, so nothing is rebuilt.
		expect(constrainToServerOperators([column])[0]).toBe(column);
	});

	it("does not touch columns that are not filterable", () => {
		const column: GridColDef = { field: "title", filterable: false };

		expect(constrainToServerOperators([column])[0]).toBe(column);
	});

	it("every operator left on a string column is one buildFilterQuery really implements", () => {
		// The guard is only as good as its whitelist. Prove that each operator the
		// panel can still offer on a default string column builds a real query, and
		// that no negation collapses back into the equals it is supposed to invert.
		const equals = buildFilterQuery("f", "equals", "v");

		for (const operator of operatorsFor({ field: "f" })) {
			const query = buildFilterQuery(
				"f",
				operator,
				operator === "isAnyOf" ? ["v"] : "v",
			);

			expect(query, `${operator} built no query`).not.toBe("");
			if (operator.includes("oesNot")) {
				expect(query, `${operator} collapsed into equals`).not.toBe(equals);
			}
		}
	});
});
