import { GridColumnVisibilityModel } from "@mui/x-data-grid-premium";

export const defaultPatronRequestLibraryColumnVisibility: GridColumnVisibilityModel =
	{
		canonicalItemType: false,
		canonicalPtype: false,
		pickupLocationCode: false,
		patronHostlmsCode: false,
		previousStatus: false,
		nextExpectedStatus: false,
		errorMessage: false,
		outOfSequenceFlag: false,
		isManuallySelectedItem: false,
		dateUpdated: false,
		id: false,
		pickupRequestId: false,
		pickupRequestStatus: false,
		isExpeditedCheckout: false,
		itemBarcode: false,
		localItemStatus: false,
		rawLocalItemStatus: false,
		localItemId: false,
		localItemType: false,
		localRequestStatus: false,
		rawLocalRequestStatus: false,
		localRequestId: false,
		renewalCount: false,
		resolutionCount: false,
	};
