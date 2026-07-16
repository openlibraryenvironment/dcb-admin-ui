import { dateTimeRangeOperators } from "@filters/dateTimeRangeOperators";
import { dcbStatusValueOptions } from "@constants/statuses/DCBStatuses";
import { getDcbWorkflowOptions } from "@constants/workflows/DCBWorkflows";
import i18n from "@/i18n";
import { formatDuration } from "@helpers/formatDuration";
import { PatronRequest } from "@models/PatronRequest";
import { GridColDef } from "@mui/x-data-grid-premium";
import dayjs from "dayjs";
import { isOnly } from "@filters/isOnly";
import { containsOnly } from "@filters/containsOnly";
import { equalsOnly } from "@filters/equalsOnly";
import { standardFilters } from "@filters/standardFilters";
import { durationFilters } from "@filters/durationFilters";

export const standardSupplierRequestColumns: GridColDef[] = [
	{
		field: "dateCreated",
		headerName: "Request created",
		minWidth: 150,
		filterOperators: dateTimeRangeOperators,
		type: "dateTime",
		valueGetter: (value: any, row: { dateCreated: string }) => {
			return row.dateCreated ? new Date(row.dateCreated) : null;
		},
		valueFormatter: (value: Date) => {
			return value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "";
		},
	},
	{
		field: "patronHostlmsCode",
		headerName: "Patron library",
		filterable: true, // Should present library options but with the HOST LMS code as a mapping.
		sortable: false,
		type: "singleSelect",
		filterOperators: isOnly,
		flex: 1,
	},
	{
		field: "patronBarcode",
		headerName: "Patron barcode",
		filterable: false,
		sortable: false,
		flex: 0.75,
		valueGetter: (value: string, row: PatronRequest) =>
			row?.requestingIdentity?.localBarcode,
	},
	{
		field: "clusterRecordTitle",
		headerName: "Title",
		minWidth: 100,
		flex: 1.5,
		filterable: false, // Cannot currently filter on nested properties.
		sortable: false,
		valueGetter: (value: string, row: { clusterRecord: { title: string } }) =>
			row?.clusterRecord?.title,
	},
	{
		field: "pickupRequestId",
		headerName: "Pickup request UUID",
		minWidth: 100,
		sortable: true,
		filterable: false,
	},
	{
		field: "pickupRequestStatus",
		headerName: "Pickup request status",
		minWidth: 100,
		sortable: true, // Maybe this shouldn't be filterable. one to check
		type: "singleSelect", // Note - may need to support IS and IS NOT, but not is any of as we have a different way of doing that
		filterOperators: undefined,
		valueOptions: dcbStatusValueOptions,
	},
	{
		field: "canonicalPtype",
		headerName: "DCB canonical patron type",
		minWidth: 100,
		flex: 0.5,
		filterable: false,
		sortable: false,
		valueGetter: (value: string, row: PatronRequest) => {
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
			value: string,
			row: { suppliers: { canonicalItemType: string }[] },
		) => {
			if (row?.suppliers?.length > 0) {
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
		filterOperators: containsOnly, // Should probably still be free text
	},
	{
		field: "outOfSequenceFlag",
		headerName: "Out of sequence", // Should be true/false
		flex: 0.75,
		filterOperators: equalsOnly,
		type: "boolean",
	},
	{
		field: "pollCountForCurrentStatus",
		headerName: "Polling count",
		flex: 0.75,
		filterOperators: equalsOnly, // Should be numeric
		type: "number",
	},
	{
		field: "elapsedTimeInCurrentStatus",
		headerName: "Time in state (days)",
		description:
			"The time the request has been in its current status, in the format dd:hh:mm:ss", // Can we replicate this elsewhere?
		minWidth: 50,
		type: "number",
		filterOperators: durationFilters,
		valueGetter: (
			value: string,
			row: { elapsedTimeInCurrentStatus: number },
		) => {
			return formatDuration(row.elapsedTimeInCurrentStatus);
		},
	},
	{
		field: "isManuallySelectedItem",
		headerName: "Manually selected?",
		flex: 0.75, // true false
		filterOperators: equalsOnly,
		type: "boolean",
	},
	{
		field: "dateUpdated",
		headerName: "Request updated",
		minWidth: 150,
		filterOperators: dateTimeRangeOperators,
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
		headerName: "Description", // free text
		filterOperators: standardFilters,
		flex: 0.5,
	},
	{
		field: "requesterNote",
		headerName: "Requester note", // free text
		filterOperators: standardFilters,
		flex: 0.5,
	},
	{
		field: "id",
		headerName: "Request UUID", // free text
		minWidth: 100,
		flex: 0.5,
		filterOperators: equalsOnly,
	},
	{
		field: "activeWorkflow",
		headerName: "Active workflow", // should have options
		minWidth: 100,
		sortable: true,
		filterable: true,
		type: "singleSelect",
		valueOptions: getDcbWorkflowOptions(i18n.t),
		filterOperators: isOnly,
	},
	{
		field: "isExpeditedCheckout",
		headerName: "Walk-up request?", // true false
		flex: 0.5,
		filterOperators: equalsOnly,
		filterable: true,
		sortable: true,
		type: "boolean",
	},
	{
		field: "renewalCount",
		headerName: "Renewal count",
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
