import { describe, expect, it, vi } from "vitest";

import { serviceLivenessCheck } from "./serviceLiveness";

describe("serviceLivenessCheck", () => {
	it("is up when the probe answers and down when it fails", async () => {
		expect(await serviceLivenessCheck(() => Promise.resolve())()).toBe(true);
		expect(
			await serviceLivenessCheck(() => Promise.reject(new Error("503")))(),
		).toBe(false);
	});

	it("asks once for failures that arrive together, and again after", async () => {
		let answer!: () => void;
		const probe = vi.fn(
			() => new Promise<void>((resolve) => (answer = resolve)),
		);
		const isUp = serviceLivenessCheck(probe);

		const together = [isUp(), isUp(), isUp()];
		answer();
		expect(await Promise.all(together)).toEqual([true, true, true]);
		expect(probe).toHaveBeenCalledTimes(1);

		const later = isUp();
		answer();
		await later;
		expect(probe).toHaveBeenCalledTimes(2);
	});
});
