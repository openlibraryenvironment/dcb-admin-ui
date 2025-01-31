export const getHeadersForExport = (coreType: string) => {
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
		case "locations":
			return [
				"Agency Code",
				"Location Code",
				"Display Name",
				"Print Name",
				"DeliveryStop_Ignore",
				"Lat",
				"Lon",
				"isPickup",
				"LOCTYPE",
				"CHK_Ignore",
				"Address_Ignore",
				"id",
			];
		default:
			return [];
	}
};
