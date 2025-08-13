import dayjs from "dayjs";
import {
	containsOnly,
	durationFilters,
	equalsOnly,
	standardFilters,
} from "./filters";
import { formatDuration } from "../formatDuration";
import { PatronRequest } from "@models/PatronRequest";
import {
	GridColDef,
	GridColumnVisibilityModel,
} from "@mui/x-data-grid-premium";

// Handles standard columns so we don't have to re-declare them everywhere

export const standardRefValueMappingColumns: GridColDef[] = [
	{
		field: "fromCategory",
		headerName: "Category",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
	},
	{
		field: "fromContext",
		headerName: "From context",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
	},
	{
		field: "fromValue",
		headerName: "From value",
		minWidth: 50,
		flex: 0.4,
		filterOperators: standardFilters,
	},
	{
		field: "toContext",
		headerName: "To context",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
	},
	{
		field: "toValue",
		headerName: "To value",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
		editable: true,
		valueGetter: (value: any, row: { toValue: any }) => row?.toValue,
	},
	{
		field: "lastImported",
		headerName: "Last imported",
		minWidth: 100,
		flex: 0.5,
		filterOperators: standardFilters,
		valueGetter: (value: any, row: { lastImported: any }) => {
			const lastImported = row.lastImported;
			const formattedDate = dayjs(lastImported).format("YYYY-MM-DD HH:mm");
			if (formattedDate == "Invalid Date") {
				return "";
			} else {
				return formattedDate;
			}
		},
	},
	{
		field: "toCategory",
		headerName: "To category",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
		editable: true,
		valueGetter: (value: any, row: { toCategory: any }) => row?.toCategory,
	},
];

export const refValueMappingColumnsNoCategoryFilter: GridColDef[] = [
	{
		field: "fromCategory",
		headerName: "Category",
		minWidth: 50,
		flex: 0.5,
		filterable: false,
	},
	{
		field: "fromContext",
		headerName: "From context",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
	},
	{
		field: "fromValue",
		headerName: "From value",
		minWidth: 50,
		flex: 0.4,
		filterOperators: standardFilters,
	},
	{
		field: "toContext",
		headerName: "To context",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
	},
	{
		field: "toValue",
		headerName: "To value",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
		editable: true,
		valueGetter: (value: any, row: { toValue: any }) => row?.toValue,
	},
	{
		field: "lastImported",
		headerName: "Last imported",
		minWidth: 100,
		flex: 0.5,
		filterOperators: standardFilters,
		valueGetter: (value: any, row: { lastImported: any }) => {
			const lastImported = row.lastImported;
			const formattedDate = dayjs(lastImported).format("YYYY-MM-DD HH:mm");
			if (formattedDate == "Invalid Date") {
				return "";
			} else {
				return formattedDate;
			}
		},
	},
	{
		field: "toCategory",
		headerName: "To category",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
		editable: true,
		valueGetter: (value: any, row: { toCategory: any }) => row?.toCategory,
	},
];

export const standardNumRangeMappingColumns: GridColDef[] = [
	{
		field: "domain",
		headerName: "Category",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
	},
	{
		field: "context",
		headerName: "From context",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
	},
	{
		field: "lowerBound",
		headerName: "Lower bound",
		minWidth: 50,
		flex: 0.4,
		filterOperators: equalsOnly,
	},
	{
		field: "upperBound",
		headerName: "Upper bound",
		minWidth: 50,
		flex: 0.4,
		filterOperators: equalsOnly,
	},
	{
		field: "targetContext",
		headerName: "To context",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
	},
	{
		field: "mappedValue",
		headerName: "Mapped value",
		minWidth: 50,
		flex: 0.5,
		editable: true,
		filterOperators: standardFilters,
	},
	{
		field: "lastImported",
		headerName: "Last imported",
		minWidth: 100,
		flex: 0.5,
		filterOperators: standardFilters,
		valueGetter: (value: any, row: { lastImported: any }) => {
			const lastImported = row.lastImported;
			const formattedDate = dayjs(lastImported).format("YYYY-MM-DD HH:mm");
			if (formattedDate == "Invalid Date") {
				return "";
			} else {
				return formattedDate;
			}
		},
	},
];

export const numRangeMappingColumnsNoCategoryFilter: GridColDef[] = [
	{
		field: "domain",
		headerName: "Category",
		minWidth: 50,
		flex: 0.5,
		filterable: false,
	},
	{
		field: "context",
		headerName: "From context",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
	},
	{
		field: "lowerBound",
		headerName: "Lower bound",
		minWidth: 50,
		flex: 0.4,
		filterOperators: equalsOnly,
	},
	{
		field: "upperBound",
		headerName: "Upper bound",
		minWidth: 50,
		flex: 0.4,
		filterOperators: equalsOnly,
	},
	{
		field: "targetContext",
		headerName: "To context",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
	},
	{
		field: "mappedValue",
		headerName: "Mapped value",
		minWidth: 50,
		flex: 0.5,
		filterOperators: standardFilters,
		editable: true,
	},
	{
		field: "lastImported",
		headerName: "Last imported",
		minWidth: 100,
		flex: 0.5,
		filterOperators: standardFilters,
		valueGetter: (value: any, row: { lastImported: any }) => {
			const lastImported = row.lastImported;
			const formattedDate = dayjs(lastImported).format("YYYY-MM-DD HH:mm");
			if (formattedDate == "Invalid Date") {
				return "";
			} else {
				return formattedDate;
			}
		},
	},
];

export const standardPatronRequestColumns: GridColDef[] = [
	{
		field: "dateCreated",
		headerName: "Request created",
		minWidth: 150,
		filterable: false,
		valueGetter: (value: any, row: { dateCreated: string }) => {
			const requestCreated = row.dateCreated;
			return dayjs(requestCreated).format("YYYY-MM-DD HH:mm");
		},
	},
	{
		field: "patronHostlmsCode",
		headerName: "Patron host LMS code",
		filterOperators: standardFilters,
	},
	{
		field: "localBarcode",
		headerName: "Patron barcode",
		filterable: false,
		sortable: false,
		valueGetter: (value: any, row: PatronRequest) =>
			row?.requestingIdentity?.localBarcode,
	},
	{
		field: "clusterRecordTitle",
		headerName: "Title",
		minWidth: 100,
		flex: 1.25,
		filterable: false, // Cannot currently filter on nested properties.
		sortable: false,
		valueGetter: (value: any, row: { clusterRecord: { title: string } }) =>
			row?.clusterRecord?.title,
	},
	{
		field: "supplyingAgencyCode",
		headerName: "Supplying agency",
		filterOperators: equalsOnly,
		sortable: false,
		valueGetter: (value: any, row: PatronRequest) => {
			// Check if suppliers array is not empty
			if (row.suppliers.length > 0) {
				return row.suppliers[0].localAgency;
			} else {
				return ""; // This allows us to handle the array being empty, and any related type errors.
			}
		},
	},
	{
		field: "pickupRequestId",
		headerName: "Pickup request UUID",
		minWidth: 100,
		sortable: true,
		filterable: true,
	},
	{
		field: "pickupRequestStatus",
		headerName: "Pickup request status",
		minWidth: 100,
		sortable: true,
		filterable: true,
	},
	{
		field: "canonicalPtype",
		headerName: "DCB canonical patron type",
		minWidth: 100,
		flex: 0.5,
		filterable: false,
		sortable: false,
		valueGetter: (value: any, row: PatronRequest) => {
			const requestingIdentity = row?.requestingIdentity;
			return requestingIdentity?.canonicalPtype ?? "";
		},
	},
	{
		field: "canonicalItemType",
		headerName: "DCB canonical item type",
		minWidth: 100,
		flex: 0.5,
		filterable: false,
		sortable: false,
		valueGetter: (
			value: any,
			row: { suppliers: Array<{ canonicalItemType: string }> },
		) => {
			if (row.suppliers.length > 0) {
				return row.suppliers[0].canonicalItemType;
			} else {
				return ""; // This allows us to handle the array being empty, and any related type errors.
			}
		},
	},
	{
		field: "previousStatus",
		headerName: "Previous status",
		minWidth: 100,
		flex: 1.5,
		filterOperators: standardFilters,
	},
	{
		field: "status",
		headerName: "Status",
		minWidth: 100,
		flex: 1.5,
		filterOperators: standardFilters,
	},
	{
		field: "nextExpectedStatus",
		headerName: "Next status",
		minWidth: 100,
		flex: 1.5,
		filterOperators: standardFilters,
	},
	{
		field: "errorMessage",
		headerName: "Error message",
		minWidth: 100,
		flex: 1.5,
		filterOperators: containsOnly,
	},
	{
		field: "outOfSequenceFlag",
		headerName: "Out of sequence",
		flex: 0.75,
		filterOperators: equalsOnly,
	},
	{
		field: "pollCountForCurrentStatus",
		headerName: "Polling count",
		flex: 0.25,
		filterOperators: equalsOnly,
	},
	{
		field: "elapsedTimeInCurrentStatus",
		headerName: "Time in state (days)",
		description:
			"The time the request has been in its current status, in the format dd:hh:mm:ss",
		minWidth: 50,
		type: "number",
		filterOperators: durationFilters,
		valueGetter: (value: any, row: { elapsedTimeInCurrentStatus: number }) => {
			return formatDuration(row.elapsedTimeInCurrentStatus);
		},
	},
	{
		field: "isManuallySelectedItem",
		headerName: "Manually selected?",
		flex: 0.75,
		filterOperators: equalsOnly,
	},
	{
		field: "dateUpdated",
		headerName: "Request updated",
		minWidth: 150,
		filterable: false,
		valueGetter: (value: any, row: { dateUpdated: string }) => {
			const requestUpdated = row.dateUpdated;
			return dayjs(requestUpdated).format("YYYY-MM-DD HH:mm");
		},
	},
	{
		field: "description",
		headerName: "Description",
		filterOperators: standardFilters,
		flex: 0.5,
	},
	{
		field: "requesterNote",
		headerName: "Requester note",
		filterOperators: standardFilters,
		flex: 0.5,
	},
	{
		field: "id",
		headerName: "Request UUID",
		minWidth: 100,
		flex: 0.5,
		filterOperators: equalsOnly,
	},
	{
		field: "activeWorkflow",
		headerName: "Active workflow",
		minWidth: 100,
		sortable: true,
		filterable: true,
	},
	{
		field: "isExpeditedCheckout",
		headerName: "On-site borrowing request?",
		flex: 0.5,
		filterOperators: equalsOnly,
		filterable: true,
		sortable: true,
	},
	{
		field: "itemBarcode",
		headerName: "Item barcode",
		filterable: false,
		sortable: false,
		flex: 0.3,
		valueGetter: (value: any, row: PatronRequest) => {
			// Check if suppliers array is not empty
			if (row.suppliers.length > 0) {
				return row.suppliers[0].localItemBarcode;
			} else {
				return ""; // This allows us to handle the array being empty, and any related type errors.
			}
		},
	},
];

export const patronRequestColumnsNoStatusFilter: GridColDef[] = [
	{
		field: "dateCreated",
		headerName: "Request created",
		minWidth: 150,
		filterable: false,
		valueGetter: (value: any, row: { dateCreated: string }) => {
			const requestCreated = row.dateCreated;
			return dayjs(requestCreated).format("YYYY-MM-DD HH:mm");
		},
	},
	{
		field: "patronHostlmsCode",
		headerName: "Patron host LMS code",
		filterOperators: standardFilters,
	},
	{
		field: "localBarcode",
		headerName: "Patron barcode",
		filterable: false,
		sortable: false,
		valueGetter: (value: any, row: PatronRequest) =>
			row?.requestingIdentity?.localBarcode,
	},
	{
		field: "clusterRecordTitle",
		headerName: "Title",
		minWidth: 100,
		flex: 1.25,
		filterable: false, // Cannot currently filter on nested properties.
		sortable: false,
		valueGetter: (value: any, row: { clusterRecord: { title: string } }) =>
			row?.clusterRecord?.title,
	},
	{
		field: "supplyingAgency",
		headerName: "Supplying agency",
		filterable: false,
		sortable: false,
		valueGetter: (
			value: any,
			row: { suppliers: Array<{ localAgency: string }> },
		) => {
			// Check if suppliers array is not empty
			if (row.suppliers.length > 0) {
				return row.suppliers[0].localAgency;
			} else {
				return ""; // This allows us to handle the array being empty, and any related type errors.
			}
		},
	},
	{
		field: "pickupRequestId",
		headerName: "Pickup request UUID",
		minWidth: 100,
		sortable: true,
		filterable: true,
	},
	{
		field: "pickupRequestStatus",
		headerName: "Pickup request status",
		minWidth: 100,
		sortable: true,
		filterable: true,
	},
	{
		field: "canonicalPtype",
		headerName: "DCB canonical patron type",
		minWidth: 100,
		flex: 0.5,
		filterable: false,
		sortable: false,
		valueGetter: (value: any, row: PatronRequest) => {
			const requestingIdentity = row?.requestingIdentity;
			return requestingIdentity?.canonicalPtype ?? "";
		},
	},
	{
		field: "canonicalItemType",
		headerName: "DCB canonical item type",
		minWidth: 100,
		flex: 0.5,
		filterable: false,
		sortable: false,
		valueGetter: (
			value: any,
			row: { suppliers: Array<{ canonicalItemType: string }> },
		) => {
			if (row.suppliers.length > 0) {
				return row.suppliers[0].canonicalItemType;
			} else {
				return ""; // This allows us to handle the array being empty, and any related type errors.
			}
		},
	},
	{
		field: "previousStatus",
		headerName: "Previous status",
		minWidth: 100,
		flex: 1.5,
		filterOperators: standardFilters,
	},
	{
		field: "status",
		headerName: "Status",
		minWidth: 100,
		flex: 1.5,
		filterOperators: standardFilters,
		filterable: false,
	},
	{
		field: "nextExpectedStatus",
		headerName: "Next status",
		minWidth: 100,
		flex: 1.5,
		filterOperators: standardFilters,
	},
	{
		field: "errorMessage",
		headerName: "Error message",
		minWidth: 100,
		flex: 1.5,
		filterOperators: containsOnly,
	},
	{
		field: "outOfSequenceFlag",
		headerName: "Out of sequence",
		flex: 0.75,
		filterOperators: equalsOnly,
	},
	{
		field: "pollCountForCurrentStatus",
		headerName: "Polling count",
		flex: 0.25,
		filterOperators: equalsOnly,
	},
	{
		field: "elapsedTimeInCurrentStatus",
		headerName: "Time in state (days)",
		description:
			"The time the request has been in its current status, measured in days",
		minWidth: 50,
		type: "number",
		filterOperators: durationFilters,
		valueGetter: (value: any, row: { elapsedTimeInCurrentStatus: number }) =>
			formatDuration(row.elapsedTimeInCurrentStatus),
	},
	{
		field: "isManuallySelectedItem",
		headerName: "Manually selected?",
		flex: 0.75,
		filterOperators: equalsOnly,
	},
	{
		field: "dateUpdated",
		headerName: "Request updated",
		minWidth: 150,
		filterable: false,
		valueGetter: (value: any, row: { dateUpdated: string }) => {
			const requestUpdated = row.dateUpdated;
			return dayjs(requestUpdated).format("YYYY-MM-DD HH:mm");
		},
	},
	{
		field: "description",
		headerName: "Description",
		filterOperators: standardFilters,
		flex: 0.5,
	},
	{
		field: "requesterNote",
		headerName: "Requester note",
		filterOperators: standardFilters,
		flex: 0.5,
	},
	{
		field: "id",
		headerName: "Request UUID",
		minWidth: 100,
		flex: 0.5,
		filterOperators: equalsOnly,
	},
	{
		field: "activeWorkflow",
		headerName: "Active workflow",
		minWidth: 100,
		sortable: true,
		filterable: true,
	},
	{
		field: "isExpeditedCheckout",
		headerName: "On-site borrowing request?",
		flex: 0.5,
		filterOperators: equalsOnly,
		filterable: true,
		sortable: true,
	},
	{
		field: "itemBarcode",
		headerName: "Item barcode",
		filterable: false,
		sortable: false,
		flex: 0.3,
		valueGetter: (value: any, row: PatronRequest) => {
			// Check if suppliers array is not empty
			if (row.suppliers.length > 0) {
				return row.suppliers[0].localItemBarcode;
			} else {
				return ""; // This allows us to handle the array being empty, and any related type errors.
			}
		},
	},
];

export const supplierRequestColumnsLibrary: GridColDef[] = [
	{
		field: "dateCreated",
		headerName: "Request created",
		minWidth: 150,
		filterable: false,
		valueGetter: (value: any, row: { dateCreated: string }) => {
			const requestCreated = row.dateCreated;
			return dayjs(requestCreated).format("YYYY-MM-DD HH:mm");
		},
	},
	{
		field: "dateUpdated",
		headerName: "Request updated",
		minWidth: 150,
		filterable: false,
		valueGetter: (value: any, row: { dateUpdated: string }) => {
			const requestUpdated = row.dateUpdated;
			return dayjs(requestUpdated).format("YYYY-MM-DD HH:mm");
		},
	},
	{
		field: "canonicalItemType",
		headerName: "DCB canonical item type",
		filterOperators: standardFilters,
		flex: 0.5,
	},
	{
		field: "hostLmsCode",
		headerName: "Host LMS code",
		filterOperators: standardFilters,
		flex: 0.5,
	},
	{
		field: "isActive",
		headerName: "Is active?",
		filterOperators: equalsOnly,
		flex: 0.5,
	},
	{
		field: "localItemId",
		headerName: "Local item ID",
		filterOperators: standardFilters,
		flex: 0.5,
	},
	{
		field: "localBibId",
		headerName: "Local bib ID",
		filterOperators: standardFilters,
		flex: 0.5,
	},
	{
		field: "localStatus",
		headerName: "Local status",
		filterOperators: standardFilters,
		flex: 0.5,
	},
	{
		field: "localAgency",
		headerName: "Local agency",
		filterOperators: standardFilters,
		flex: 0.5,
	},
	{
		field: "rawLocalStatus",
		headerName: "Raw local status",
		filterOperators: standardFilters,
		flex: 0.5,
	},
	{
		field: "description",
		headerName: "Description",
		filterOperators: standardFilters,
		flex: 0.5,
	},
	{
		field: "requesterNote",
		headerName: "Requester note",
		filterOperators: standardFilters,
		flex: 0.5,
	},
	{
		field: "patronRequestId",
		headerName: "Patron request UUID",
		filterable: false,
		groupable: true,
		flex: 0.5,
		valueGetter: (value: any, row: { patronRequest: PatronRequest }) => {
			const id = row?.patronRequest.id;
			return id;
		},
	},
	{
		field: "isExpeditedCheckout",
		headerName: "On-site borrowing request?",
		flex: 0.5,
		valueGetter: (value: any, row: { patronRequest: PatronRequest }) => {
			const isExpeditedCheckout = row?.patronRequest?.isExpeditedCheckout;
			return isExpeditedCheckout;
		},
	},
	{
		field: "itemBarcode",
		headerName: "Item barcode",
		filterable: false,
		sortable: false,
		flex: 0.3,
		valueGetter: (value: any, row: PatronRequest) => {
			// Check if suppliers array is not empty
			if (row.suppliers.length > 0) {
				return row.suppliers[0].localItemBarcode;
			} else {
				return ""; // This allows us to handle the array being empty, and any related type errors.
			}
		},
	},
];

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
	};

export const defaultSupplierRequestLibraryColumnVisibility: GridColumnVisibilityModel =
	{
		canonicalItemType: false,
		canonicalPtype: false,
		pickupLocationCode: false,
		patronHostlmsCode: true,
		previousStatus: false,
		nextExpectedStatus: false,
		errorMessage: false,
		outOfSequenceFlag: false,
		isManuallySelectedItem: false,
		dateUpdated: false,
		id: false,
		suppliers: false,
		pickupRequestId: false,
		pickupRequestStatus: false,
		isExpeditedCheckout: false,
		itemBarcode: false,
	};

export const defaultPatronRequestColumnVisibility: GridColumnVisibilityModel = {
	canonicalItemType: false,
	canonicalPtype: false,
	pickupLocationCode: false,
	previousStatus: false,
	nextExpectedStatus: false,
	errorMessage: false,
	outOfSequenceFlag: false,
	isManuallySelectedItem: false,
	dateUpdated: false,
	id: false,
	description: false,
	requesterNote: false,
	activeWorkflow: false,
	pickupRequestId: false,
	pickupRequestStatus: false,
	isExpeditedCheckout: false,
	itemBarcode: false,
};

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
	};

export const exceptionPatronRequestColumnVisibility = {
	canonicalItemType: false,
	canonicalPtype: false,
	pickupLocationCode: false,
	previousStatus: true,
	status: false,
	errorMessage: true,
	elapsedTimeInCurrentStatus: false,
	pollCountForCurrentStatus: false,
	outOfSequenceFlag: false,
	dateUpdated: true,
	description: false,
	requesterNote: false,
	pickupRequestId: false,
	pickupRequestStatus: false,
	isExpeditedCheckout: false,
	itemBarcode: false,
};

export const locationPatronRequestColumnVisibility = {
	canonicalItemType: false,
	canonicalPtype: false,
	pickupLocationCode: false,
	status: true,
	previousStatus: false,
	nextExpectedStatus: false,
	errorMessage: false,
	elapsedTimeInCurrentStatus: false,
	pollCountForCurrentStatus: false,
	dateUpdated: false,
	dateCreated: true,
	patronHostlmsCode: false,
	suppliers: false,
	id: false,
	outOfSequenceFlag: false,
	isManuallySelectedItem: false,
	description: false,
	requesterNote: false,
	pickupRequestId: false,
	pickupRequestStatus: false,
	isExpeditedCheckout: false,
	itemBarcode: false,
};
