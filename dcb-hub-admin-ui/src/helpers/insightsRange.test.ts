import { describe, it, expect } from "vitest";
import {
	rangeToParams,
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
