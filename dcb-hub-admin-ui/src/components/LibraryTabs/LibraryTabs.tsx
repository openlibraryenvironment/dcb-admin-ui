import { useTranslation } from "react-i18next";
import { Tabs } from "@mui/material";

import { TabLink } from "@components/TabLink/TabLink";

import {
	isConsortiumBrandingEnabled,
	isInsightsEnabled,
	isLibraryUserProvisioningEnabled,
} from "@helpers/featureFlags";
import { TABS } from "@constants/libraryTabs";

interface LibraryTabsProps {
	libraryId: string;
	/** Index into the tab bar for the current page (0 = Profile). */
	value: number;
}

export default function LibraryTabs({ libraryId, value }: LibraryTabsProps) {
	const { t } = useTranslation();

	const pathFor = (path: string) => `/libraries/${libraryId}${path}`;

	// All three are gated on a dcb-service version, and on DIFFERENT ones: Insights and
	// the brand columns arrived in 9.0.0, account provisioning in 9.1.0. Hiding any is
	// safe for every page's `value` index because those index the UNFILTERED array above
	// - hidden only decides what renders. That invariant now carries three conditional
	// tabs' worth of weight, and it is asserted in LibraryTabs.test.ts.
	const hidden = new Set<string>();
	if (!isInsightsEnabled()) hidden.add("/insights");
	if (!isLibraryUserProvisioningEnabled()) hidden.add("/accounts");
	if (!isConsortiumBrandingEnabled()) hidden.add("/branding");

	const visibleTabs = TABS.filter((tab) => !hidden.has(tab.path));

	return (
		<Tabs value={pathFor(TABS[value].path)} variant="scrollable">
			{visibleTabs.map((tab) => (
				<TabLink
					key={tab.path}
					value={pathFor(tab.path)}
					to={pathFor(tab.path)}
					label={t(tab.labelKey)}
				/>
			))}
		</Tabs>
	);
}
