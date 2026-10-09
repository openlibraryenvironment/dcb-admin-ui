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

import { allLocationsQuery } from "@/queryOptions/locations";
import { getPatronRequests } from "@queries/getPatronRequests";
import { getPatronRequestsForExport } from "@queries/getPatronRequestsForExport";
import { patronRequestDashboardQuery } from "@/queryOptions/patronRequestDashboard";
import { allLibrariesQuery } from "@/queryOptions/libraries";
import { queries } from "@constants/patronRequestGridQueries";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import type { LoadPatronRequestsQueryVariables } from "@generated/graphql";

export const Route = createFileRoute(
	"/__authenticated/patronRequests/outOfSequence",
)({
	// Default-state prefetch: the loader has no access to the Zustand grid
	// store (it's not a hook), so it can only prefetch the same defaults the
	// component falls back to on first render - gridId
	// "patronRequestsOutOfSequence", page 0/size 20, sort by dateCreated desc,
	// no filter.
	loader: ({ context: { queryClient, cfg, auth } }) => {
		// Skip prefetching for unauthenticated visitors - see hostlmss/index.tsx.
		if (!auth?.isAuthenticated) return;
		const gridId = "patronRequestsOutOfSequence";
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
					query: queries.outOfSequence,
					pageno: currentPagination.page,
					pagesize: currentPagination.pageSize,
					order: currentSort[0]?.field ?? "dateCreated",
					orderBy: currentSort[0]?.sort?.toUpperCase() ?? "DESC",
				}),
		});
	},
	component: OutOfSequence,
});

function OutOfSequence() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();

	const gridId = "patronRequestsOutOfSequence";
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

	const { data: supplyingLibraries, isLoading: supplyingLibrariesLoading } =
		useQuery(allLibrariesQuery(gqlClient));

	// Rows and all four tab counts in ONE request. Four separate
	// LoadPatronRequestTotals used to go out beside this one.
	const {
		data: dashboard,
		isLoading: gridLoading,
		isFetching,
	} = useQuery(
		patronRequestDashboardQuery(gqlClient, {
			gridId,
			baseQuery: queries.outOfSequence,
			paginationModel: currentPagination,
			sortModel: currentSort,
			filterModel: currentFilter,
		}),
	);

	const exceptionTotal = dashboard?.counts.exception ?? 0;
	const outOfSequenceTotal = dashboard?.counts.outOfSequence ?? 0;
	const inProgressTotal = dashboard?.counts.inProgress ?? 0;
	const finishedTotal = dashboard?.counts.finished ?? 0;

	// Counts are derived directly from the query data rather than pushed into
	// state via effects. The out-of-sequence tab reflects the (possibly filtered)
	// grid total, and the filter indicator compares it to the unfiltered total.
	const unfilteredOutOfSequenceCount = outOfSequenceTotal;
	const gridTotalSize = dashboard?.totalSize;
	const outOfSequenceCount = gridTotalSize ?? unfilteredOutOfSequenceCount ?? 0;
	const isFilterApplied =
		gridTotalSize != null && unfilteredOutOfSequenceCount != null
			? gridTotalSize < unfilteredOutOfSequenceCount
			: false;
	const totalSizes = {
		exception: exceptionTotal,
		outOfSequence: outOfSequenceCount,
		inProgress: inProgressTotal,
		finished: finishedTotal,
		all: exceptionTotal + outOfSequenceCount + inProgressTotal + finishedTotal,
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
						exception: gridLoading,
						outOfSequence: gridLoading,
						inProgress: gridLoading,
						finished: gridLoading,
					}}
					isFilterApplied={isFilterApplied}
				/>

				<Grid
					size={{ xs: 4, sm: 8, md: 12 }}
					// The five tabs above all advertise aria-controls for a panel named after
					// their own path, and only all.tsx rendered one - so on this page the
					// reference dangled. axe reports that as aria-valid-attr-value, critical.
					role="tabpanel"
					id={`patron-tabpanel-${currentPath.replace(/\//g, "-")}`}
					aria-labelledby={`patron-tab-${currentPath.replace(/\//g, "-")}`}
				>
					<Typography
						variant="h3"
						sx={{
							fontWeight: "bold",
						}}
					>
						{t("libraries.patronRequests.out_of_sequence", {
							number: totalSizes.outOfSequence,
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
							baseQuery: queries.outOfSequence,
							quickFilterFields: ["status", "description"],
							wizard: true,
						}}
						filterMode="server"
						filterModel={currentFilter}
						getDetailPanelContent={({ row }: any) => (
							<MasterDetail row={row} type="patronRequests" />
						)}
						identifier={gridId}
						loading={gridLoading || isFetching}
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
						rowCount={dashboard?.totalSize ?? 0}
						rowModesModel={rowModesModel}
						rows={dashboard?.rows ?? []}
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
