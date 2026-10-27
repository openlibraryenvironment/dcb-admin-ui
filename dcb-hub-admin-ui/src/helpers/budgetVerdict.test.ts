import { describe, expect, it } from "vitest";

import { firstLoadVerdict } from "../../scripts/budget-verdict.ts";
import budget from "../../bundle-budget.json";

describe("firstLoadVerdict", () => {
	it("reports a first load over its budget without failing the build", () => {
		expect(firstLoadVerdict(100_400, 100_000, 5)).toEqual({
			over: 400,
			limit: 105_000,
			blocks: false,
		});
	});

	it("fails the build only past the budget plus the percentage", () => {
		expect(firstLoadVerdict(105_000, 100_000, 5).blocks).toBe(false);
		expect(firstLoadVerdict(105_001, 100_000, 5).blocks).toBe(true);
	});

	it("is within budget at or under the number", () => {
		expect(firstLoadVerdict(99_000, 100_000, 5).over).toBe(-1_000);
	});

	it("blocks at the 5% the budget file states", () => {
		expect(budget.firstLoad.blockAbovePercent).toBe(5);
	});
});
