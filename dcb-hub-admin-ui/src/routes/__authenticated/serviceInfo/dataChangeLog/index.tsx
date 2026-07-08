import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { GridColDef } from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";

import { useGridState } from "@hooks/useGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import { getDataChangeLog } from "@queries/getDataChangeLog";
import { dataChangeLogColumns } from "@columns/dataChangeLogColumns";

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/dataChangeLog/",
)({
	component: DataChangeLogsGrid,
});

function DataChangeLogsGrid() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();

	const gridId = "dataChangeLog";

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
		sort: [{ field: "timestampLogged", sort: "desc" }],
		columnVisibility: {
			id: false,
			changes: false,
			changeReferenceUrl: false,
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
				getDataChangeLog,
				buildServerGridQueryVars({
					filterModel,
					sortModel,
					paginationModel,
					defaultOrder: "timestampLogged",
					defaultPageSize: 20,
				}),
			),
		placeholderData: (previousData) => previousData,
	});

	const columns: GridColDef[] = useMemo(
		() => [...customColumns, ...dataChangeLogColumns],
		[customColumns],
	);

	return (
		<PageContainer title={t("nav.serviceInfo.dataChangeLog")}>
			<DataGrid
				identifier={gridId}
				type={"dataChangeLog"}
				columns={columns}
				rows={gridData?.dataChangeLog?.content ?? []}
				rowCount={gridData?.dataChangeLog?.totalSize ?? 0}
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
					<MasterDetail row={row} type="dataChangeLog" />
				)}
				checkboxSelection={true}
				exportConfig={{
					query: getDataChangeLog,
					coreType: "dataChangeLog",
				}}
				disableAggregation
				disableHoverInteractions={false}
				disableRowGrouping
				disablePivoting
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("data_change_log.no_results")}
				searchText={t("ui.data_grid.search")}
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
			/>
		</PageContainer>
	);
}
