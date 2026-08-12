import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Grid, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import Loading from "@components/Loading/Loading";
import PageContainer from "@layout/PageContainer/PageContainer";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import DataGrid from "@components/DataGrid/DataGrid";
import PatronRequestTabs from "@components/PatronRequestTabs/PatronRequestTabs";

import { useGraphQLClient } from "@/hooks/useGraphQLClient";
import { useGridState } from "@hooks/useGridState";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { useDynamicPatronRequestColumns } from "@hooks/useDynamicPatronRequestColumns";
import { defaultPatronRequestColumnVisibility } from "@columns/columnVisibility/defaultPatronRequestColumnVisibility";

import { getPatronRequests } from "@queries/getPatronRequests";
import { getPatronRequestsForExport } from "@queries/getPatronRequestsForExport";
import { allLibrariesQuery } from "@/queryOptions/libraries";
import { allLocationsQuery } from "@/queryOptions/locations";
import { patronRequestTotalQuery } from "@/queryOptions/patronRequestTotals";
import { queries } from "@constants/patronRequestGridQueries";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import type { LoadPatronRequestsQueryVariables } from "@generated/graphql";

export const Route = createFileRoute("/__authenticated/patronRequests/active")({
	// Default-state prefetch: the loader has no access to the Zustand grid
	// store (it's not a hook), so it can only prefetch the same defaults the
	// component falls back to on first render - gridId "patronRequestsActive",
	// page 0/size 20, sort by dateCreated desc, no filter.
	loader: ({ context: { queryClient, cfg, auth } }) => {
		// Skip prefetching for unauthenticated visitors - see hostlmss/index.tsx.
		if (!auth?.isAuthenticated) return;
		const gridId = "patronRequestsActive";
		const currentPagination = { page: 0, pageSize: 20 };
		const currentSort = [{ field: "dateCreated", sort: "desc" }];
		const currentFilter = { items: [] };
		return queryClient.ensureQueryData({
			queryKey: [
				"patronRequests",
				gridId,
				currentPagination,
				currentSort,
				currentFilter,
			],
			queryFn: () =>
				createGraphQLClient(cfg, auth).request<
					any,
					LoadPatronRequestsQueryVariables
				>(getPatronRequests, {
					query: queries.inProgress,
					pageno: currentPagination.page,
					pagesize: currentPagination.pageSize,
					order: currentSort[0]?.field ?? "dateCreated",
					orderBy: currentSort[0]?.sort?.toUpperCase() ?? "DESC",
				}),
		});
	},
	component: Active,
});

function Active() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();

	const gridId = "patronRequestsActive";
	const {
		paginationModel: currentPagination,
		sortModel: currentSort,
		filterModel: currentFilter,
		columnVisibilityModel,
		rowModesModel,
		setRowModesModel,
		onPaginationModelChange,
		onSortModelChange,
		onFilterModelChange,
		onColumnVisibilityModelChange: handleColumnVisibilityChange,
	} = useGridState(gridId, {
		pagination: { page: 0, pageSize: 20 },
		sort: [{ field: "dateCreated", sort: "desc" }],
		columnVisibility: defaultPatronRequestColumnVisibility,
	});

	const currentPath = Route.fullPath;

	const { data: patronRequestLocations = [] } = useQuery(
		allLocationsQuery(gqlClient),
	);

	const { data: exceptionTotal = 0, isLoading: exceptionLoading } = useQuery(
		patronRequestTotalQuery(gqlClient, "exception"),
	);
	const { data: outOfSequenceTotal = 0, isLoading: outOfSequenceLoading } =
		useQuery(patronRequestTotalQuery(gqlClient, "outOfSequence"));
	const { data: inProgressTotal = 0, isLoading: inProgressLoading } = useQuery(
		patronRequestTotalQuery(gqlClient, "inProgress"),
	);
	const { data: finishedTotal = 0, isLoading: finishedLoading } = useQuery(
		patronRequestTotalQuery(gqlClient, "finished"),
	);

	const { data: supplyingLibraries, isLoading: supplyingLibrariesLoading } =
		useQuery(allLibrariesQuery(gqlClient));

	const { data: gridData, isLoading: gridLoading } = useQuery({
		queryKey: [
			"patronRequests",
			gridId,
			currentPagination,
			currentSort,
			currentFilter,
		],
		queryFn: () =>
			gqlClient.request<any, LoadPatronRequestsQueryVariables>(
				getPatronRequests,
				buildServerGridQueryVars({
					filterModel: currentFilter,
					sortModel: currentSort,
					paginationModel: currentPagination,
					baseQuery: queries.inProgress,
					defaultOrder: "dateCreated",
					defaultPageSize: 20,
				}),
			),
	});

	// Counts are derived directly from the query data rather than pushed into
	// state via effects. The in-progress tab reflects the (possibly filtered)
	// grid total, and the filter indicator compares it to the unfiltered total.
	const gridTotalSize = gridData?.patronRequests?.totalSize as
		number | undefined;
	const inProgressCount = gridTotalSize ?? inProgressTotal;
	const isFilterApplied =
		gridTotalSize != null ? gridTotalSize < inProgressTotal : false;
	const totalSizes = {
		exception: exceptionTotal,
		outOfSequence: outOfSequenceTotal,
		inProgress: inProgressCount,
		finished: finishedTotal,
		all: exceptionTotal + outOfSequenceTotal + inProgressCount + finishedTotal,
	};

	const customColumns = useCustomColumns();
	const supplyingLibrariesContent = supplyingLibraries?.libraries?.content;
	const dynamicPatronRequestColumns = useDynamicPatronRequestColumns({
		locations: patronRequestLocations,
		libraries: supplyingLibrariesContent,
		variant: "standard",
	});
	const allColumns = useMemo(() => {
		return [...customColumns, ...dynamicPatronRequestColumns];
	}, [customColumns, dynamicPatronRequestColumns]);

	if (supplyingLibrariesLoading) {
		return (
			<PageContainer hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.patronRequests.name").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</PageContainer>
		);
	}

	return (
		<PageContainer title={t("nav.patronRequests.name")}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<PatronRequestTabs
					currentPath={currentPath}
					totalSizes={totalSizes}
					loading={{
						exception: exceptionLoading,
						outOfSequence: outOfSequenceLoading,
						inProgress: inProgressLoading,
						finished: finishedLoading,
					}}
					isFilterApplied={isFilterApplied}
				/>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography
						variant="h3"
						sx={{
							fontWeight: "bold",
						}}
					>
						{t("libraries.patronRequests.active", {
							number: totalSizes.inProgress,
						})}
					</Typography>
					<DataGrid
						autoRowHeight={false}
						rowSelection
						columns={allColumns}
						columnVisibilityModel={columnVisibilityModel}
						onColumnVisibilityModelChange={handleColumnVisibilityChange}
						disableAggregation={true}
						disableHoverInteractions={false}
						disablePivoting={true}
						disableRowGrouping={true}
						exportConfig={{
							query: getPatronRequestsForExport,
							coreType: "patronRequests",
							baseQuery: queries.inProgress,
							quickFilterFields: ["status", "description"],
							wizard: true,
						}}
						filterMode="server"
						filterModel={currentFilter}
						getDetailPanelContent={({ row }: any) => (
							<MasterDetail row={row} type="patronRequests" />
						)}
						identifier={gridId}
						loading={gridLoading}
						listViewEnabled={false}
						noResultsText={t("patron_requests.no_results")}
						onFilterModelChange={onFilterModelChange}
						onPaginationModelChange={onPaginationModelChange}
						onRowModesModelChange={setRowModesModel}
						onSortModelChange={onSortModelChange}
						pagination={true}
						paginationMode="server"
						paginationModel={currentPagination}
						pivotingEnabled={false}
						rowCount={gridData?.patronRequests?.totalSize ?? 0}
						rowModesModel={rowModesModel}
						rows={gridData?.patronRequests?.content ?? []}
						scrollbarVisible={true}
						sortModel={currentSort}
						sortingMode="server"
						toolbarVisible={true}
						searchText=""
						type={"patronRequests"}
					/>
				</Grid>
			</Grid>
		</PageContainer>
	);
}
