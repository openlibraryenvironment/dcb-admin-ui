export const getFieldsForExport = (coreType: string) => {
	switch (coreType) {
		case "referenceValueMappings":
			return [
				"fromContext",
				"fromCategory",
				"fromValue",
				"toContext",
				"toCategory",
				"toValue",
			];
		case "numericRangeMappings":
			return [
				"context",
				"domain",
				"lowerBound",
				"upperBound",
				"toValue",
				"toContext",
			];
		default:
			return [];
	}
};
