import { GridColumnVisibilityModel } from "@mui/x-data-grid-premium";

export const finishedPatronRequestColumnVisibility: GridColumnVisibilityModel =
	{
		canonicalItemType: false,
		canonicalPtype: false,
		pickupLocationCode: false,
		elapsedTimeInCurrentStatus: false,
		pollCountForCurrentStatus: false,
		outOfSequenceFlag: false,
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
