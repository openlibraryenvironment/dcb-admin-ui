import { isInsightsTrendsEnabled, readSelection } from "@helpers/featureFlags";
import {
	panelsOf,
	selectPanels,
	type InsightsPanel,
	type InsightsSection,
} from "@helpers/insightsSelection";

/** Only Insights code imports this, so the panel vocabulary stays out of what every page loads. */
const insightsPanels = readSelection("VITE_INSIGHTS_PANELS", selectPanels, () =>
	console.warn(
		"VITE_INSIGHTS_PANELS names a panel this app does not have: docs/deployment.md, 2b",
	),
);

// A panel on an endpoint the deployment's dcb-service lacks stays off whatever the list says
const PANEL_CAPABILITY: Partial<Record<InsightsPanel, () => boolean>> = {
	"trends.durationTrend": isInsightsTrendsEnabled,
};

/** An Insights panel this deployment shows: VITE_INSIGHTS_PANELS, within its release flag. */
export const isInsightsPanelShown = (panel: InsightsPanel): boolean =>
	insightsPanels().has(panel) && (PANEL_CAPABILITY[panel]?.() ?? true);

/** A section with no panel shown is not shown, nor its subject's link. */
export const isInsightsSectionShown = (section: InsightsSection): boolean =>
	panelsOf(section).some(isInsightsPanelShown);
