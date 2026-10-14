import { describe, it, expect } from "vitest";

import { mapAllTypes } from "./mapAllTypes";

describe("mapAllTypes", () => {
	it("maps all eleven DCB patron types and all three item types to one local value each", () => {
		const rows = mapAllTypes("LIB-SIERRA", " 15 ", "BOOK");

		expect(
			rows.filter((row) => row.fromCategory === "patronType"),
		).toHaveLength(11);
		expect(rows.filter((row) => row.fromCategory === "ItemType")).toHaveLength(
			3,
		);
		expect(rows[0]).toEqual({
			fromContext: "DCB",
			fromCategory: "patronType",
			fromValue: "ADULT",
			toContext: "LIB-SIERRA",
			toCategory: "patronType",
			toValue: "15",
		});
	});

	it("writes nothing for a side left blank", () => {
		expect(
			mapAllTypes("LIB-SIERRA", "", "BOOK").map((row) => row.fromCategory),
		).toEqual(["ItemType", "ItemType", "ItemType"]);
		expect(mapAllTypes("LIB-SIERRA", "", "")).toEqual([]);
	});
});
