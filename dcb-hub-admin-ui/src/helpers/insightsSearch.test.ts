import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { resolve } from "path";

import {
	DEFAULT_RANGE,
	DEFAULT_SERIES,
	MAX_PLOT_SERIES,
	insightsSearchSchema,
	resolveSearch,
} from "./insightsSearch";

/**
 * A URL a reader can type, truncate or forward has to degrade rather than throw, and a
 * link somebody shares has to open on the view that was shared. Both are assertions about
 * this schema, and neither needs a rendered dashboard to check.
 */
describe("the Insights view, in the URL", () => {
	const parse = (search: Record<string, unknown>) =>
		resolveSearch(insightsSearchSchema.parse(search));

	it("opens a bare URL on the default view", () => {
		const view = parse({});

		expect(view.range).toBe(DEFAULT_RANGE);
		expect(view.custom).toBeNull();
		expect(view.scope).toEqual([]);
		expect(view.series).toEqual(DEFAULT_SERIES);
		expect(view.unitCost).toBeNull();
	});

	it("round-trips a full view", () => {
		const view = parse({
			range: "90d",
			from: "2026-08-01",
			to: "2026-08-31",
			scope: "group:7f3a,library:91c2",
			series: "LOANED,ERROR",
			unitCost: "17.5",
		});

		expect(view.custom).toEqual({
			startDate: "2026-08-01",
			endDate: "2026-08-31",
		});
		expect(view.scope).toEqual(["group:7f3a", "library:91c2"]);
		expect(view.series).toEqual(["LOANED", "ERROR"]);
		expect(view.unitCost).toBe(17.5);
	});

	it("degrades a junk value rather than throwing at the reader", () => {
		// Every one of these is something a truncated or hand-edited link produces.
		const view = parse({
			range: "forever",
			from: "last tuesday",
			to: "2026-13-45",
			scope: "library:91c2,../etc/passwd,group:",
			series: "LOANED,<script>,lower_case",
			unitCost: "-40",
		});

		expect(view.range).toBe(DEFAULT_RANGE);
		expect(view.custom).toBeNull();
		// The one well-formed member of the scope survives; the rest are dropped.
		expect(view.scope).toEqual(["library:91c2"]);
		expect(view.series).toEqual(["LOANED"]);
		expect(view.unitCost).toBeNull();
	});

	it("needs both ends of an explicit window, or neither", () => {
		// Half a window is not a window, and reading it as one would silently move the
		// other end to a default the reader never chose.
		expect(parse({ from: "2026-08-01" }).custom).toBeNull();
		expect(parse({ to: "2026-08-31" }).custom).toBeNull();
	});

	it("caps the plotted series at the number a reader can tell apart", () => {
		// Real status codes carry no digits, which is what the schema's filter enforces -
		// so the fixture must not either, or this would be testing the filter instead.
		const tooMany = Array.from(
			{ length: 12 },
			(_, i) => `STATUS_${"A".repeat(i + 1)}`,
		).join(",");

		expect(parse({ series: tooMany }).series).toHaveLength(MAX_PLOT_SERIES);
	});
});

describe("the store this replaced", () => {
	it("is gone, and stays gone", () => {
		// Blunt on purpose. The failure mode is somebody reaching for a store the next
		// time a piece of dashboard state needs somewhere to live, and a test naming the
		// file says why in its message: state a link should carry belongs in the link.
		expect(
			existsSync(resolve(__dirname, "../hooks/insightsPlotStore.ts")),
			"insightsPlotStore is back - Insights view state belongs in the URL",
		).toBe(false);
	});
});
