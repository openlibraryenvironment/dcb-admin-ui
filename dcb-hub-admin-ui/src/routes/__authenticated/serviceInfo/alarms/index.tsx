import { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";
import { GridColDef } from "@mui/x-data-grid-premium";
import { Alert } from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import Link from "@components/Link/Link";

import { useGridState } from "@hooks/useGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import { hostLmsAlarmsQuery } from "@helpers/hostLmsAlarms";
import { alarmsSearchSchema } from "@schemas/routeSearch/alarmsSearch";

import { getAlarms } from "@queries/getAlarms";
import { standardFilters } from "@filters/standardFilters";
import { equalsOnly } from "@filters/equalsOnly";
import type { LoadAlarmsQueryVariables } from "@generated/graphql";

export const Route = createFileRoute("/__authenticated/serviceInfo/alarms/")({
	validateSearch: (search: Record<string, unknown>) =>
		alarmsSearchSchema.parse(search),
	component: AlarmsRouteComponent,
});

function AlarmsRouteComponent() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();
	const { hostLms } = Route.useSearch();
	const baseQuery = hostLms ? hostLmsAlarmsQuery(hostLms) : "";

	const gridId = "alarms";

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
		sort: [{ field: "created", sort: "desc" }],
		columnVisibility: { expires: false },
	});

	const {
		data: gridData,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: [gridId, baseQuery, paginationModel, sortModel, filterModel],
		queryFn: () =>
			gqlClient.request<any, LoadAlarmsQueryVariables>(
				getAlarms,
				buildServerGridQueryVars({
					filterModel,
					sortModel,
					paginationModel,
					baseQuery,
					defaultOrder: "created",
					defaultPageSize: 20,
				}),
			),
		placeholderData: (previousData) => previousData,
	});

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
