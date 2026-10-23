/**
 * Which Insights pages and panels a deployment shows: VITE_INSIGHTS_PAGES and
 * VITE_INSIGHTS_PANELS, in the grammar of docs/deployment.md, 2b. No MUI here: route
 * options load eagerly.
 */

/** Each subject's panels, plus the overview above them; a name is `section.panel`. */
export const INSIGHTS_PANELS = {
	overview: ["headline", "moreFigures"],
	trends: ["trendStrip", "durationTrend", "statusFlow"],
	service: [
		"durations",
		"peerBenchmark",
		"failures",
		"supplierReliability",
		"timeInStatus",
		"supplierResponse",
	],
	demand: [
		"heatmap",
		"dimensions",
		"topTitles",
		"byPickupLocation",
		"byPatronGroup",
		"unfillable",
	],
	partners: ["tradingPartners", "netFlow"],
	collection: ["totals", "clusterQuality", "profile", "formatMix", "overlap"],
	gaps: [
		"unmetLocal",
		"acquisitionOpportunities",
		"consortialLifeline",
		"newAcquisitions",
		"rareGems",
	],
} as const;

export type InsightsSection = keyof typeof INSIGHTS_PANELS;

export type InsightsPanel = {
	[S in InsightsSection]: `${S}.${(typeof INSIGHTS_PANELS)[S][number]}`;
}[InsightsSection];

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

const sections = Object.keys(INSIGHTS_PANELS) as InsightsSection[];

export const ALL_PANELS: readonly InsightsPanel[] = sections.flatMap(
	(section) =>
		INSIGHTS_PANELS[section].map(
			(panel) => `${section}.${panel}` as InsightsPanel,
		),
);

export const panelsOf = (section: InsightsSection): readonly InsightsPanel[] =>
	ALL_PANELS.filter((panel) => panel.startsWith(`${section}.`));

const PANEL_MEMBERS = new Map<string, readonly InsightsPanel[]>([
	...sections.map((section) => [section, panelsOf(section)] as const),
	...ALL_PANELS.map((panel) => [panel, [panel]] as const),
]);

const PAGE_MEMBERS = new Map<string, readonly InsightsPage[]>(
	INSIGHTS_PAGES.map((page) => [page, [page]]),
);

export const selectPanels = (raw: string | undefined) =>
	select(raw, ALL_PANELS, PANEL_MEMBERS);

export const selectPages = (raw: string | undefined) =>
	select(raw, INSIGHTS_PAGES, PAGE_MEMBERS);
