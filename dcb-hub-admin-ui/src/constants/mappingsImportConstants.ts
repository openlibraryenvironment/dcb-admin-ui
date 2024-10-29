import { MappingOption } from "@models/MappingOption";

export const MAPPING_OPTIONS: Record<string, MappingOption[]> = {
	"Reference value mappings": [
		{ displayKey: "nav.mappings.allReferenceValue", category: "all" },
		{ displayKey: "mappings.item_type_ref_value", category: "ItemType" },
		{ displayKey: "mappings.location_ref_value", category: "Location" },
		{ displayKey: "mappings.patron_type_ref_value", category: "patronType" },
	],
	"Numeric range mappings": [
		{ displayKey: "nav.mappings.allNumericRange", category: "all" },
		{ displayKey: "mappings.item_type_num_range", category: "ItemType" },
		{ displayKey: "mappings.patron_type_num_range", category: "patronType" },
	],
};
