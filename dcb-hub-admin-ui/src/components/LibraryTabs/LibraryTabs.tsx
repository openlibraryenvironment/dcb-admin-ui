import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";
import { Tab, Tabs } from "@mui/material";

import { handleTabChange } from "@helpers/navigation/handleTabChange";
import {
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
	const router = useRouter();

	const pathFor = (path: string) => `/libraries/${libraryId}${path}`;

	// Both of these are gated on a dcb-service version, and on DIFFERENT ones: Insights
	// arrived in 9.0.0, account provisioning is only on main and is not in the 9.0.0 tag.
	// Hiding either is safe for every page's `value` index because those index the
	// UNFILTERED array above - hidden only decides what renders. That invariant now
	// carries three conditional tabs' worth of weight, and it is asserted in
	// LibraryTabs.test.ts.
	const hidden = new Set<string>();
	if (!isInsightsEnabled()) hidden.add("/insights");
	if (!isLibraryUserProvisioningEnabled()) hidden.add("/accounts");

	const visibleTabs = TABS.filter((tab) => !hidden.has(tab.path));

	return (
		<Tabs
			value={pathFor(TABS[value].path)}
			onChange={(_event, newValue) => handleTabChange({ newValue, router })}
			variant="scrollable"
		>
			{visibleTabs.map((tab) => (
				<Tab key={tab.path} value={pathFor(tab.path)} label={t(tab.labelKey)} />
			))}
		</Tabs>
	);
}
