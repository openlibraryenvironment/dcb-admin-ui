import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
import type { GridRowModesModel } from "@mui/x-data-grid-premium";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { useGridView } from "@hooks/useGridView";
import { constrainToServerOperators } from "@filters/serverFilterOperators";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import {
	defaultQueryModels,
	rememberedViewRedirect,
} from "@helpers/viewState/viewRoute";
import { agenciesView } from "@constants/dataGrid/gridViews";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { agenciesQuery } from "@/queryOptions/gridQueries";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { getAgencies } from "@queries/getAgencies";
import { standardFilters } from "@filters/standardFilters";
import { equalsOnly } from "@filters/equalsOnly";

export const Route = createFileRoute("/__authenticated/agencies/")({
	validateSearch: validateGridSearch,
	loaderDeps: ({ search }) => search,
	beforeLoad: ({ search, location }) => {
		const restore = rememberedViewRedirect(
			agenciesView,
			search,
			location.state,
		);
		if (restore) throw redirect({ to: "/agencies", ...restore });
	},
	loader: ({ context: { queryClient, cfg, auth }, deps, location, cause }) => {
		// Skip prefetching for unauthenticated visitors - see hostlmss/index.tsx.
		if (!auth?.isAuthenticated) return;
		// The reader paging or sorting: the grid is already fetching it
		if (cause === "stay") return;
		const models = defaultQueryModels(agenciesView, deps, location.state);
		if (!models) return;
		return queryClient.ensureQueryData(
			agenciesQuery(createGraphQLClient(cfg, auth), models),
		);
	},
	component: AgenciesRouteComponent,
});

function AgenciesRouteComponent() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();

	const gridId = agenciesView.id;
	const search = useSearch({ from: "/__authenticated/agencies/" });
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const columns = useMemo(
		() => [
			...customColumns,
			{
				field: "name",
				headerName: t("agencies.name"),
				minWidth: 150,
				flex: 0.5,
				filterOperators: standardFilters,
			},
			{
				field: "code",
				headerName: t("agencies.code"),
				minWidth: 50,
				flex: 0.5,
				filterOperators: standardFilters,
			},
			{
				field: "id",
				headerName: t("agencies.uuid"),
				minWidth: 100,
				flex: 0.5,
				filterOperators: equalsOnly,
				filterable: false,
			},
			{
				field: "longitude",
				headerName: t("locations.longitude"),
				minWidth: 50,
				flex: 0.5,
				filterOperators: equalsOnly,
			},
			{
				field: "latitude",
				headerName: t("locations.latitude"),
				minWidth: 50,
				flex: 0.5,
				filterOperators: equalsOnly,
				filterable: false,
			},
		],
		[customColumns, t],
	);

	// What the filter panel offers, which DataGrid narrows to what the server can answer
	const viewColumns = useMemo(
		() => constrainToServerOperators(columns),
		[columns],
	);
	const view = useGridView(agenciesView, viewColumns, search);

	const {
		data: gridData,
		isLoading,
		isFetching,
	} = useQuery(
		agenciesQuery(gqlClient, {
			paginationModel: view.paginationModel,
			sortModel: view.sortModel,
			filterModel: view.appliedFilterModel,
		}),
	);

	return (
		<PageContainer title={t("nav.agencies")}>
			<DataGrid
				identifier={gridId}
				type="agencies"
				columns={columns}
				viewNotice={<GridViewNotice view={view} />}
				rows={gridData?.agencies?.content ?? []}
				rowCount={gridData?.agencies?.totalSize ?? 0}
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
