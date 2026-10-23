/**
 * Which Insights pages a deployment shows, VITE_INSIGHTS_PAGES, and the selection
 * grammar the panels share: docs/deployment.md, 2b. Kept apart from the panels because
 * every page loads this, through the sidebar and the route guards.
 */

export const INSIGHTS_PAGES = ["consortium", "groups", "libraries"] as const;

export type InsightsPage = (typeof INSIGHTS_PAGES)[number];

export interface Selection<Name extends string> {
	shown: ReadonlySet<Name>;
	/** Names the value carried that are not in the vocabulary, as written. */
	unknown: string[];
}

/**
 * Unset or blank is everything. Otherwise names apply left to right: `all` adds
 * everything, a name adds its members, `-name` removes them.
 */
export const select = <Name extends string>(
	raw: string | undefined,
	all: readonly Name[],
	members: ReadonlyMap<string, readonly Name[]>,
): Selection<Name> => {
	const tokens = (raw ?? "")
		.split(",")
		.map((token) => token.trim())
		.filter(Boolean);
	if (tokens.length === 0) return { shown: new Set(all), unknown: [] };

	const shown = new Set<Name>();
	const unknown: string[] = [];
	for (const token of tokens) {
		const remove = token.startsWith("-");
		const name = remove ? token.slice(1) : token;
		const named = name === "all" ? all : members.get(name);
		if (!named) {
			unknown.push(token);
			continue;
		}
		for (const member of named) {
			if (remove) shown.delete(member);
			else shown.add(member);
		}
	}
	return { shown, unknown };
};

const PAGE_MEMBERS = new Map<string, readonly InsightsPage[]>(
	INSIGHTS_PAGES.map((page) => [page, [page]]),
);

export const selectPages = (raw: string | undefined) =>
	select(raw, INSIGHTS_PAGES, PAGE_MEMBERS);
