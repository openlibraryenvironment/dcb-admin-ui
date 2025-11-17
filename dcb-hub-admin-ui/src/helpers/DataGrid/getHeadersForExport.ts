// These are the header mappings in the export for each field.
// Per type so we have more control over individual field display.
const headerMappings: Record<string, Record<string, string>> = {
	referenceValueMappings: {
		fromContext: "fromContext",
		fromCategory: "fromCategory",
		fromValue: "fromValue",
		toContext: "toContext",
		toCategory: "toCategory",
		toValue: "toValue",
	},
	numericRangeMappings: {
		context: "context",
		domain: "domain",
		lowerBound: "lowerBound",
		upperBound: "upperBound",
		toValue: "toValue",
		toContext: "toContext",
	},
	locations: {
		agencyCode: "Agency Code",
		locationCode: "Location Code",
		name: "Display Name",
		printLabel: "Print name",
		deliveryStops: "DeliveryStop_Ignore",
		latitude: "Lat",
		longitude: "Lon",
		isPickup: "isPickup",
		type: "LOCTYPE",
		chk: "CHK_Ignore",
		address: "Address_Ignore",
		id: "id",
	},
	patronRequests: {
		dateCreated: "Date created",
		patronHostlmsCode: "Patron Host LMS code",
		localBarcode: "Patron barcode",
		clusterRecordTitle: "Title",
		supplyingAgencyCode: "Supplying agency",
		pickupLocationCode: "Pickup location name",
		pickupRequestId: "Pickup request UUID",
		pickupRequestStatus: "Pickup request status",
		pickupItemId: "Pickup item ID",
		canonicalPtype: "DCB Canonical patron type",
		canonicalItemType: "DCB Canonical item type",
		previousStatus: "Previous status",
		status: "Status",
		nextExpectedStatus: "Next expected status",
		errorMessage: "Error message",
		outOfSequenceFlag: "Out of sequence?",
		pollCountForCurrentStatus: "Poll count for current status",
		elapsedTimeInCurrentStatus: "Time in state (days)",
		isManuallySelectedItem: "Is manually selected item?",
		dateUpdated: "Date updated",
		description: "Description",
		requesterNote: "Requester note",
		id: "DCB Patron request UUID",
		activeWorkflow: "Active workflow",
		isExpeditedCheckout: "Walk-up request?",
		itemBarcode: "Item barcode",
		rawLocalItemStatus: "Raw local item status",
		rawLocalRequestStatus: "Raw local request status",
	},
};

export const getHeadersForExport = (
	coreType: string,
	usefulColumns?: string[],
) => {
	const mappings = headerMappings[coreType] || {};
	console.log(usefulColumns);

	// If no usefulColumns are provided, return all headers
	if (!usefulColumns || usefulColumns.length === 0) {
		return Object.values(mappings);
	}

	// Otherwise, return only the headers for the specified columns
	return usefulColumns
		.map((column) => mappings[column])
		.filter((header) => header !== undefined);
};
