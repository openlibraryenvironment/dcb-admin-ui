import { useTranslation } from "react-i18next";
import { Tabs } from "@mui/material";

import { TabLink } from "@components/TabLink/TabLink";

import { isInsightsEnabled } from "@helpers/featureFlags";
import { TABS } from "@constants/groupTabs";

interface GroupTabsProps {
	groupId: string;
	/** Index into the tab bar for the current page (0 = Profile). */
	value: number;
}

export default function GroupTabs({ groupId, value }: GroupTabsProps) {
	const { t } = useTranslation();

	const pathFor = (path: string) => `/groups/${groupId}${path}`;

	// Insights arrived in dcb-service 9.0.0, so the tab is hidden against an older
	// server. Hiding it is safe for every page's `value` because those index the
	// UNFILTERED array - hidden only decides what renders.
	const visibleTabs = TABS.filter(
		(tab) => tab.path !== "/insights" || isInsightsEnabled(),
	);

	return (
		<Tabs
			value={pathFor(TABS[value].path)}
			variant="scrollable"
			aria-label={t("nav.groups.name")}
		>
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
