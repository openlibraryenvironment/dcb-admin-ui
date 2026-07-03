import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";
import { Tab, Tabs } from "@mui/material";

// Single source of truth for the library detail page's primary tab bar. Each
// landing page passes its own index via `value`. Previously every page inlined
// its own copy of this bar, which drifted out of sync (some showed only 3 tabs,
// bibs pointed "Mappings" at a route that doesn't exist).
const TAB_ROUTES = [
	"", // Profile (the $libraryId index)
	"/service",
	"/settings",
	"/referenceValueMappings/all", // Mappings
	"/patronRequests/all",
	"/supplierRequests/all",
	"/contacts",
	"/locations",
	"/bibs",
] as const;

interface LibraryTabsProps {
	libraryId: string;
	/** Index into the tab bar for the current page (0 = Profile). */
	value: number;
}

export default function LibraryTabs({ libraryId, value }: LibraryTabsProps) {
	const { t } = useTranslation();
	const router = useRouter();

	const handleChange = (_: React.SyntheticEvent, val: number) => {
		router.navigate({ to: `/libraries/${libraryId}${TAB_ROUTES[val]}` });
	};

	return (
		<Tabs value={value} onChange={handleChange} variant="scrollable">
			<Tab label={t("nav.libraries.profile")} />
			<Tab label={t("nav.libraries.service")} />
			<Tab label={t("nav.libraries.settings")} />
			<Tab label={t("nav.mappings.name")} />
			<Tab label={t("nav.libraries.patronRequests.name")} />
			<Tab label={t("nav.libraries.supplierRequests.name")} />
			<Tab label={t("nav.libraries.contacts")} />
			<Tab label={t("nav.locations")} />
			<Tab label={t("nav.bibs")} />
		</Tabs>
	);
}
