import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
import { Grid } from "@mui/material";
import type { GridRowModesModel } from "@mui/x-data-grid-premium";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { useGridView } from "@hooks/useGridView";
import { constrainToServerOperators } from "@filters/serverFilterOperators";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import {
	rememberedViewRedirect,
	scopedView,
} from "@helpers/viewState/viewRoute";
import { clusterRequestingHistoryView } from "@constants/dataGrid/gridViews";

import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import Loading from "@components/Loading/Loading";
import ErrorComponent from "@components/Error/Error";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { useDynamicPatronRequestColumns } from "@hooks/useDynamicPatronRequestColumns";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";

import { allLibrariesQuery } from "@/queryOptions/libraries";
import { allLocationsQuery } from "@/queryOptions/locations";
import { getPatronRequests } from "@queries/getPatronRequests";
import { getPatronRequestsForExport } from "@queries/getPatronRequestsForExport";
import type { LoadPatronRequestsQueryVariables } from "@generated/graphql";

export const Route = createFileRoute(
	"/__authenticated/search/$clusterId/requestingHistory",
)({
	validateSearch: validateGridSearch,
	beforeLoad: ({ search, location, params }) => {
		const restore = rememberedViewRedirect(
			scopedView(clusterRequestingHistoryView, params.clusterId),
			search,
			location.state,
		);
		if (restore)
			throw redirect({
				to: "/search/$clusterId/requestingHistory",
				params,
				...restore,
			});
	},
	component: RequestingHistory,
});

function RequestingHistory() {
	const { t } = useTranslation();
	const { clusterId } = Route.useParams();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();
	// The row-click `type` below stays the static `patronRequestsRecordHistory`, so it
	// still matches rowClickRedirects
	const gridView = useMemo(
		() => scopedView(clusterRequestingHistoryView, clusterId),
		[clusterId],
	);
	const gridId = gridView.id;
	const search = useSearch({
		from: "/__authenticated/search/$clusterId/requestingHistory",
	});
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const { data: librariesData, isLoading: isLibrariesLoading } = useQuery({
		...allLibrariesQuery(gqlClient), // Cache for 30 mins
	});

	const { data: locationsData, isLoading: isLocationsLoading } = useQuery(
		allLocationsQuery(gqlClient),
	);

	const dynamicPatronRequestColumns = useDynamicPatronRequestColumns({
		locations: locationsData ?? [],
		libraries: librariesData?.libraries?.content ?? [],
		variant: "noStatus",
	});

	const allColumns = useMemo(() => {
		return [...customColumns, ...dynamicPatronRequestColumns];
	}, [customColumns, dynamicPatronRequestColumns]);
	// What the filter panel offers, which DataGrid narrows to what the server can answer
	const viewColumns = useMemo(
		() => constrainToServerOperators(allColumns),
		[allColumns],
	);
	const view = useGridView(gridView, viewColumns, search);

	const {
		data: requestsData,
		isLoading: isRequestsLoading,
		isFetching: isRequestsFetching,
		isError,
	} = useQuery({
		queryKey: [
			gridId,
			clusterId,
			view.paginationModel,
			view.sortModel,
			view.appliedFilterModel,
		],
		queryFn: async () => {
			const baseQuery = `(bibClusterId:${clusterId})`;
			return gqlClient.request<any, LoadPatronRequestsQueryVariables>(
				getPatronRequests(),
				buildServerGridQueryVars({
					filterModel: view.appliedFilterModel,
					sortModel: view.sortModel,
					paginationModel: view.paginationModel,
					baseQuery,
					quickFilterFields: ["status", "description"],
					defaultOrder: "dateCreated",
					defaultPageSize: 20,
				}),
			);
		},
		enabled: !!clusterId,
		placeholderData: (previousData) => previousData,
	});

	const isLoading =
		isLibrariesLoading ||
		isLocationsLoading ||
		(isRequestsLoading && !requestsData);

	if (isLoading) {
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("nav.patronRequests.name").toLowerCase(),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);
	}

	if (isError) {
		return (
			<ErrorComponent
				title={t("ui.error.cannot_retrieve_record")}
				message={t("ui.info.connection_issue")}
				action={t("ui.actions.reload")}
				onAction={() => location.reload()}
			/>
		);
	}

	return (
		<Grid
			container
			spacing={{ xs: 2, md: 3 }}
			columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
		>
			<Grid size={{ xs: 4, sm: 8, md: 12 }}>
				<DataGrid
					identifier={gridId}
					type="patronRequestsRecordHistory"
					columns={allColumns}
					viewNotice={<GridViewNotice view={view} />}
					rows={requestsData?.patronRequests?.content ?? []}
					rowCount={requestsData?.patronRequests?.totalSize ?? 0}
					loading={isRequestsFetching && !!requestsData}
					paginationMode="server"
					pagination
					paginationModel={view.paginationModel}
					onPaginationModelChange={view.onPaginationModelChange}
					sortingMode="server"
					sortModel={view.sortModel}
					onSortModelChange={view.onSortModelChange}
					filterMode="server"
					filterModel={view.filterModel}
					onFilterModelChange={view.onFilterModelChange}
					columnVisibilityModel={view.columnVisibilityModel}
					onColumnVisibilityModelChange={view.onColumnVisibilityModelChange}
					columnLayout={view.columnLayout}
					getDetailPanelContent={({ row }: any) => (
						<MasterDetail row={row} type="patronRequests" />
					)}
					rowSelection
					exportConfig={{
						query: getPatronRequestsForExport(),
						coreType: "patronRequests",
						baseQuery: `(bibClusterId:${clusterId})`,
						quickFilterFields: ["status", "description"],
						wizard: true,
					}}
					disableAggregation
					disableHoverInteractions={false}
					disableRowGrouping
					disablePivoting
					listViewEnabled={false}
					pivotingEnabled={false}
					toolbarVisible
					scrollbarVisible
					rowModesModel={rowModesModel}
					onRowModesModelChange={setRowModesModel}
					noResultsText={t("patron_requests.no_results")}
					searchText={t("patron_requests.search_placeholder_error_message")}
				/>
			</Grid>
		</Grid>
	);
}
