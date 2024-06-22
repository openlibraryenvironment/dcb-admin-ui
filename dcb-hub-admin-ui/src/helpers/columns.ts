import dayjs from "dayjs";
import { containsOnly, equalsOnly, standardFilters } from "./filters";
import { formatDuration } from "./formatDuration";

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
		valueGetter: (params: { row: { toValue: string } }) => params.row.toValue,
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
		filterOperators: standardFilters,
	},
];

export const standardPatronRequestColumns = [
	{
		field: "dateCreated",
		headerName: "Request created",
		minWidth: 150,
		filterable: false,
		valueGetter: (params: { row: { dateCreated: string } }) => {
			const requestCreated = params.row.dateCreated;
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
		valueGetter: (params: {
			row: { requestingIdentity: { localBarcode: string } };
		}) => params?.row?.requestingIdentity?.localBarcode,
	},
	{
		field: "clusterRecordTitle",
		headerName: "Title",
		minWidth: 100,
		flex: 1.25,
		filterable: false, // Cannot currently filter on nested properties.
		sortable: false,
		valueGetter: (params: { row: { clusterRecord: { title: string } } }) =>
			params?.row?.clusterRecord?.title,
	},
	{
		field: "suppliers",
		headerName: "Supplying agency",
		filterable: false,
		valueGetter: (params: {
			row: { suppliers: Array<{ localAgency: string }> };
		}) => {
			// Check if suppliers array is not empty
			if (params.row.suppliers.length > 0) {
				return params.row.suppliers[0].localAgency;
			} else {
				return ""; // This allows us to handle the array being empty, and any related type errors.
			}
		},
	},
	{
		field: "status",
		headerName: "Status",
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
		valueGetter: (params: { row: { elapsedTimeInCurrentStatus: number } }) =>
			formatDuration(params.row.elapsedTimeInCurrentStatus),
	},
	{
		field: "dateUpdated",
		headerName: "Request updated",
		minWidth: 150,
		filterable: false,
		valueGetter: (params: { row: { dateUpdated: string } }) => {
			const requestUpdated = params.row.dateUpdated;
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
	errorMessage: false,
	outOfSequenceFlag: false,
	dateUpdated: false,
	id: false,
};

export const defaultPatronRequestColumnVisibility = {
	errorMessage: false,
	outOfSequenceFlag: false,
	dateUpdated: false,
	id: false,
};

export const finishedPatronRequestColumnVisibility = {
	elapsedTimeInCurrentStatus: false,
	pollCountForCurrentStatus: false,
	outOfSequenceFlag: false,
};

export const exceptionPatronRequestColumnVisibility = {
	status: false,
	errorMessage: true,
	elapsedTimeInCurrentStatus: false,
	pollCountForCurrentStatus: false,
	outOfSequenceFlag: false,
	dateUpdated: true,
};
