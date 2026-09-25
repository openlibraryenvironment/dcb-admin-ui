import { describe, expect, it } from "vitest";

import {
	DEFAULT_STALE_MS,
	MIN_STALE_MS,
	staleTimeFromNextPoll,
} from "@helpers/patronRequestFreshness";

describe("staleTimeFromNextPoll", () => {
	const now = Date.parse("2026-09-24T12:00:00Z");
	const at = (seconds: number) => new Date(now + seconds * 1000).toISOString();

	it("holds until the poll dcb-service has scheduled", () => {
		// CONFIRMED is polled every 10m, so a poll due in 90s is 90s of trustworthy data.
		expect(staleTimeFromNextPoll(at(90), now)).toBe(90_000);
	});

	it("caps at the app-wide default, so it can only make data fresher", () => {
		// LOANED is polled every 6h. Trusting the cache that long would be a behaviour
		// change in the wrong direction from a page staff open to see what is happening.
		expect(staleTimeFromNextPoll(at(6 * 60 * 60), now)).toBe(DEFAULT_STALE_MS);
	});

	it("floors a poll that is imminent or overdue", () => {
		// REQUEST_PLACED_AT_SUPPLYING_AGENCY is polled every second; a sweep running
		// behind puts the due time in the past. Neither should mean staleTime: 0.
		expect(staleTimeFromNextPoll(at(1), now)).toBe(MIN_STALE_MS);
		expect(staleTimeFromNextPoll(at(-3600), now)).toBe(MIN_STALE_MS);
	});

	it("keeps the default when no poll is scheduled", () => {
		// Terminal, or parked by `too-long`. Not Infinity: another operator's clean up or
		// rollback still moves the request, and this page is not told when it does.
		for (const value of [null, undefined, ""]) {
			expect(staleTimeFromNextPoll(value, now)).toBe(DEFAULT_STALE_MS);
		}
	});

	it("keeps the default when the server sends something unreadable", () => {
		expect(staleTimeFromNextPoll("not a date", now)).toBe(DEFAULT_STALE_MS);
	});
});
