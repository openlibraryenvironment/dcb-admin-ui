import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { GridColDef } from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";

import { useGridState } from "@hooks/useGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";

import { getHostLms } from "@queries/getHostLms";
import { standardFilters } from "@filters/standardFilters";
import { equalsOnly } from "@filters/equalsOnly";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import type { LoadHostLmsQueryVariables } from "@generated/graphql";

export const Route = createFileRoute("/__authenticated/hostlmss/")({
	// Default-state prefetch: the loader has no access to the Zustand grid
	// store (it's not a hook), so it can only prefetch the same defaults the
	// component falls back to on first render (no stored state yet) -
	// gridId "hostlmss", page 0/size 10, sort by name asc, no filter.
	loader: ({ context: { queryClient, cfg, auth } }) => {
		// Skip prefetching for unauthenticated visitors - see hostlmss/index.tsx.
		if (!auth?.isAuthenticated) return;
		const gridId = "hostlmss";
		const currentPagination = { page: 0, pageSize: 20 };
		const currentSort = [{ field: "name", sort: "desc" }];
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
				createGraphQLClient(cfg, auth).request<any, LoadHostLmsQueryVariables>(
					getHostLms,
					{
						pageno: currentPagination.page,
						pagesize: currentPagination.pageSize,
						order: currentSort[0]?.field ?? "name",
						orderBy: currentSort[0]?.sort?.toUpperCase() ?? "DESC",
						query: "",
					},
				),
		});
	},
	component: HostLmss,
});

function HostLmss() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();

	const gridId = "hostlmss";

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
		columnVisibility: { id: false },
	});

	const {
		data: gridData,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: [gridId, paginationModel, sortModel, filterModel],
		queryFn: () =>
			gqlClient.request<any, LoadHostLmsQueryVariables>(
				getHostLms,
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

	const columns: GridColDef[] = useMemo(
		() => [
			...customColumns,
			{
				field: "name",
				headerName: t("hostlms.name", "Host LMS name"),
				minWidth: 150,
				flex: 1,
				filterOperators: standardFilters,
			},
			{
				field: "code",
				headerName: t("hostlms.code", "Host LMS code"),
				minWidth: 50,
				flex: 0.5,
				filterOperators: standardFilters,
			},
			{
				field: "clientConfigDefaultAgencyCode",
				headerName: t(
					"hostlms.client_config.default_agency_code",
					"Default agency code",
				),
				minWidth: 50,
				flex: 0.5,
				filterable: false,
				sortable: false,
				valueGetter: (val: any, row: any) =>
					row?.clientConfig?.["default-agency-code"],
			},
			{
				field: "clientConfigIngest",
				headerName: t("hostlms.client_config.ingest", "Ingest enabled"),
				minWidth: 50,
				flex: 0.5,
				filterable: false,
				sortable: false,
				valueGetter: (val: any, row: any) => row?.clientConfig?.ingest,
			},
			{
				field: "id",
				headerName: t("hostlms.id", "Host LMS UUID"),
				minWidth: 100,
				flex: 0.5,
				filterOperators: equalsOnly,
			},
		],
		[customColumns, t],
	);

	return (
		<PageContainer title={t("nav.hostlmss")}>
			<DataGrid
				identifier={gridId}
				type={"hostlmss"}
				columns={columns}
				rows={gridData?.hostLms?.content ?? []}
				rowCount={gridData?.hostLms?.totalSize ?? 0}
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
					query: getHostLms,
					coreType: "hostLms",
				}}
				disableAggregation
				disableHoverInteractions={false}
				disableRowGrouping
				disablePivoting
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("hostlms.no_results")}
				searchText={t("hostlms.search_placeholder")}
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
			/>
		</PageContainer>
	);
}
