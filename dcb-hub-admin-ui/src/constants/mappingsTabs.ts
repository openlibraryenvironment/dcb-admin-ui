export type MappingsType = "referenceValue" | "numericRange";
export type MappingCategory = "itemType" | "location" | "patronType" | "all";

/** Route base per mapping type; also the URL segment the tabs navigate within. */
export const MAPPING_BASE: Record<MappingsType, string> = {
	referenceValue: "referenceValueMappings",
	numericRange: "numericRangeMappings",
};

export interface MappingTab {
	type: MappingsType;
	category: MappingCategory;
	labelKey: string;
}

/**
 * Single source of truth for the library mappings bar, over BOTH mapping types.
 *
 * One bar, not one per type: the numeric range pages have no other entry point, so a bar
 * that shows only the type you are already on leaves them reachable by typed URL alone.
 * That is what happened between the pre-TanStack bar and here, and it took the numeric
 * pages off the UI for every Sierra and Polaris library.
 *
 * Order pairs each reference-value category with its numeric counterpart, as the previous
 * bar did. `numericRange` has no `location` route, so that one pairing is absent.
 */
export const MAPPING_TABS: ReadonlyArray<MappingTab> = [
	{
		type: "referenceValue",
		category: "itemType",
		labelKey: "mappings.item_type_ref_value_short",
	},
	{
		type: "numericRange",
		category: "itemType",
		labelKey: "mappings.item_type_num_range_short",
	},
	{
		type: "referenceValue",
		category: "location",
		labelKey: "mappings.location_ref_value_short",
	},
	{
		type: "referenceValue",
		category: "patronType",
		labelKey: "mappings.patron_type_ref_value_short",
	},
	{
		type: "numericRange",
		category: "patronType",
		labelKey: "mappings.patron_type_num_range_short",
	},
	{
		type: "referenceValue",
		category: "all",
		labelKey: "mappings.all_ref_value_short",
	},
	{
		type: "numericRange",
		category: "all",
		labelKey: "mappings.all_num_range_short",
	},
];

export const mappingTabPath = (
	libraryId: string,
	type: MappingsType,
	category: MappingCategory,
) => `/libraries/${libraryId}/${MAPPING_BASE[type]}/${category}`;
