import { z } from "zod";

/**
 * The whole Insights view, in the URL.
 *
 * Every field `.catch()`es to its default, so a truncated or hand-edited link degrades to a
 * view rather than throwing a route error at somebody who mistyped a date. What belongs in
 * the link and why, including the scope encoding: INSIGHTS_IA_AND_UX_PLAN.md section 2.
 */

export const RANGE_PRESETS = ["7d", "30d", "90d", "365d"] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];

export const DEFAULT_RANGE: RangePreset = "30d";

/** The statuses that tell the "is it working" story, and the cap on how many may plot. */
export const DEFAULT_SERIES = [
	"LOANED",
	"REQUEST_PLACED_AT_SUPPLYING_AGENCY",
	"ERROR",
];

/** Beyond eight categorical series a chart invents hues nobody can tell apart. */
export const MAX_PLOT_SERIES = 8;

/**
 * Scope carries the SELECTION - `group:<id>,library:<id>` - not the Host LMS codes it
 * resolves to. Storing the codes would restore the figures and lose the chips, and a group
 * that gains a member would silently mean something different on reload.
 */
const scopePattern = /^(group|library):[A-Za-z0-9-]+$/;

const csv = <T>(parse: (value: string) => T | null) =>
	z.string().transform((value) =>
		value
			.split(",")
			.map((part) => part.trim())
			.map(parse)
			.filter((part): part is T => part !== null),
	);

export const insightsSearchSchema = z.object({
	range: z.enum(RANGE_PRESETS).optional().catch(undefined),
	// Only meaningful together, and only when the reader chose an explicit window.
	from: z.string().date().optional().catch(undefined),
	to: z.string().date().optional().catch(undefined),
	scope: csv((part) => (scopePattern.test(part) ? part : null))
		.optional()
		.catch(undefined),
	series: csv((part) => (/^[A-Z_]+$/.test(part) ? part : null))
		.optional()
		.catch(undefined),
	// The reader's own assumption, in the link, so a figure shared into a board pack
	// carries the number it was computed with rather than whatever the recipient last
	// typed. Negative and absurd values fall back rather than producing a negative saving.
	unitCost: z.coerce.number().min(0).max(10_000).optional().catch(undefined),
});

export type InsightsSearch = z.infer<typeof insightsSearchSchema>;

/** The view a bare `/insights` shows, so callers never have to spell the defaults out. */
export function resolveSearch(search: InsightsSearch) {
	const custom =
		search.from && search.to
			? { startDate: search.from, endDate: search.to }
			: null;

	return {
		// An explicit window wins over a preset, and clearing it falls back to one.
		range: search.range ?? DEFAULT_RANGE,
		custom,
		scope: search.scope ?? [],
		series:
			search.series && search.series.length > 0
				? search.series.slice(0, MAX_PLOT_SERIES)
				: DEFAULT_SERIES,
		unitCost: search.unitCost ?? null,
	};
}
