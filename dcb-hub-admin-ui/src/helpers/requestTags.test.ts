import { describe, expect, it } from "vitest";

import { appliedTags } from "./requestTags";

describe("appliedTags", () => {
	it("drops what dcb-service's schema allows to be null", () => {
		expect(
			appliedTags([
				null,
				{ code: null, label: "No code" },
				{
					code: "DAMAGED",
					label: null,
					agencyCodes: ["a", null],
					consortium: true,
				},
			]),
		).toEqual([
			{
				code: "DAMAGED",
				label: "DAMAGED",
				consortium: true,
				agencyCodes: ["a"],
			},
		]);
	});

	it("is empty for a request without tags", () => {
		expect(appliedTags(undefined)).toEqual([]);
		expect(appliedTags(null)).toEqual([]);
	});
});
