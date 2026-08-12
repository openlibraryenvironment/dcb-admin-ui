import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import dayjs from "dayjs";
import { Grid, Typography, useTheme } from "@mui/material";
import { Delete } from "@mui/icons-material";
import { GridColDef, GridSortModel } from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import LibraryTabs from "@components/LibraryTabs/LibraryTabs";
import DataGrid from "@components/DataGrid/DataGrid";
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";
import Loading from "@components/Loading/Loading";
import ErrorComponent from "@components/Error/Error";

import { useGridState } from "@hooks/useGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useEntityMutation } from "@hooks/useEntityMutation";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";

import { libraryBasicsQuery } from "@/queryOptions/library";
import { getBibs } from "@queries/getBibs";
import { standardFilters } from "@filters/standardFilters";
import { equalsOnly } from "@filters/equalsOnly";
import { luceneDateRangeOperators } from "@filters/luceneDateRangeOperators";
import { libraryBibColumnVisibility } from "@columns/columnVisibility/libraryBibColumnVisibility";
import type { LoadBibsQueryVariables } from "@generated/graphql";

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/bibs/",
)({
	component: LibraryBibs,
});

// Bibs are not user-sortable: server order is fixed to sourceRecordId asc. This
// model MUST be a stable reference. MUI's useGridSorting effect re-applies the
// controlled sortModel on every render whose reference changes, which publishes
// a sortModelChange event that resets pagination to page 0. An inline array
// literal (a new reference each render) therefore snapped the grid back to the
// first page the instant the user paged. Hoisting it makes the reference constant.
const BIB_SORT_MODEL: GridSortModel = [
	{ field: "sourceRecordId", sort: "asc" },
];
const NO_OP = () => {};
const NO_ROW_MODES = {};

function LibraryBibs() {
	const { t } = useTranslation();
	const { libraryId } = Route.useParams();
	const theme = useTheme();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const libraryMutation = useEntityMutation("library");
	// Scope the persisted grid state (pagination / filter / column visibility) to
	// THIS library. With a static id the sessionStorage-backed store leaked a
	// page number or filter from one library into the next, so a library with
	// records rendered empty until the user cleared storage. See useDataGridStore.
	const gridId = `libraryBibs-${libraryId}`;

	const {
		paginationModel,
		filterModel,
		columnVisibilityModel,
		onPaginationModelChange: handlePaginationChange,
		onFilterModelChange: handleFilterChange,
		onColumnVisibilityModelChange: handleColumnVisibilityChange,
	} = useGridState(gridId, {
		pagination: { page: 0, pageSize: 20 },
		columnVisibility: libraryBibColumnVisibility,
	});

	const {
		data: library,
		isLoading: isLibraryLoading,
		isError: isLibraryError,
	} = useQuery(libraryBasicsQuery(gqlClient, libraryId, "basics"));

	// A library's bibs live under its host LMS(es). Gate and query on ANY host
	// LMS id present - the old code keyed solely off the primary agency hostLms,
	// so a library whose records sit under a secondHostLms (or whose primary id
	// was momentarily absent) built a malformed `sourceSystemId: undefined`
	// query and never fetched, rendering an empty grid.
	const hostLmsIds = [
		library?.agency?.hostLms?.id,
		library?.secondHostLms?.id,
	].filter(Boolean);

	const presetQueryVariables = hostLmsIds
		.map((id) => `sourceSystemId: ${id}`)
		.join(" OR ");

	const {
		data: gridData,
		isLoading: isGridLoading,
		isFetching,
	} = useQuery({
		queryKey: [gridId, presetQueryVariables, paginationModel, filterModel],
		queryFn: async () => {
			return gqlClient.request<any, LoadBibsQueryVariables>(
				getBibs,
				buildServerGridQueryVars({
					filterModel,
					sortModel: BIB_SORT_MODEL,
					paginationModel,
					baseQuery: presetQueryVariables,
					defaultOrder: "sourceRecordId",
					defaultPageSize: 20,
				}),
			);
		},
		enabled: hostLmsIds.length > 0,
		placeholderData: (previousData) => previousData,
	});

	const columns: GridColDef[] = useMemo(
		() => [
			...customColumns.map((col) => ({ ...col, sortable: false })), // Enforce no sorting on custom columns too
			{
				field: "title",
				headerName: t("search.title"),
				minWidth: 150,
				flex: 0.6,
				sortable: false,
				filterOperators: standardFilters,
			},
			{
				field: "clusterRecordId",
				headerName: t("patron_request.cluster_record_uuid"),
				minWidth: 50,
				flex: 0.5,
				sortable: false,
				filterOperators: equalsOnly,
				filterable: false,
				valueGetter: (val, row: any) => row?.contributesTo?.id,
			},
			{
				field: "sourceRecordId",
				headerName: t("bibRecords.source_record_id"),
				minWidth: 50,
				sortable: false,
				filterOperators: standardFilters,
				flex: 0.5,
			},
			{
				field: "sourceSystemId",
				headerName: t("bibRecords.source_system_uuid"),
				minWidth: 50,
				sortable: false,
				filterOperators: equalsOnly,
				flex: 0.5,
			},
			{
				field: "id",
				headerName: t("bibRecords.source_bib_uuid"),
				minWidth: 100,
				flex: 0.5,
				sortable: false,
				filterOperators: equalsOnly,
			},
			{
				field: "processVersion",
				headerName: t("bibRecords.process_version"),
				minWidth: 100,
				flex: 0.5,
				sortable: false,
				filterOperators: equalsOnly,
			},
			{
				field: "dateUpdated",
				headerName: t("ui.info.date_updated"),
				minWidth: 100,
				flex: 0.5,
				sortable: false,
				filterOperators: luceneDateRangeOperators,
				type: "dateTime",
				valueGetter: (val, row: any) =>
					row.dateUpdated ? new Date(row.dateUpdated) : null,
				valueFormatter: (val: Date) =>
					val ? dayjs(val).format("YYYY-MM-DD HH:mm") : "",
			},
		],
		[customColumns, t],
	);

	if (isLibraryLoading)
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("nav.bibs").toLowerCase(),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);
	if (isLibraryError || !library)
		return (
			<ErrorComponent
				title={t("ui.error.cannot_retrieve_record")}
				action={t("ui.actions.go_back")}
				goBack="/libraries"
				message={t("ui.error.invalid_UUID")}
			/>
		);

	return (
		<PageContainer
			title={library.fullName}
			docLink="https://openlibraryfoundation.atlassian.net/wiki/x/GgAnyg"
			subtitle={t("ui.reference.catalog_build")}
			pageActions={[
				libraryMutation.buildDeleteAction({
					id: libraryId,
					name: library?.fullName,
					redirect: "/libraries",
					disabled: !isAnAdmin,
					icon: <Delete htmlColor={theme.palette.primary.exclamationIcon} />,
				}),
			]}
		>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<LibraryTabs libraryId={libraryId} value={8} />
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography
						variant="h2"
						sx={{
							fontWeight: "bold",
							mb: 2,
						}}
					>
						{t("nav.bibs")}
					</Typography>

					<DataGrid
						identifier={gridId}
						type="bibs"
						columns={columns}
						rows={gridData?.sourceBibs?.content ?? []}
						rowCount={gridData?.sourceBibs?.totalSize ?? 0}
						loading={isGridLoading || isFetching}
						paginationMode="server"
						pagination
						paginationModel={paginationModel}
						onPaginationModelChange={handlePaginationChange}
						sortingMode="server"
						sortModel={BIB_SORT_MODEL} // Stable ref: see note by BIB_SORT_MODEL
						onSortModelChange={NO_OP} // Disabled intentionally
						filterMode="server"
						filterModel={filterModel}
						onFilterModelChange={handleFilterChange}
						columnVisibilityModel={columnVisibilityModel}
						onColumnVisibilityModelChange={handleColumnVisibilityChange}
						exportConfig={{
							query: getBibs,
							coreType: "sourceBibs",
							baseQuery: presetQueryVariables,
						}}
						disableAggregation
						disableRowGrouping
						disableHoverInteractions={false}
						disablePivoting={true}
						rowModesModel={NO_ROW_MODES} // No inline editing on bibs (stable ref)
						listViewEnabled={false}
						pivotingEnabled={false}
						toolbarVisible
						scrollbarVisible={false}
						noResultsText={t("bibRecords.no_results")}
						searchText={t("bibRecords.search_placeholder")}
					/>
				</Grid>
			</Grid>
			<EntityMutationDialogs {...libraryMutation.dialogProps} />
		</PageContainer>
	);
}
