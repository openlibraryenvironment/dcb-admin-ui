import { describe, expect, it } from "vitest";

import application from "@/locales/en-GB/application.json";
import { getRequestError } from "@helpers/getRequestError";

const translated = (key: string): unknown =>
	key
		.split(".")
		.reduce<unknown>(
			(node, part) => (node as Record<string, unknown> | undefined)?.[part],
			application,
		);

describe("getRequestError", () => {
	it("explains a request refused because a library system was too slow to check it", () => {
		const key = getRequestError([
			{
				code: "PREFLIGHT_CHECKS_TIMED_OUT",
				description: "did not finish within PT45S",
			},
		]);

		expect(key).toBe("requesting.staff_request.patron.error.request.timed_out");
		expect(typeof translated(key)).toBe("string");
	});

	it("still names a duplicate request", () => {
		expect(
			getRequestError([{ code: "DUPLICATE_REQUEST_ATTEMPT", description: "" }]),
		).toBe("requesting.staff_request.patron.error.request.duplicate");
	});

	it("shows any other refusal's code and description", () => {
		expect(getRequestError([{ code: "PATRON_BLOCKED", description: "" }])).toBe(
			"requesting.staff_request.patron.error.request.generic",
		);
	});
});
