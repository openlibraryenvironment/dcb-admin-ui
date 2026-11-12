import { describe, expect, it } from "vitest";

import { referenceValueMappingsView } from "@constants/dataGrid/gridViews";
import { standardRefValueMappingColumns } from "./referenceValueMappingColumns";

// referenceValueMappings ordered by lastImported loads every mapping unpaged and sorts it in
// the JVM (DataFetchers, 8.71.0-9.3.0): across a consortium, every visit to this grid
describe("the consortium reference value mappings grid", () => {
	it("does not open sorted by lastImported", () => {
		expect(
			referenceValueMappingsView.defaultSort.map((entry) => entry.field),
		).not.toContain("lastImported");
	});

	it("does not offer lastImported for sorting", () => {
		expect(
			standardRefValueMappingColumns.find(
				(column) => column.field === "lastImported",
			)?.sortable,
		).toBe(false);
	});
});
