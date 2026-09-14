import { Tabs } from "@mui/material";
import { useTranslation } from "react-i18next";

import { TabLink } from "@components/TabLink/TabLink";
import {
	MAPPING_TABS,
	mappingTabPath,
	type MappingCategory,
	type MappingsType,
} from "@constants/mappingsTabs";

export type { MappingCategory, MappingsType };

interface MappingsSubTabsProps {
	libraryId: string;
	/** Which mapping type's page is currently showing. */
	activeType: MappingsType;
	/** Which category's page is currently showing. */
	activeCategory: MappingCategory;
	/**
	 * Whether this library's ILS uses numeric range mappings at all — Sierra and
	 * Polaris do, nothing else does. Pass `requiresNumericRangeMappings(library)`.
	 */
	includeNumericRange: boolean;
}

export default function MappingsSubTabs({
	libraryId,
	activeType,
	activeCategory,
	includeNumericRange,
}: MappingsSubTabsProps) {
	const { t } = useTranslation();

	// Showing the numeric tabs whenever one of them is the open page keeps `value` in the
	// rendered set. MUI selects nothing and logs when `value` matches no tab, which is
	// what a typed numeric URL on a FOLIO or Alma library would otherwise produce.
	const showNumericRange = includeNumericRange || activeType === "numericRange";

	const visibleTabs = MAPPING_TABS.filter(
		(tab) => showNumericRange || tab.type !== "numericRange",
	);

	return (
		<Tabs
			value={mappingTabPath(libraryId, activeType, activeCategory)}
			sx={{ mb: 2 }}
			variant="scrollable"
			aria-label={t("nav.mappings.name")}
		>
			{visibleTabs.map((tab) => (
				<TabLink
					key={`${tab.type}-${tab.category}`}
					value={mappingTabPath(libraryId, tab.type, tab.category)}
					to={mappingTabPath(libraryId, tab.type, tab.category)}
					label={t(tab.labelKey)}
				/>
			))}
		</Tabs>
	);
}
