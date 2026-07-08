import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";

import { useGridState } from "@hooks/useGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import { getAgencies } from "@queries/getAgencies";
import { standardFilters } from "@filters/standardFilters";
import { equalsOnly } from "@filters/equalsOnly";
import { createGraphQLClient } from "@helpers/createGraphQLClient";

// Default-state prefetch: the component reads pagination/sort/filter state
// from useGridStore (a Zustand store) at mount time, which the loader
// cannot access (it isn't a hook and runs outside React). We can only
// prefetch the grid's own hardcoded default first page/sort here - these
// values must mirror the component's initial useState fallbacks below so
// the cache entry lines up on a fresh (unauthenticated-store) render.
const DEFAULT_PAGINATION_MODEL = { page: 0, pageSize: 10 };
const DEFAULT_SORT_MODEL = [{ field: "name", sort: "asc" }];
const DEFAULT_FILTER_MODEL = { items: [] };

export const Route = createFileRoute("/__authenticated/agencies/")({
	loader: ({ context: { queryClient, cfg, auth } }) => {
		// Skip prefetching for unauthenticated visitors - the request would
		// fail (no token) and its failure would trigger the global
		// network/401 error handler in main.tsx before __authenticated.tsx's
		// own component-level auth-gate redirect to /login ever runs.
		if (!auth?.isAuthenticated) return;
		return queryClient.ensureQueryData({
			queryKey: [
				"agencies",
				DEFAULT_PAGINATION_MODEL,
				DEFAULT_SORT_MODEL,
				DEFAULT_FILTER_MODEL,
			],
			queryFn: () =>
				createGraphQLClient(cfg, auth).request<any>(getAgencies, {
					query: "",
					pageno: DEFAULT_PAGINATION_MODEL.page,
					pagesize: DEFAULT_PAGINATION_MODEL.pageSize,
					order: DEFAULT_SORT_MODEL[0].field,
					orderBy: "ASC",
				}),
		});
	},
	component: AgenciesRouteComponent,
});

function AgenciesRouteComponent() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();

	const gridId = "agencies";

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
		pagination: { page: 0, pageSize: 10 },
		sort: [{ field: "name", sort: "asc" }],
		columnVisibility: {
			id: false,
			latitude: false,
			longitude: false,
		},
	});

	const {
		data: gridData,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: [gridId, paginationModel, sortModel, filterModel],
		queryFn: () =>
			gqlClient.request<any>(
				getAgencies,
				buildServerGridQueryVars({
					filterModel,
					sortModel,
					paginationModel,
					defaultOrder: "name",
					defaultPageSize: 10,
				}),
			),
		placeholderData: (previousData) => previousData,
	});

	const columns = useMemo(
		() => [
			...customColumns,
			{
				field: "name",
				headerName: t("agencies.name", "Agency name"),
				minWidth: 150,
				flex: 0.5,
				filterOperators: standardFilters,
			},
			{
				field: "code",
				headerName: t("agencies.code", "Agency code"),
				minWidth: 50,
				flex: 0.5,
				filterOperators: standardFilters,
			},
			{
				field: "id",
				headerName: t("agencies.uuid", "Agency UUID"),
				minWidth: 100,
				flex: 0.5,
				filterOperators: equalsOnly,
				filterable: false,
			},
			{
				field: "longitude",
				headerName: t("locations.longitude", "Longitude"),
				minWidth: 50,
				flex: 0.5,
				filterOperators: equalsOnly,
			},
			{
				field: "latitude",
				headerName: t("locations.latitude", "Latitude"),
				minWidth: 50,
				flex: 0.5,
				filterOperators: equalsOnly,
				filterable: false,
			},
		],
		[customColumns, t],
	);

	return (
		<PageContainer title={t("nav.agencies")}>
			<DataGrid
				identifier={gridId}
				type="agencies"
				columns={columns}
				rows={gridData?.agencies?.content ?? []}
				rowCount={gridData?.agencies?.totalSize ?? 0}
				loading={isLoading || isFetching}
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
				checkboxSelection={true}
				exportConfig={{
					query: getAgencies,
					coreType: "agencies",
				}}
				disableAggregation
				disableHoverInteractions={false}
				disableRowGrouping
				disablePivoting
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("agencies.no_results")}
				searchText={t("agencies.search_placeholder")}
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
			/>
		</PageContainer>
	);
}
