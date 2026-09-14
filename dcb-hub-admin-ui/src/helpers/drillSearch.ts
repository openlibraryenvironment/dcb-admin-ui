import { z } from "zod";

/**
 * What a drill-down link carries into a patron request grid.
 *
 * `q` is the panel's composed filter; the route ANDs it with its own preset, so a link into
 * the exception tab still only shows exceptions. `from` is the Insights view to return to,
 * and `fromLabel` names the panel it came from - a drill-down that strands the reader is
 * worse than no drill-down, and "Back" does not tell them where back is.
 *
 * Both `.catch()` to undefined, so a truncated or hand-edited link renders the unfiltered
 * tab rather than throwing a route error.
 */

/**
 * The return link is rendered as an href, so it is checked to be a path on THIS app and not
 * an absolute URL - a link parameter that can name any origin is an open redirect, and the
 * fact that it is only a back button today does not make it safe tomorrow.
 */
const internalPath = z
	.string()
	.max(2048)
	.refine((value) => value.startsWith("/") && !value.startsWith("//"));

export const drillSearchSchema = z.object({
	q: z.string().max(2048).optional().catch(undefined),
	from: internalPath.optional().catch(undefined),
	fromLabel: z.string().max(120).optional().catch(undefined),
});

export type DrillSearch = z.infer<typeof drillSearchSchema>;

/**
 * The tab's preset ANDed with the drill-down's filter.
 *
 * Parenthesised, because the presets are already boolean expressions: appending a bare term
 * to `a OR b` binds to `b` alone and silently widens the set.
 */
export const composeQuery = (preset: string, q?: string): string => {
	const filter = q?.trim();
	if (!filter) return preset;
	return preset ? `${preset} AND (${filter})` : filter;
};
