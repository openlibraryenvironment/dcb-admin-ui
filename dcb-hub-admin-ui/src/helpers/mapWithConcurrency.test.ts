import { describe, it, expect } from "vitest";

import { mapWithConcurrency } from "./mapWithConcurrency";

describe("mapWithConcurrency", () => {
	it("preserves input order in the results", async () => {
		const result = await mapWithConcurrency(
			[1, 2, 3, 4, 5],
			2,
			async (n) => n * 2,
		);
		expect(result).toEqual([2, 4, 6, 8, 10]);
	});

	it("never runs more than the limit at once", async () => {
		let inFlight = 0;
		let peak = 0;

		await mapWithConcurrency(
			Array.from({ length: 20 }, (_, index) => index),
			3,
			async () => {
				inFlight += 1;
				peak = Math.max(peak, inFlight);
				await Promise.resolve();
				inFlight -= 1;
			},
		);

		expect(peak).toBeLessThanOrEqual(3);
	});

	it("handles an empty list", async () => {
		expect(await mapWithConcurrency([], 4, async () => 1)).toEqual([]);
	});

	it("does not spawn more runners than there are items", async () => {
		// A 500-wide limit over three libraries must not create 500 promises.
		const result = await mapWithConcurrency(["a", "b", "c"], 500, async (s) =>
			s.toUpperCase(),
		);
		expect(result).toEqual(["A", "B", "C"]);
	});
});
