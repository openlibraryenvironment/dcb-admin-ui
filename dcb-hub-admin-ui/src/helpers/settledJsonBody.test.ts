import { describe, expect, it } from "vitest";

import { settledJsonBody } from "./settledJsonBody";

const fulfilled = (data: unknown): PromiseSettledResult<{ data: unknown }> => ({
	status: "fulfilled",
	value: { data },
});

describe("settledJsonBody", () => {
	it("passes a JSON object through", () => {
		const body = { trackingIntervals: { "1": 60 } };
		expect(settledJsonBody(fulfilled(body))).toBe(body);
	});

	// The regression. `/admin/trackingConfiguration` answered 200 with index.html - an
	// SPA fallback, which is what any origin serving this app returns for a path it does
	// not know. The caller checked only that the promise was fulfilled, cast the string
	// to its response type, and Object.entries(undefined) took Service Status and the
	// consortium's Environment tab to "500 Server error".
	it("rejects an HTML document served with a 200", () => {
		const html =
			"<!doctype html><html><body><div id='root'></div></body></html>";
		expect(settledJsonBody(fulfilled(html))).toBeNull();
	});

	it.each([
		["a plain string", "unavailable"],
		["an empty string", ""],
		["null", null],
		["undefined", undefined],
		["a number", 503],
		// An array where an object is expected is the same class of wrong answer, and
		// Object.entries would happily return index/value pairs from it.
		["an array", [{ trackingIntervals: {} }]],
	])("rejects %s", (_label, body) => {
		expect(settledJsonBody(fulfilled(body))).toBeNull();
	});

	it("rejects a rejected request", () => {
		expect(
			settledJsonBody({
				status: "rejected",
				reason: new Error("502 Bad Gateway"),
			}),
		).toBeNull();
	});

	it("rejects a fulfilled result carrying no response at all", () => {
		expect(
			settledJsonBody({
				status: "fulfilled",
				value: undefined as unknown as { data: unknown },
			}),
		).toBeNull();
	});
});
