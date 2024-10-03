import dayjs from "dayjs";
import { containsOnly, equalsOnly, standardFilters } from "./filters";
import { formatDuration } from "./formatDuration";
import { PatronRequest } from "@models/PatronRequest";

// Handles standard columns so we don't have to re-declare them everywhere

export const standardRefValueMappingColumns = [
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
		field: "last_imported",
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

export const refValueMappingColumnsNoCategoryFilter = [
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
		field: "last_imported",
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

export const standardNumRangeMappingColumns = [
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
		field: "last_imported",
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

export const numRangeMappingColumnsNoCategoryFilter = [
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
		field: "last_imported",
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

export const standardPatronRequestColumns = [
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
		field: "suppliers",
		headerName: "Supplying agency",
		filterable: false,
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
		headerName: "Time in state",
		minWidth: 50,
		filterOperators: equalsOnly,
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
		field: "id",
		headerName: "Request UUID",
		minWidth: 100,
		flex: 0.5,
		filterOperators: equalsOnly,
	},
];

export const patronRequestColumnsNoStatusFilter = [
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
		field: "suppliers",
		headerName: "Supplying agency",
		filterable: false,
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
		headerName: "Time in state",
		minWidth: 50,
		filterOperators: equalsOnly,
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
		field: "id",
		headerName: "Request UUID",
		minWidth: 100,
		flex: 0.5,
		filterOperators: equalsOnly,
	},
];

export const defaultPatronRequestLibraryColumnVisibility = {
	patronHostlmsCode: false,
	previousStatus: false,
	nextExpectedStatus: false,
	errorMessage: false,
	outOfSequenceFlag: false,
	isManuallySelectedItem: false,
	dateUpdated: false,
	id: false,
};

export const defaultPatronRequestColumnVisibility = {
	previousStatus: false,
	nextExpectedStatus: false,
	errorMessage: false,
	outOfSequenceFlag: false,
	isManuallySelectedItem: false,
	dateUpdated: false,
	id: false,
};

export const finishedPatronRequestColumnVisibility = {
	elapsedTimeInCurrentStatus: false,
	pollCountForCurrentStatus: false,
	outOfSequenceFlag: false,
};

export const exceptionPatronRequestColumnVisibility = {
	previousStatus: true,
	status: false,
	errorMessage: true,
	elapsedTimeInCurrentStatus: false,
	pollCountForCurrentStatus: false,
	outOfSequenceFlag: false,
	dateUpdated: true,
};

export const locationPatronRequestColumnVisibility = {
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
};
