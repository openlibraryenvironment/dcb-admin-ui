import { useMemo, useState } from "react";
import { GridColDef, type GridRowModesModel } from "@mui/x-data-grid-premium";
import { Trans, useTranslation } from "react-i18next";
import { Alert } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
import dayjs from "dayjs";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { useGridView } from "@hooks/useGridView";
import { constrainToServerOperators } from "@filters/serverFilterOperators";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import {
	defaultQueryModels,
	rememberedViewRedirect,
} from "@helpers/viewState/viewRoute";
import { alarmsView } from "@constants/dataGrid/gridViews";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { alarmsQuery } from "@/queryOptions/gridQueries";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import Link from "@components/Link/Link";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { hostLmsAlarmsQuery } from "@helpers/hostLmsAlarms";
import { alarmsSearchSchema } from "@schemas/routeSearch/alarmsSearch";

import { getAlarms } from "@queries/getAlarms";
import { standardFilters } from "@filters/standardFilters";
import { equalsOnly } from "@filters/equalsOnly";

export const Route = createFileRoute("/__authenticated/serviceInfo/alarms/")({
	// A link that names a Host LMS is a link: nothing remembered is restored over it
	validateSearch: (search: Record<string, unknown>) => ({
		...alarmsSearchSchema.parse(search),
		...validateGridSearch(search),
	}),
	loaderDeps: ({ search }) => search,
	beforeLoad: ({ search, location }) => {
		const restore = rememberedViewRedirect(alarmsView, search, location.state);
		if (restore) throw redirect({ to: "/serviceInfo/alarms", ...restore });
	},
	loader: ({ context: { queryClient, cfg, auth }, deps, location, cause }) => {
		// Skip prefetching for unauthenticated visitors - see hostlmss/index.tsx.
		if (!auth?.isAuthenticated) return;
		// The reader paging or sorting: the grid is already fetching it
		if (cause === "stay") return;
		const models = defaultQueryModels(alarmsView, deps, location.state);
		if (!models) return;
		return queryClient.ensureQueryData(
			alarmsQuery(
				createGraphQLClient(cfg, auth),
				models,
				deps.hostLms ? hostLmsAlarmsQuery(deps.hostLms) : "",
			),
		);
	},
	component: AlarmsRouteComponent,
});

function AlarmsRouteComponent() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();

	const gridId = alarmsView.id;
	const search = useSearch({ from: "/__authenticated/serviceInfo/alarms/" });
	const { hostLms } = search;
	const baseQuery = hostLms ? hostLmsAlarmsQuery(hostLms) : "";
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

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

	// What the filter panel offers, which DataGrid narrows to what the server can answer
	const viewColumns = useMemo(
		() => constrainToServerOperators(columns),
		[columns],
	);
	const view = useGridView(alarmsView, viewColumns, search);

	const {
		data: gridData,
		isLoading,
		isFetching,
	} = useQuery(
		alarmsQuery(
			gqlClient,
			{
				paginationModel: view.paginationModel,
				sortModel: view.sortModel,
				filterModel: view.appliedFilterModel,
			},
			baseQuery,
		),
	);

	return (
		<PageContainer title={t("nav.serviceInfo.alarms.name")}>
			{hostLms && (
				<Alert severity="info" sx={{ mb: 2 }}>
					<Trans
						i18nKey="alarms.for_host_lms"
						values={{ code: hostLms }}
						components={{
							showAll: <Link to="/serviceInfo/alarms" search={{}} />,
						}}
					/>
				</Alert>
			)}
			<DataGrid
				identifier={gridId}
				type={"alarms"}
				columns={columns}
				viewNotice={<GridViewNotice view={view} />}
				rows={gridData?.alarms?.content ?? []}
				rowCount={gridData?.alarms?.totalSize ?? 0}
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
					<MasterDetail row={row} type="alarms" />
				)}
				exportConfig={{
					query: getAlarms,
					coreType: "alarms",
					baseQuery,
				}}
				disableAggregation
				disableHoverInteractions={false}
				disableRowGrouping
				disablePivoting
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("ui.data_grid.no_results")}
				searchText={t("ui.data_grid.search")}
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
			/>
		</PageContainer>
	);
}
