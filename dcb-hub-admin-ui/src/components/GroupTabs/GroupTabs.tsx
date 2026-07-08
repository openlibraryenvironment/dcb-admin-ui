import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";
import { Tab, Tabs } from "@mui/material";

import { handleTabChange } from "@helpers/navigation/handleTabChange";

// Single source of truth for the group detail page's tab bar. Each landing
// page passes its own index via `value`; the Tab values are full route paths so
// selection and navigation both flow through the shared handleTabChange, the
// same convention the patron request and library tabs use.
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
	const router = useRouter();

	const pathFor = (path: string) => `/groups/${groupId}${path}`;

	return (
		<Tabs
			value={pathFor(TABS[value].path)}
			onChange={(_event, newValue) => handleTabChange({ newValue, router })}
			variant="scrollable"
			aria-label={t("nav.groups.name")}
		>
			{TABS.map((tab) => (
				<Tab key={tab.path} value={pathFor(tab.path)} label={t(tab.labelKey)} />
			))}
		</Tabs>
	);
}
