import { select } from "@helpers/insightsPages";

/**
 * Which Insights panels a deployment shows: VITE_INSIGHTS_PANELS, in the grammar of
 * docs/deployment.md, 2b. The pages are @helpers/insightsPages.
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

export const selectPanels = (raw: string | undefined) =>
	select(raw, ALL_PANELS, PANEL_MEMBERS);
