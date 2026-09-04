import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";
import { Tab, Tabs } from "@mui/material";

import { handleTabChange } from "@helpers/navigation/handleTabChange";
import { isInsightsEnabled } from "@helpers/featureFlags";
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

	// Insights is gated on a dcb-service release that is not out yet. Hiding it is safe
	// for every page's `value` index because those index the UNFILTERED array above -
	// visibleTabs only decides what renders. That invariant now carries two conditional
	// tabs' worth of weight rather than one, so it is asserted in LibraryTabs.test.tsx.
	const visibleTabs = isInsightsEnabled()
		? TABS
		: TABS.filter((tab) => tab.path !== "/insights");

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
