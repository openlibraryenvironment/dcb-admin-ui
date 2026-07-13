export const getEntityText = (
	entity: string,
	entityName?: string,
	gridEdit?: boolean,
): string => {
	switch (entity) {
		case "functionalSetting":
		case "FunctionalSetting":
		case "consortiumFunctionalSettings":
			return "consortium.settings.one";
		case "ReferenceValueMapping":
		case "referencevaluemapping":
			return "mappings.ref_value_one";
		case "NumericRangeMapping":
		case "numericrangemapping":
			return "mappings.num_range_one";
		case "location":
		case "Location":
			if (gridEdit) return "locations.location_one";
			else {
				return entityName ?? "";
			}
		case "library":
			if (gridEdit) return "libraries.library";
			else return entityName ?? "";
		case "person":
		case "Person":
		case "consortiumContact":
			return "libraries.contacts.one";
		default:
			return entity.toLowerCase();
	}
};
