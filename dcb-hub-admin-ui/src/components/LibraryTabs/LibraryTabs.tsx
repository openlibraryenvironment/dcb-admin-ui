import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";
import { Tab, Tabs } from "@mui/material";

import { handleTabChange } from "@helpers/navigation/handleTabChange";

// Single source of truth for the library detail page's primary tab bar. Each
// landing page passes its own index via `value`. Previously every page inlined
// its own copy of this bar, which drifted out of sync (some showed only 3 tabs,
// bibs pointed "Mappings" at a route that doesn't exist). Tab values are full
// route paths so selection and navigation both flow through the shared
// handleTabChange.
const TABS: ReadonlyArray<{ path: string; labelKey: string }> = [
	{ path: "", labelKey: "nav.libraries.profile" }, // Profile (the $libraryId index)
	{ path: "/service", labelKey: "nav.libraries.service" },
	{ path: "/settings", labelKey: "nav.libraries.settings" },
	{ path: "/referenceValueMappings/all", labelKey: "nav.mappings.name" }, // Mappings
	{
		path: "/patronRequests/all",
		labelKey: "nav.libraries.patronRequests.name",
	},
	{
		path: "/supplierRequests/all",
		labelKey: "nav.libraries.supplierRequests.name",
	},
	{ path: "/contacts", labelKey: "nav.libraries.contacts" },
	{ path: "/locations", labelKey: "nav.locations" },
	{ path: "/bibs", labelKey: "nav.bibs" },
	{ path: "/insights", labelKey: "nav.libraries.insights" },
];

interface LibraryTabsProps {
	libraryId: string;
	/** Index into the tab bar for the current page (0 = Profile). */
	value: number;
}

export default function LibraryTabs({ libraryId, value }: LibraryTabsProps) {
	const { t } = useTranslation();
	const router = useRouter();

	const pathFor = (path: string) => `/libraries/${libraryId}${path}`;

	return (
		<Tabs
			value={pathFor(TABS[value].path)}
			onChange={(_event, newValue) => handleTabChange({ newValue, router })}
			variant="scrollable"
		>
			{TABS.map((tab) => (
				<Tab key={tab.path} value={pathFor(tab.path)} label={t(tab.labelKey)} />
			))}
		</Tabs>
	);
}
