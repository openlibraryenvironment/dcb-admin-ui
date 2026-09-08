import { dcbStatusValueOptions } from "@constants/statuses/DCBStatuses";
import { containsOnly } from "@filters/containsOnly";
import { durationFilters } from "@filters/durationFilters";
import { equalsOnly } from "@filters/equalsOnly";
import { isOnly } from "@filters/isOnly";
import { luceneDateRangeOperators } from "@filters/luceneDateRangeOperators";
import { standardFilters } from "@filters/standardFilters";
import { formatDuration } from "@helpers/formatDuration";
import { PatronRequest } from "@models/PatronRequest";
import { GridColDef } from "@mui/x-data-grid-premium";
import dayjs from "dayjs";

const getPatronRequestColumns = (
	variant: "standard" | "noStatus",
): GridColDef[] => {
	const isStandard = variant === "standard";

	const columns: GridColDef[] = [
		// The four "where did this request come from / go to" filters lead the
		// column list, so they are the first options in the filter drop-down (which
		// takes its order from this array) rather than buried mid-list.
		{
			field: "patronHostlmsCode",
			headerName: "Patron library",
			filterOperators: isOnly,
			sortable: false,
		},
		{
			field: "supplyingAgencyCode",
			headerName: "Supplying library",
			filterable: true,
			sortable: true,
			flex: 1,
			type: "singleSelect",
			filterOperators: isOnly,
			valueGetter: (value: string, row: PatronRequest) => {
				if (row?.suppliers?.length > 0) {
					return row.suppliers[0].localAgency;
				} else {
					return "";
				}
			},
		},
		{
			field: "pickupLocationCode",
			headerName: "Pickup location",
			type: "singleSelect",
			filterOperators: isOnly,
			sortable: false,
			filterable: true,
		},
		{
			// PatronRequest has no pickup agency/library field - only a pickup
			// location id - so both this column's value and its filter are resolved
			// client-side from the location list. See useDynamicPatronRequestColumns
			// (which supplies valueOptions/valueGetter) and buildFilterQuery (which
			// expands a chosen library into an OR over its location ids).
			field: "pickupLibrary",
			headerName: "Pickup library",
			type: "singleSelect",
			filterOperators: isOnly,
			sortable: false,
			filterable: true,
		},
		{
			field: "dateCreated",
			headerName: "Request created",
			minWidth: 150,
			filterOperators: luceneDateRangeOperators,
			type: "dateTime",
			valueGetter: (value: any, row: { dateCreated: string }) => {
				return row.dateCreated ? new Date(row.dateCreated) : null;
			},
			valueFormatter: (value: Date) => {
				return value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "";
			},
		},
		{
			field: "patronBarcode",
			headerName: "Patron barcode",
			filterable: true,
			filterOperators: equalsOnly,
			sortable: false,
			valueGetter: (value: any, row: PatronRequest) =>
				row?.requestingIdentity?.localBarcode,
		},
		{
			field: "clusterRecordTitle",
			headerName: "Title",
			minWidth: 100,
			flex: 1.25,
			filterable: false,
			sortable: false,
			valueGetter: (value: any, row: { clusterRecord: { title: string } }) =>
				row?.clusterRecord?.title,
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
			// Export-only column (hidden by default) so the export wizard can
			// offer every field the export query returns.
			field: "pickupItemId",
			headerName: "Pickup item ID",
			minWidth: 100,
			sortable: false,
			filterable: false,
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
				if (row?.suppliers?.length > 0) {
					return row.suppliers[0].canonicalItemType;
				} else {
					return "";
				}
			},
		},
		{
			field: "previousStatus",
			headerName: "Previous status",
			minWidth: 100,
			flex: 1.5,
			type: "singleSelect", // Note - may need to support IS and IS NOT, but not is any of as we have a different way of doing that
			filterOperators: undefined,
			valueOptions: dcbStatusValueOptions,
		},
		{
			field: "status",
			headerName: "Status",
			minWidth: 100,
			flex: 1.0,
			type: "singleSelect", // Note - may need to support IS and IS NOT, but not is any of as we have a different way of doing that
			filterOperators: undefined,
			valueOptions: dcbStatusValueOptions,
			filterable: isStandard ? true : false,
		},
		{
			field: "nextExpectedStatus",
			headerName: "Next status",
			minWidth: 100,
			flex: 1.5,
			type: "singleSelect", // Note - may need to support IS and IS NOT, but not is any of as we have a different way of doing that
			filterOperators: undefined,
			valueOptions: dcbStatusValueOptions,
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
			valueGetter: (
				value: any,
				row: { elapsedTimeInCurrentStatus: number },
			) => {
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
			filterOperators: luceneDateRangeOperators,
			type: "dateTime",
			valueGetter: (value: any, row: { dateUpdated: string }) => {
				return row.dateUpdated ? new Date(row.dateUpdated) : null;
			},
			valueFormatter: (value: Date) => {
				return value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "";
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
			// Workflow codes are a closed set (see DCBWorkflows), so the filter offers
			// the readable names rather than asking the user to type "RET-PUA".
			// useDynamicPatronRequestColumns supplies the translated valueOptions.
			field: "activeWorkflow",
			headerName: "Active workflow",
			minWidth: 100,
			sortable: true,
			filterable: true,
			type: "singleSelect",
			filterOperators: isOnly,
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
			field: "renewalCount",
			headerName: "Renewal count",
			flex: 0.5,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
		},
		{
			field: "resolutionCount",
			headerName: "Resolution count",
			flex: 0.5,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
		},
		// Item values
		{
			field: "itemBarcode",
			headerName: "Item barcode",
			filterable: false,
			sortable: false,
			flex: 0.3,
			valueGetter: (value: any, row: PatronRequest) => {
				if (row?.suppliers?.length > 0) {
					return row.suppliers[0].localItemBarcode;
				} else {
					return "";
				}
			},
		},
		{
			field: "localItemStatus",
			headerName: "Local item status",
			flex: 0.3,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
		},
		{
			field: "rawLocalItemStatus",
			headerName: "Raw local item status",
			flex: 0.3,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
		},
		{
			field: "localItemType",
			headerName: "Local item type",
			flex: 0.3,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
			valueGetter: (value: any, row: PatronRequest) => {
				console.log(row);
				return row?.suppliers?.length > 0 ? row.suppliers[0].localItemType : "";
			},
		},
		{
			field: "localItemId",
			headerName: "Local item ID",
			flex: 0.3,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
		},
		// Local requests
		{
			field: "localRequestStatus",
			headerName: "Local request status",
			flex: 0.5,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
		},
		{
			field: "rawLocalRequestStatus",
			headerName: "Raw local request status",
			flex: 0.5,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
		},
		{
			field: "localRequestId",
			headerName: "Local request ID",
			flex: 0.3,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
		},
	];
	return columns;
};

// Used in most scenarios
export const standardPatronRequestColumns: GridColDef[] =
	getPatronRequestColumns("standard");

// Used for "exception" pages where the status is irrelevant as it's always ERROR
export const patronRequestColumnsNoStatusFilter: GridColDef[] =
	getPatronRequestColumns("noStatus");
