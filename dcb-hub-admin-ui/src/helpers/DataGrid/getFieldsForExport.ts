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
				"mappedValue",
				"targetContext",
			];
		case "locations":
			return [
				"agencyCode",
				"code",
				"name",
				"printLabel",
				"deliveryStops",
				"latitude",
				"longitude",
				"isPickup",
				"type",
				"type",
				"address",
				"localId",
			];
		case "patronRequests":
			return [
				"dateCreated",
				"patronHostlmsCode",
				"localBarcode",
				"clusterRecordTitle",
				"supplyingAgency",
				"pickupLocationCode",
				"pickupRequestId",
				"pickupItemId",
				"pickupRequestStatus",
				"canonicalPtype",
				"canonicalItemType",
				"previousStatus",
				"status",
				"nextExpectedStatus",
				"errorMessage",
				"outOfSequenceFlag",
				"pollCountForCurrentStatus",
				"elapsedTimeInCurrentStatus",
				"isManuallySelectedItem",
				"dateUpdated",
				"description",
				"requesterNote",
				"id",
				"activeWorkflow",
			];
		default:
			return [];
	}
};
