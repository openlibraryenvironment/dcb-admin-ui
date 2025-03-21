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
		case "patronRequests":
			return [
				"Date created",
				"Patron Host LMS code",
				"Patron barcode",
				"Title",
				"Supplying agency",
				"Pickup location name",
				"DCB Canonical patron type",
				"DCB Canonical item type",
				"Previous status",
				"Status",
				"Next expected status",
				"Error message",
				"Out of sequence?",
				"Poll count for current status",
				"Elapsed time in current status",
				"Is manually selected item?",
				"Date updated",
				"DCB Patron request UUID",
			];
		default:
			return [];
	}
};
