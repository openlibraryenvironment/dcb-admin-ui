import { describe, expect, it } from "vitest";

import { alarmDetailEntries } from "./alarmDetails";

describe("alarmDetailEntries", () => {
	it("puts the reason and the fix first, with their labels", () => {
		const entries = alarmDetailEntries({
			supplier: "ALPHA",
			howToFix: "Correct the credentials for Host LMS ALPHA in DCB Admin",
			reason: "At its last check Host LMS ALPHA refused DCB's credentials",
		});

		expect(entries.map((entry) => entry.key)).toEqual([
			"reason",
			"howToFix",
			"supplier",
		]);
		expect(entries[0].labelKey).toBe("alarms.detail.reason");
		expect(entries[1].labelKey).toBe("alarms.detail.how_to_fix");
		expect(entries[2].labelKey).toBeNull();
		expect(entries[2].fallbackLabel).toBe("Supplier");
	});

	it("puts an unknown key into words", () => {
		const [entry] = alarmDetailEntries({ lastSeenHostLms: "ALPHA" });

		expect(entry.fallbackLabel).toBe("Last seen host lms");
	});

	it("shows a nested value as formatted JSON", () => {
		const [entry] = alarmDetailEntries({ Count: { failed: 3, total: 10 } });

		expect(entry.structured).toBe(true);
		expect(JSON.parse(entry.value)).toEqual({ failed: 3, total: 10 });
	});

	it.each([[null], [undefined], ["text"], [["a", "b"]]])(
		"has no lines for %s",
		(details) => {
			expect(alarmDetailEntries(details)).toEqual([]);
		},
	);
});
