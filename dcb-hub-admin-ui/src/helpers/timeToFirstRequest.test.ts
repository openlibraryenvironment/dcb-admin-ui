import { describe, it, expect } from "vitest";

import { earliest, timeToFirstRequest } from "./timeToFirstRequest";

describe("timeToFirstRequest", () => {
	it("takes the median of the days from creation to first request", () => {
		expect(
			timeToFirstRequest([
				{
					createdAt: "2026-01-01T00:00:00Z",
					firstRequestAt: "2026-01-05T00:00:00Z",
				},
				{
					createdAt: "2026-01-01T00:00:00Z",
					firstRequestAt: "2026-01-11T00:00:00Z",
				},
				{
					createdAt: "2026-01-01T00:00:00Z",
					firstRequestAt: "2026-01-31T00:00:00Z",
				},
			]),
		).toEqual({ medianDays: 10, measured: 3, waiting: 0 });
	});

	it("averages the middle two when the count is even", () => {
		expect(
			timeToFirstRequest([
				{
					createdAt: "2026-01-01T00:00:00Z",
					firstRequestAt: "2026-01-02T00:00:00Z",
				},
				{
					createdAt: "2026-01-01T00:00:00Z",
					firstRequestAt: "2026-01-03T12:00:00Z",
				},
			]).medianDays,
		).toBe(1.8);
	});

	it("counts a library with no request yet as waiting, and one with no creation date not at all", () => {
		expect(
			timeToFirstRequest([
				{ createdAt: "2026-01-01T00:00:00Z", firstRequestAt: null },
				{ createdAt: null, firstRequestAt: "2026-01-05T00:00:00Z" },
			]),
		).toEqual({ medianDays: null, measured: 0, waiting: 1 });
	});

	it("leaves out a first request older than the library record", () => {
		expect(
			timeToFirstRequest([
				{
					createdAt: "2026-03-01T00:00:00Z",
					firstRequestAt: "2025-06-01T00:00:00Z",
				},
			]),
		).toEqual({ medianDays: null, measured: 0, waiting: 0 });
	});
});

describe("earliest", () => {
	it("picks the earlier timestamp and ignores missing ones", () => {
		expect(earliest("2026-02-01T00:00:00Z", null, "2026-01-15T00:00:00Z")).toBe(
			"2026-01-15T00:00:00Z",
		);
		expect(earliest(null, undefined)).toBeNull();
	});
});
