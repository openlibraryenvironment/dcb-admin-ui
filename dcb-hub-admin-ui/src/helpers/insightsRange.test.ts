import { describe, it, expect } from "vitest";
import dayjs from "dayjs";
import {
	rangeToParams,
	customRangeToParams,
	intervalForRange,
	formatDuration,
} from "@helpers/insightsRange";

describe("intervalForRange", () => {
	it("uses coarser buckets for longer windows", () => {
		expect(intervalForRange("7d")).toBe("day");
		expect(intervalForRange("30d")).toBe("day");
		expect(intervalForRange("90d")).toBe("week");
		expect(intervalForRange("365d")).toBe("month");
	});
});

describe("rangeToParams", () => {
	it("spans the requested number of days", () => {
		const { startDate, endDate } = rangeToParams("30d");
		const days =
			(new Date(endDate).getTime() - new Date(startDate).getTime()) /
			(24 * 60 * 60 * 1000);
		expect(days).toBe(30);
	});

	it("floors the window end to the hour so query keys are stable", () => {
		const { endDate } = rangeToParams("7d");
		const end = new Date(endDate);
		expect(end.getMinutes()).toBe(0);
		expect(end.getSeconds()).toBe(0);
		expect(end.getMilliseconds()).toBe(0);
	});
});

describe("customRangeToParams", () => {
	it("covers the whole of both days the reader picked, in their own zone", () => {
		// The window the endpoints are asked for has to START at the beginning of the
		// first day and END at the end of the last, or a range chosen as "1st to 15th"
		// silently excludes everything that happened on the 15th.
		const { startDate, endDate } = customRangeToParams({
			startDate: "2026-09-01",
			endDate: "2026-09-15",
		});

		expect(dayjs(startDate).isSame(dayjs("2026-09-01").startOf("day"))).toBe(
			true,
		);
		expect(dayjs(endDate).isSame(dayjs("2026-09-15").endOf("day"))).toBe(true);
	});

	it("states the window as the instant every /insights/* parameter binds", () => {
		// A plain date is what the URL carries and what the search schema accepts; it is
		// NOT what the controller takes - every date parameter there is a java.time
		// Instant, which `2026-09-01` does not parse as.
		const { startDate, endDate } = customRangeToParams({
			startDate: "2026-09-01",
			endDate: "2026-09-15",
		});

		for (const value of [startDate, endDate]) {
			expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		}
	});
});

describe("formatDuration", () => {
	it("renders an em dash for missing / non-positive input", () => {
		expect(formatDuration(0)).toBe("—");
		expect(formatDuration(null)).toBe("—");
		expect(formatDuration(undefined)).toBe("—");
	});

	it("scales the unit to the magnitude", () => {
		expect(formatDuration(300)).toBe("5 min");
		expect(formatDuration(3600)).toBe("1.0 hrs");
		expect(formatDuration(172800)).toBe("2.0 days");
	});
});
