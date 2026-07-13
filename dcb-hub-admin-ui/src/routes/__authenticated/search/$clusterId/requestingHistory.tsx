import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Grid } from "@mui/material";

import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import Loading from "@components/Loading/Loading";
import ErrorComponent from "@components/Error/Error";

import { useGridState } from "@hooks/useGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { useDynamicPatronRequestColumns } from "@hooks/useDynamicPatronRequestColumns";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import { defaultPatronRequestColumnVisibility } from "@columns/columnVisibility/defaultPatronRequestColumnVisibility";

import { getLibraries } from "@queries/getLibraries";
import { getLocationForPatronRequestGrid } from "@queries/getLocationForPatronRequestGrid";
import { getPatronRequests } from "@queries/getPatronRequests";
import { getPatronRequestsForExport } from "@queries/getPatronRequestsForExport";
import type {
	LoadLibrariesQueryVariables,
	LoadLocationForPrGridQueryVariables,
	LoadPatronRequestsQueryVariables,
} from "@generated/graphql";

export const Route = createFileRoute(
	"/__authenticated/search/$clusterId/requestingHistory",
)({
	component: RequestingHistory,
});

function RequestingHistory() {
	const { t } = useTranslation();
	const { clusterId } = Route.useParams();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();
	const gridId = "patronRequestsRecordHistory";

	const {
		paginationModel,
		sortModel,
		filterModel,
		columnVisibilityModel,
		rowModesModel,
		setRowModesModel,
		onPaginationModelChange: handlePaginationChange,
		onSortModelChange: handleSortChange,
		onFilterModelChange: handleFilterChange,
		onColumnVisibilityModelChange: handleColumnVisibilityChange,
	} = useGridState(gridId, {
		pagination: { page: 0, pageSize: 20 },
		sort: [{ field: "dateCreated", sort: "desc" }],
		columnVisibility: defaultPatronRequestColumnVisibility,
	});

	const { data: librariesData, isLoading: isLibrariesLoading } = useQuery({
		queryKey: ["allLibrariesDictionary"],
		queryFn: () =>
			gqlClient.request<any, LoadLibrariesQueryVariables>(getLibraries, {
				order: "fullName",
				orderBy: "ASC",
				pageno: 0,
				pagesize: 1000,
				query: "",
			}),
		staleTime: 1000 * 60 * 30, // Cache for 30 mins
	});

	const { data: locationsData, isLoading: isLocationsLoading } = useQuery({
		queryKey: ["allLocationsDictionary"],
		queryFn: () =>
			gqlClient.request<any, LoadLocationForPrGridQueryVariables>(
				getLocationForPatronRequestGrid,
				{
					query: "",
					order: "name",
					orderBy: "ASC",
					pagesize: 1000,
					pageno: 0,
				},
			),
		staleTime: 1000 * 60 * 30, // Cache for 30 mins
	});

	const dynamicPatronRequestColumns = useDynamicPatronRequestColumns({
		locations: locationsData?.locations?.content ?? [],
		libraries: librariesData?.libraries?.content ?? [],
		variant: "noStatus",
	});

	const allColumns = useMemo(() => {
		return [...customColumns, ...dynamicPatronRequestColumns];
	}, [customColumns, dynamicPatronRequestColumns]);

	const {
		data: requestsData,
		isLoading: isRequestsLoading,
		isFetching: isRequestsFetching,
		isError,
	} = useQuery({
		queryKey: [gridId, clusterId, paginationModel, sortModel, filterModel],
		queryFn: async () => {
			const baseQuery = `(bibClusterId:${clusterId})`;
			return gqlClient.request<any, LoadPatronRequestsQueryVariables>(
				getPatronRequests,
				buildServerGridQueryVars({
					filterModel,
					sortModel,
					paginationModel,
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
				reload
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
					type={gridId}
					columns={allColumns}
					rows={requestsData?.patronRequests?.content ?? []}
					rowCount={requestsData?.patronRequests?.totalSize ?? 0}
					loading={isRequestsFetching && !!requestsData}
					paginationMode="server"
					pagination
					paginationModel={paginationModel}
					onPaginationModelChange={handlePaginationChange}
					sortingMode="server"
					sortModel={sortModel}
					onSortModelChange={handleSortChange}
					filterMode="server"
					filterModel={filterModel}
					onFilterModelChange={handleFilterChange}
					columnVisibilityModel={columnVisibilityModel}
					onColumnVisibilityModelChange={handleColumnVisibilityChange}
					getDetailPanelContent={({ row }: any) => (
						<MasterDetail row={row} type="patronRequests" />
					)}
					checkboxSelection={true}
					exportConfig={{
						query: getPatronRequestsForExport,
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
