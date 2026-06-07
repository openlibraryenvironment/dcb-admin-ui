import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	GridPaginationModel,
	GridSortModel,
	GridFilterModel,
	GridColumnVisibilityModel,
	GridColDef,
	GridRowModesModel,
} from "@mui/x-data-grid-premium";

import AdminLayout from "@layout/AdminLayout/AdminLayout";
import DataGrid from "@components/DataGrid/DataGrid";

import { useGridStore } from "@/hooks/useDataGridStore";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import {
	getSortOrderForServer,
	processGridFilterModel,
} from "@helpers/dataGrid/utilities";

import { getHostLms } from "@queries/getHostLms";
import { standardFilters } from "@filters/standardFilters";
import { equalsOnly } from "@filters/equalsOnly";

export const Route = createFileRoute("/__authenticated/hostlmss/")({
	component: HostLmss,
});

function HostLmss() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();

	const gridId = "hostlmss";

	const {
		sortModel: storedSortModel,
		filterModel: storedFilterModel,
		paginationModel: storedPaginationModel,
		columnVisibilityModel: storedColumnVisibilityModel,
		setSortModel,
		setFilterModel,
		setPaginationModel,
		setColumnVisibilityModel,
	} = useGridStore();

	const storedState = {
		sort: storedSortModel[gridId],
		filter: storedFilterModel[gridId],
		pagination: storedPaginationModel[gridId],
		columnVisibility: storedColumnVisibilityModel[gridId],
	};
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const [paginationModel, setLocalPaginationModel] =
		useState<GridPaginationModel>(
			storedState.pagination ?? { page: 0, pageSize: 10 },
		);
	const [filterModel, setLocalFilterModel] = useState<GridFilterModel>(
		storedState.filter ?? { items: [] },
	);
	const [sortModel, setLocalSortModel] = useState<GridSortModel>(
		storedState.sort ?? [{ field: "name", sort: "asc" }],
	);
	const [columnVisibilityModel, setLocalColumnVisibilityModel] =
		useState<GridColumnVisibilityModel>(
			storedState.columnVisibility ?? { id: false },
		);

	const {
		data: gridData,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: [gridId, paginationModel, sortModel, filterModel],
		queryFn: async () => {
			const queryVariables = {
				query: processGridFilterModel(filterModel, "", []) ?? "",
				pageno: paginationModel.page ?? 0,
				pagesize: paginationModel.pageSize ?? 10,
				order: sortModel[0]?.field ?? "name",
				orderBy: getSortOrderForServer(sortModel[0]?.sort) ?? "ASC",
			};
			return gqlClient.request<any>(getHostLms, queryVariables);
		},
		placeholderData: (previousData) => previousData,
	});

	const handlePaginationChange = useCallback(
		(model: GridPaginationModel) => {
			setLocalPaginationModel(model);
			setPaginationModel(gridId, model);
		},
		[gridId, setPaginationModel],
	);

	const handleSortChange = useCallback(
		(model: GridSortModel) => {
			setLocalSortModel(model);
			setSortModel(gridId, model);
		},
		[gridId, setSortModel],
	);

	const handleFilterChange = useCallback(
		(model: GridFilterModel) => {
			setLocalFilterModel(model);
			setFilterModel(gridId, model);
		},
		[gridId, setFilterModel],
	);

	const handleColumnVisibilityChange = useCallback(
		(model: GridColumnVisibilityModel) => {
			setLocalColumnVisibilityModel(model);
			setColumnVisibilityModel(gridId, model);
		},
		[gridId, setColumnVisibilityModel],
	);

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
		<AdminLayout title={t("nav.hostlmss")}>
			<DataGrid
				identifier={gridId}
				type={gridId}
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
		</AdminLayout>
	);
}
