import { Tab, Tabs } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";

import { handleTabChange } from "@helpers/navigation/handleTabChange";

export type MappingsType = "referenceValue" | "numericRange";
export type MappingCategory = "itemType" | "location" | "patronType" | "all";

// Route base per mapping type; also the URL segment the tabs navigate within.
const BASE: Record<MappingsType, string> = {
	referenceValue: "referenceValueMappings",
	numericRange: "numericRangeMappings",
};

// Categories per type. numericRange deliberately omits "location": there is no
// numericRangeMappings/location route, so the inlined bars that previously
// showed it produced a dead tab.
const CATEGORIES: Record<
	MappingsType,
	ReadonlyArray<{ category: MappingCategory; labelKey: string }>
> = {
	referenceValue: [
		{ category: "itemType", labelKey: "mappings.categories.itemType" },
		{ category: "location", labelKey: "mappings.categories.location" },
		{ category: "patronType", labelKey: "mappings.categories.patronType" },
		{ category: "all", labelKey: "mappings.categories.all" },
	],
	numericRange: [
		{ category: "itemType", labelKey: "mappings.categories.itemType" },
		{ category: "patronType", labelKey: "mappings.categories.patronType" },
		{ category: "all", labelKey: "mappings.categories.all" },
	],
};

interface MappingsSubTabsProps {
	libraryId: string;
	type: MappingsType;
	/** Which category's page is currently showing. */
	activeCategory: MappingCategory;
}

export default function MappingsSubTabs({
	libraryId,
	type,
	activeCategory,
}: MappingsSubTabsProps) {
	const { t } = useTranslation();
	const router = useRouter();

	const pathFor = (category: MappingCategory) =>
		`/libraries/${libraryId}/${BASE[type]}/${category}`;

	return (
		<Tabs
			value={pathFor(activeCategory)}
			onChange={(_event, newValue) => handleTabChange({ newValue, router })}
			sx={{ mb: 2 }}
			aria-label={t("nav.mappings.name")}
		>
			{CATEGORIES[type].map((c) => (
				<Tab
					key={c.category}
					value={pathFor(c.category)}
					label={t(c.labelKey)}
				/>
			))}
		</Tabs>
	);
}
