import { useMemo, useState } from "react";
import { GridColDef, type GridRowModesModel } from "@mui/x-data-grid-premium";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { useGridView } from "@hooks/useGridView";
import { constrainToServerOperators } from "@filters/serverFilterOperators";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import {
	defaultQueryModels,
	rememberedViewRedirect,
} from "@helpers/viewState/viewRoute";
import { dataChangeLogView } from "@constants/dataGrid/gridViews";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { dataChangeLogQuery } from "@/queryOptions/gridQueries";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { getDataChangeLog } from "@queries/getDataChangeLog";
import { getDataChangeLogColumns } from "@columns/dataChangeLogColumns";

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/dataChangeLog/",
)({
	validateSearch: validateGridSearch,
	loaderDeps: ({ search }) => search,
	beforeLoad: ({ search, location }) => {
		const restore = rememberedViewRedirect(
			dataChangeLogView,
			search,
			location.state,
		);
		if (restore)
			throw redirect({ to: "/serviceInfo/dataChangeLog", ...restore });
	},
	loader: ({ context: { queryClient, cfg, auth }, deps, location, cause }) => {
		// Skip prefetching for unauthenticated visitors - see hostlmss/index.tsx.
		if (!auth?.isAuthenticated) return;
		// The reader paging or sorting: the grid is already fetching it
		if (cause === "stay") return;
		const models = defaultQueryModels(dataChangeLogView, deps, location.state);
		if (!models) return;
		return queryClient.ensureQueryData(
			dataChangeLogQuery(createGraphQLClient(cfg, auth), models),
		);
	},
	component: DataChangeLogsGrid,
});

function DataChangeLogsGrid() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();

	const gridId = dataChangeLogView.id;
	const search = useSearch({
		from: "/__authenticated/serviceInfo/dataChangeLog/",
	});
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const columns: GridColDef[] = useMemo(
		() => [...customColumns, ...getDataChangeLogColumns(t)],
		[customColumns, t],
	);

	// What the filter panel offers, which DataGrid narrows to what the server can answer
	const viewColumns = useMemo(
		() => constrainToServerOperators(columns),
		[columns],
	);
	const view = useGridView(dataChangeLogView, viewColumns, search);

	const {
		data: gridData,
		isLoading,
		isFetching,
	} = useQuery(
		dataChangeLogQuery(gqlClient, {
			paginationModel: view.paginationModel,
			sortModel: view.sortModel,
			filterModel: view.appliedFilterModel,
		}),
	);

	return (
		<PageContainer title={t("nav.serviceInfo.dataChangeLog")}>
			<DataGrid
				identifier={gridId}
				type={"dataChangeLog"}
				columns={columns}
				viewNotice={<GridViewNotice view={view} />}
				rows={gridData?.dataChangeLog?.content ?? []}
				rowCount={gridData?.dataChangeLog?.totalSize ?? 0}
				loading={isLoading || isFetching}
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
					<MasterDetail row={row} type="dataChangeLog" />
				)}
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
