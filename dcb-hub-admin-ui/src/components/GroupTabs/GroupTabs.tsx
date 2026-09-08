import { useTranslation } from "react-i18next";
import { Tabs } from "@mui/material";

import { TabLink } from "@components/TabLink/TabLink";

// Single source of truth for the group detail page's tab bar. Each landing page
// passes its own index via `value`; the tab values are full route paths, which are
// also the hrefs - see TabLink for why these are anchors rather than buttons.
const TABS: ReadonlyArray<{ path: string; labelKey: string }> = [
	{ path: "", labelKey: "nav.groups.profile" },
	{ path: "/patronRequests", labelKey: "nav.groups.patronRequests" },
	{ path: "/supplierRequests", labelKey: "nav.groups.supplierRequests" },
	{ path: "/settings", labelKey: "nav.groups.settings" },
];

interface GroupTabsProps {
	groupId: string;
	/** Index into the tab bar for the current page (0 = Profile). */
	value: number;
}

export default function GroupTabs({ groupId, value }: GroupTabsProps) {
	const { t } = useTranslation();

	const pathFor = (path: string) => `/groups/${groupId}${path}`;

	return (
		<Tabs
			value={pathFor(TABS[value].path)}
			variant="scrollable"
			aria-label={t("nav.groups.name")}
		>
			{TABS.map((tab) => (
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
