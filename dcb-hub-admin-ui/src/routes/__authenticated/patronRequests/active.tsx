import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Grid, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import type { GridRowModesModel } from "@mui/x-data-grid-premium";

import Loading from "@components/Loading/Loading";
import PageContainer from "@layout/PageContainer/PageContainer";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import DataGrid from "@components/DataGrid/DataGrid";
import PatronRequestTabs from "@components/PatronRequestTabs/PatronRequestTabs";

import { useGraphQLClient } from "@/hooks/useGraphQLClient";
import { useGridView } from "@hooks/useGridView";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { patronRequestsActiveView } from "@constants/dataGrid/gridViews";
import { constrainToServerOperators } from "@filters/serverFilterOperators";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import {
	defaultQueryModels,
	rememberedViewRedirect,
} from "@helpers/viewState/viewRoute";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { useDynamicPatronRequestColumns } from "@hooks/useDynamicPatronRequestColumns";

import { getPatronRequestsForExport } from "@queries/getPatronRequestsForExport";
import { allLibrariesQuery } from "@/queryOptions/libraries";
import { allLocationsQuery } from "@/queryOptions/locations";
import { patronRequestDashboardQuery } from "@/queryOptions/patronRequestDashboard";
import { queries } from "@constants/patronRequestGridQueries";
import { createGraphQLClient } from "@helpers/createGraphQLClient";

export const Route = createFileRoute("/__authenticated/patronRequests/active")({
	validateSearch: validateGridSearch,
	loaderDeps: ({ search }) => search,
	beforeLoad: ({ search, location }) => {
		const restore = rememberedViewRedirect(
			patronRequestsActiveView,
			search,
			location.state,
		);
		if (restore) throw redirect({ to: "/patronRequests/active", ...restore });
	},
	loader: ({ context: { queryClient, cfg, auth }, deps, location, cause }) => {
		// Skip prefetching for unauthenticated visitors - see hostlmss/index.tsx.
		if (!auth?.isAuthenticated) return;
		// The reader paging or sorting: the grid is already fetching it, and awaiting it here
		// would hold back the address the grid is waiting on
		if (cause === "stay") return;
		const models = defaultQueryModels(
			patronRequestsActiveView,
			deps,
			location.state,
		);
		if (!models) return;
		// Through the same factory as the component, which is the only way the two keys are equal
		return queryClient.ensureQueryData(
			patronRequestDashboardQuery(createGraphQLClient(cfg, auth), {
				gridId: patronRequestsActiveView.id,
				baseQuery: queries.inProgress,
				...models,
			}),
		);
	},
	component: Active,
});

function Active() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();

	const gridId = patronRequestsActiveView.id;
	const search = useSearch({ from: "/__authenticated/patronRequests/active" });
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const currentPath = Route.fullPath;

	const { data: patronRequestLocations = [] } = useQuery(
		allLocationsQuery(gqlClient),
	);

	const { data: supplyingLibraries, isLoading: supplyingLibrariesLoading } =
		useQuery(allLibrariesQuery(gqlClient));

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
	// What the filter panel offers, which DataGrid narrows to what the server can answer
	const viewColumns = useMemo(
		() => constrainToServerOperators(allColumns),
		[allColumns],
	);
	const view = useGridView(patronRequestsActiveView, viewColumns, search);

	// Rows and all four tab counts in ONE request. Four separate
	// LoadPatronRequestTotals used to go out beside this one.
	const {
		data: dashboard,
		isLoading: gridLoading,
		isFetching,
	} = useQuery(
		patronRequestDashboardQuery(gqlClient, {
			gridId,
			baseQuery: queries.inProgress,
			paginationModel: view.paginationModel,
			sortModel: view.sortModel,
			filterModel: view.appliedFilterModel,
		}),
	);

	const exceptionTotal = dashboard?.counts.exception ?? 0;
	const outOfSequenceTotal = dashboard?.counts.outOfSequence ?? 0;
	const inProgressTotal = dashboard?.counts.inProgress ?? 0;
	const finishedTotal = dashboard?.counts.finished ?? 0;

	// Counts are derived directly from the query data rather than pushed into
	// state via effects. The in-progress tab reflects the (possibly filtered)
	// grid total, and the filter indicator compares it to the unfiltered total.
	const gridTotalSize = dashboard?.totalSize;
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

	if (supplyingLibrariesLoading) {
		return (
			// The SAME chrome as the loaded branch below, not a bare spinner. These five
			// routes' title and breadcrumbs are static translations, available on the
			// first render - so withholding them only to add them when the data lands
			// inserts 77px above the grid and pushes it down. Measured at 768x1024:
			// 0.069 of layout shift against a 0.05 budget, 0.004 with this.
			<PageContainer title={t("nav.patronRequests.name")}>
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
						{t("libraries.patronRequests.active", {
							number: totalSizes.inProgress,
						})}
					</Typography>
					<DataGrid
						autoRowHeight={false}
						rowSelection
						columns={allColumns}
						columnVisibilityModel={view.columnVisibilityModel}
						onColumnVisibilityModelChange={view.onColumnVisibilityModelChange}
						columnLayout={view.columnLayout}
						disableAggregation={true}
						disableHoverInteractions={false}
						disablePivoting={true}
						disableRowGrouping={true}
						exportConfig={{
							query: getPatronRequestsForExport(),
							coreType: "patronRequests",
							baseQuery: queries.inProgress,
							quickFilterFields: ["status", "description"],
							wizard: true,
						}}
						filterMode="server"
						filterModel={view.filterModel}
						getDetailPanelContent={({ row }: any) => (
							<MasterDetail row={row} type="patronRequests" />
						)}
						identifier={gridId}
						loading={gridLoading || isFetching}
						listViewEnabled={false}
						noResultsText={t("patron_requests.no_results")}
						onFilterModelChange={view.onFilterModelChange}
						onPaginationModelChange={view.onPaginationModelChange}
						onRowModesModelChange={setRowModesModel}
						onSortModelChange={view.onSortModelChange}
						pagination={true}
						paginationMode="server"
						paginationModel={view.paginationModel}
						pivotingEnabled={false}
						rowCount={dashboard?.totalSize ?? 0}
						rowModesModel={rowModesModel}
						rows={dashboard?.rows ?? []}
						scrollbarVisible={true}
						sortModel={view.sortModel}
						sortingMode="server"
						toolbarVisible={true}
						searchText=""
						type={"patronRequests"}
						viewNotice={<GridViewNotice view={view} />}
					/>
				</Grid>
			</Grid>
		</PageContainer>
	);
}
