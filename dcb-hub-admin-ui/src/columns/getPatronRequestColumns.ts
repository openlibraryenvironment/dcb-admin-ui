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
import type { TFunction } from "i18next";
import { placedBy } from "@helpers/placedBy";
import dayjs from "dayjs";

export const getPatronRequestColumns = (
	variant: "standard" | "noStatus",
	t: TFunction,
): GridColDef[] => {
	const isStandard = variant === "standard";

	const columns: GridColDef[] = [
		// The four "where did this request come from / go to" filters lead the
		// column list, so they are the first options in the filter drop-down (which
		// takes its order from this array) rather than buried mid-list.
		{
			field: "patronHostlmsCode",
			headerName: t("patron_request.columns.patronHostlmsCode"),
			filterOperators: isOnly,
			sortable: false,
		},
		{
			field: "supplyingAgencyCode",
			headerName: t("patron_request.columns.supplyingAgencyCode"),
			filterable: true,
			// Filter-only: dcb-service resolves it through a join, and cannot ORDER BY it
			sortable: false,
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
			headerName: t("patron_request.columns.pickupLocationCode"),
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
			headerName: t("patron_request.columns.pickupLibrary"),
			type: "singleSelect",
			filterOperators: isOnly,
			sortable: false,
			filterable: true,
		},
		{
			field: "dateCreated",
			headerName: t("patron_request.columns.dateCreated"),
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
			headerName: t("patron_request.columns.patronBarcode"),
			filterable: true,
			filterOperators: equalsOnly,
			sortable: false,
			valueGetter: (value: any, row: PatronRequest) =>
				row?.requestingIdentity?.localBarcode,
		},
		{
			field: "clusterRecordTitle",
			headerName: t("patron_request.columns.clusterRecordTitle"),
			minWidth: 100,
			flex: 1.25,
			filterable: false,
			sortable: false,
			valueGetter: (value: any, row: { clusterRecord: { title: string } }) =>
				row?.clusterRecord?.title,
		},
		{
			field: "pickupRequestId",
			headerName: t("patron_request.columns.pickupRequestId"),
			minWidth: 100,
			sortable: true,
			filterable: true,
		},
		{
			field: "pickupRequestStatus",
			headerName: t("patron_request.columns.pickupRequestStatus"),
			minWidth: 100,
			sortable: true,
			filterable: true,
		},
		{
			// Export-only column (hidden by default) so the export wizard can
			// offer every field the export query returns.
			field: "pickupItemId",
			headerName: t("patron_request.columns.pickupItemId"),
			minWidth: 100,
			sortable: false,
			filterable: false,
		},
		{
			field: "canonicalPtype",
			headerName: t("patron_request.columns.canonicalPtype"),
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
			headerName: t("patron_request.columns.canonicalItemType"),
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
			headerName: t("patron_request.columns.previousStatus"),
			minWidth: 100,
			flex: 1.5,
			type: "singleSelect", // Note - may need to support IS and IS NOT, but not is any of as we have a different way of doing that
			filterOperators: undefined,
			valueOptions: dcbStatusValueOptions,
		},
		{
			field: "status",
			headerName: t("patron_request.columns.status"),
			minWidth: 100,
			flex: 1.0,
			type: "singleSelect", // Note - may need to support IS and IS NOT, but not is any of as we have a different way of doing that
			filterOperators: undefined,
			valueOptions: dcbStatusValueOptions,
			filterable: isStandard ? true : false,
		},
		{
			field: "nextExpectedStatus",
			headerName: t("patron_request.columns.nextExpectedStatus"),
			minWidth: 100,
			flex: 1.5,
			type: "singleSelect", // Note - may need to support IS and IS NOT, but not is any of as we have a different way of doing that
			filterOperators: undefined,
			valueOptions: dcbStatusValueOptions,
		},
		{
			field: "errorMessage",
			headerName: t("patron_request.columns.errorMessage"),
			minWidth: 100,
			flex: 1.5,
			filterOperators: containsOnly,
		},
		{
			field: "outOfSequenceFlag",
			headerName: t("patron_request.columns.outOfSequenceFlag"),
			flex: 0.75,
			filterOperators: equalsOnly,
		},
		{
			field: "pollCountForCurrentStatus",
			headerName: t("patron_request.columns.pollCountForCurrentStatus"),
			flex: 0.25,
			filterOperators: equalsOnly,
		},
		{
			field: "elapsedTimeInCurrentStatus",
			headerName: t("patron_request.columns.elapsedTimeInCurrentStatus"),
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
			headerName: t("patron_request.columns.isManuallySelectedItem"),
			flex: 0.75,
			filterOperators: equalsOnly,
		},
		{
			field: "dateUpdated",
			headerName: t("patron_request.columns.dateUpdated"),
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
			headerName: t("patron_request.columns.description"),
			filterOperators: standardFilters,
			flex: 0.5,
		},
		{
			field: "requesterNote",
			headerName: t("patron_request.columns.requesterNote"),
			filterOperators: standardFilters,
			flex: 0.5,
		},
		{
			field: "id",
			headerName: t("patron_request.columns.id"),
			minWidth: 100,
			flex: 0.5,
			filterOperators: equalsOnly,
		},
		{
			// Workflow codes are a closed set (see DCBWorkflows), so the filter offers
			// the readable names rather than asking the user to type "RET-PUA".
			// useDynamicPatronRequestColumns supplies the translated valueOptions.
			field: "activeWorkflow",
			headerName: t("patron_request.columns.activeWorkflow"),
			minWidth: 100,
			sortable: true,
			filterable: true,
			type: "singleSelect",
			filterOperators: isOnly,
		},
		{
			field: "isExpeditedCheckout",
			headerName: t("patron_request.columns.isExpeditedCheckout"),
			flex: 0.5,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
		},
		{
			field: "renewalCount",
			headerName: t("patron_request.columns.renewalCount"),
			flex: 0.5,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
		},
		{
			field: "resolutionCount",
			headerName: t("patron_request.columns.resolutionCount"),
			flex: 0.5,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
		},
		// Item values
		{
			field: "itemBarcode",
			headerName: t("patron_request.columns.itemBarcode"),
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
			headerName: t("patron_request.columns.localItemStatus"),
			flex: 0.3,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
		},
		{
			field: "rawLocalItemStatus",
			headerName: t("patron_request.columns.rawLocalItemStatus"),
			flex: 0.3,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
		},
		{
			field: "localItemType",
			headerName: t("patron_request.columns.localItemType"),
			flex: 0.3,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
		},
		{
			field: "localItemId",
			headerName: t("patron_request.columns.localItemId"),
			flex: 0.3,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
		},
		// Local requests
		{
			field: "localRequestStatus",
			headerName: t("patron_request.columns.localRequestStatus"),
			flex: 0.5,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
		},
		{
			field: "rawLocalRequestStatus",
			headerName: t("patron_request.columns.rawLocalRequestStatus"),
			flex: 0.5,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
		},
		{
			field: "localRequestId",
			headerName: t("patron_request.columns.localRequestId"),
			flex: 0.3,
			filterOperators: equalsOnly,
			filterable: true,
			sortable: true,
		},
	];
	return columns;
};

/** Added by useDynamicPatronRequestColumns while VITE_FEATURE_PLACED_BY_STAFF is on. */
export const placedByStaffColumn = (t: TFunction): GridColDef => ({
	field: "placedByStaff",
	headerName: t("patron_request.placed_by.title"),
	flex: 0.4,
	// Not offered until dcb-service is shown to filter and sort on it
	filterable: false,
	sortable: false,
	valueGetter: (value: boolean | null | undefined) =>
		t(`patron_request.placed_by.${placedBy(value)}`),
});
