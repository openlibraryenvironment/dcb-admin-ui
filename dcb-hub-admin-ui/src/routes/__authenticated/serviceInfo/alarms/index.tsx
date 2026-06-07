import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";
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
import MasterDetail from "@components/MasterDetail/MasterDetail";

import { useGridStore } from "@/hooks/useDataGridStore";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import {
	getSortOrderForServer,
	processGridFilterModel,
} from "@helpers/dataGrid/utilities";

import { getAlarms } from "@queries/getAlarms";
import { standardFilters } from "@filters/standardFilters";
import { equalsOnly } from "@filters/equalsOnly";

export const Route = createFileRoute("/__authenticated/serviceInfo/alarms/")({
	component: AlarmsRouteComponent,
});

function AlarmsRouteComponent() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();

	const gridId = "alarms";

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
			storedState.pagination ?? { page: 0, pageSize: 20 },
		);
	const [filterModel, setLocalFilterModel] = useState<GridFilterModel>(
		storedState.filter ?? { items: [] },
	);
	const [sortModel, setLocalSortModel] = useState<GridSortModel>(
		storedState.sort ?? [{ field: "created", sort: "desc" }],
	);
	const [columnVisibilityModel, setLocalColumnVisibilityModel] =
		useState<GridColumnVisibilityModel>(
			storedState.columnVisibility ?? { expires: false },
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
				pagesize: paginationModel.pageSize ?? 20,
				order: sortModel[0]?.field ?? "created",
				orderBy: getSortOrderForServer(sortModel[0]?.sort) ?? "DESC",
			};
			return gqlClient.request<any>(getAlarms, queryVariables);
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
				field: "id",
				headerName: t("alarms.id"),
				minWidth: 100,
				flex: 0.5,
				filterOperators: equalsOnly,
			},
			{
				field: "code",
				headerName: t("alarms.code"),
				minWidth: 100,
				flex: 0.8,
				filterOperators: standardFilters,
			},
			{
				field: "created",
				headerName: t("alarms.created"),
				minWidth: 100,
				flex: 0.3,
				filterable: false,
				valueGetter: (value: any, row: any) =>
					dayjs(row?.created).format("YYYY-MM-DD HH:mm"),
			},
			{
				field: "lastSeen",
				headerName: t("alarms.last_seen"),
				minWidth: 100,
				flex: 0.3,
				filterable: false,
				valueGetter: (value: any, row: any) =>
					dayjs(row?.lastSeen).format("YYYY-MM-DD HH:mm"),
			},
			{
				field: "repeatCount",
				headerName: t("alarms.repeat_count"),
				minWidth: 50,
				flex: 0.2,
				filterable: false,
				type: "number",
			},
			{
				field: "expires",
				headerName: t("alarms.expires"),
				minWidth: 100,
				flex: 0.3,
				filterable: false,
				valueGetter: (value: any, row: any) =>
					dayjs(row?.expires).format("YYYY-MM-DD HH:mm"),
			},
		],
		[customColumns, t],
	);

	return (
		<AdminLayout title={t("nav.serviceInfo.alarms.name")}>
			<DataGrid
				identifier={gridId}
				type={gridId}
				columns={columns}
				rows={gridData?.alarms?.content ?? []}
				rowCount={gridData?.alarms?.totalSize ?? 0}
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
				getDetailPanelContent={({ row }: any) => (
					<MasterDetail row={row} type="alarms" />
				)}
				checkboxSelection={true}
				disableAggregation
				disableHoverInteractions={false}
				disableRowGrouping
				disablePivoting
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("common.no_results")}
				searchText={t("general.search")}
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
			/>
		</AdminLayout>
	);
}
