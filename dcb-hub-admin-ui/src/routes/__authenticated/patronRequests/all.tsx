import {
	createFileRoute,
	redirect,
	useLocation,
	useSearch,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Typography, Grid } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import type { GridRowModesModel } from "@mui/x-data-grid-premium";

import Loading from "@components/Loading/Loading";
import PageContainer from "@layout/PageContainer/PageContainer";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import PatronRequestTabs from "@components/PatronRequestTabs/PatronRequestTabs";

import { useGraphQLClient } from "@/hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { useDynamicPatronRequestColumns } from "@hooks/useDynamicPatronRequestColumns";

import { allLocationsQuery } from "@/queryOptions/locations";
import { allLibrariesQuery } from "@/queryOptions/libraries";
import { useGridView } from "@hooks/useGridView";
import {
	defaultQueryModels,
	rememberedViewRedirect,
} from "@helpers/viewState/viewRoute";
import DataGrid from "@components/DataGrid/DataGrid";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { patronRequestsAllView } from "@constants/dataGrid/gridViews";
import { constrainToServerOperators } from "@filters/serverFilterOperators";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import { getPatronRequestsForExport } from "@queries/getPatronRequestsForExport";
import { queries } from "@constants/patronRequestGridQueries";
import { composeQuery, drillSearchSchema } from "@helpers/drillSearch";
import ReturnToInsights from "@components/Insights/ReturnToInsights";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { patronRequestDashboardQuery } from "@/queryOptions/patronRequestDashboard";

export const Route = createFileRoute("/__authenticated/patronRequests/all")({
	// An Insights panel can arrive here with a composed filter and the view to
	// return to - see helpers/drillSearch. The grid's own view is beside it.
	validateSearch: (search: Record<string, unknown>) => ({
		...drillSearchSchema.parse(search),
		...validateGridSearch(search),
	}),
	loaderDeps: ({ search }) => search,
	beforeLoad: ({ search, location }) => {
		const restore = rememberedViewRedirect(
			patronRequestsAllView,
			search,
			location.state,
		);
		if (restore) throw redirect({ to: "/patronRequests/all", ...restore });
	},
	loader: ({ context: { queryClient, cfg, auth }, deps, location, cause }) => {
		// Skip prefetching for unauthenticated visitors - see hostlmss/index.tsx.
		if (!auth?.isAuthenticated) return;
		// The reader paging or sorting: the grid is already fetching it, and awaiting it here
		// would hold back the address the grid is waiting on
		if (cause === "stay") return;
		const models = defaultQueryModels(
			patronRequestsAllView,
			deps,
			location.state,
		);
		if (!models) return;
		// Through the same factory as the component, which is the only way the two keys are equal
		return queryClient.ensureQueryData(
			patronRequestDashboardQuery(createGraphQLClient(cfg, auth), {
				gridId: patronRequestsAllView.id,
				baseQuery: composeQuery(queries.all, deps.q),
				...models,
			}),
		);
	},
	component: All,
});

function All() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();

	const gridId = patronRequestsAllView.id;
	const location = useLocation();
	const currentPath = location.pathname;

	// An Insights panel may have sent a filter. It composes with this tab's preset rather
	// than replacing it, and it feeds the EXPORT as well as the grid - "export the
	// evidence" is this page's export button, so the two must not disagree about what
	// the evidence is.
	const search = useSearch({ from: "/__authenticated/patronRequests/all" });
	const { q, from, fromLabel } = search;
	const baseQuery = composeQuery(queries.all, q);
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	// Cached asynchronous lookups configuration
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
	const view = useGridView(patronRequestsAllView, viewColumns, search);

	// Rows and all four tab counts in ONE request, which this route always did -
	// the other four tabs now share the same factory instead of fetching their
	// counts separately.
	const {
		data: dashboard,
		isLoading: gridLoading,
		isFetching,
	} = useQuery(
		patronRequestDashboardQuery(gqlClient, {
			gridId,
			baseQuery,
			paginationModel: view.paginationModel,
			sortModel: view.sortModel,
			filterModel: view.appliedFilterModel,
		}),
	);

	// Deriving layout metrics reactively from server output safely
	const totalSizes = useMemo(
		() => ({
			exception: dashboard?.counts.exception ?? 0,
			outOfSequence: dashboard?.counts.outOfSequence ?? 0,
			inProgress: dashboard?.counts.inProgress ?? 0,
			finished: dashboard?.counts.finished ?? 0,
			// The true total, because this route's rows ARE the "all" bucket. The other
			// four tabs cannot read it this way and sum the four buckets instead.
			all: dashboard?.totalSize ?? 0,
		}),
		[dashboard],
	);

	const isFilterApplied = view.appliedFilterModel.items.length > 0;

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
			<ReturnToInsights from={from} label={fromLabel} />
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
						all: gridLoading,
					}}
					isFilterApplied={isFilterApplied}
				/>

				<Grid
					size={{ xs: 4, sm: 8, md: 12 }}
					role="tabpanel"
					id={`patron-tabpanel-${currentPath.replace(/\//g, "-")}`}
					aria-labelledby={`patron-tab-${currentPath.replace(/\//g, "-")}`}
				>
					<Typography
						variant="h3"
						sx={{
							fontWeight: "bold",
							mb: 2,
						}}
					>
						{t("libraries.patronRequests.all", { number: totalSizes.all })}
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
							baseQuery,
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
