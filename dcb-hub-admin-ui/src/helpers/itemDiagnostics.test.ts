import { describe, expect, it } from "vitest";

import { showItemDiagnostics } from "./itemDiagnostics";

describe("showItemDiagnostics", () => {
	it("shows an available item's decision log when it has entries", () => {
		expect(
			showItemDiagnostics({
				status: { code: "AVAILABLE" },
				decisionLogEntries: [
					"Alma did not report this item's requests, so its hold count is shown as 0",
				],
			}),
		).toBe(true);
	});

	it("hides it for an available item with nothing to explain", () => {
		expect(
			showItemDiagnostics({
				status: { code: "AVAILABLE" },
				decisionLogEntries: [],
			}),
		).toBe(false);
	});

	it("hides it for an available item whose system sends no decision log", () => {
		expect(showItemDiagnostics({ status: { code: "AVAILABLE" } })).toBe(false);
	});

	it("still shows it for an item that is not available", () => {
		expect(
			showItemDiagnostics({
				status: { code: "CHECKED_OUT" },
				decisionLogEntries: [],
			}),
		).toBe(true);
	});
});
