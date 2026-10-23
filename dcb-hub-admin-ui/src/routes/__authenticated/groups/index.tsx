import { useMemo, useState } from "react";
import { GridColDef, type GridRowModesModel } from "@mui/x-data-grid-premium";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Button, Stack } from "@mui/material";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { useGridView } from "@hooks/useGridView";
import { constrainToServerOperators } from "@filters/serverFilterOperators";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import {
	defaultQueryModels,
	rememberedViewRedirect,
} from "@helpers/viewState/viewRoute";
import { groupsView } from "@constants/dataGrid/gridViews";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { groupsQuery } from "@/queryOptions/gridQueries";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import Loading from "@components/Loading/Loading";
import NewGroup from "@forms/NewGroup/NewGroup";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { standardFilters } from "@filters/standardFilters";

import { getLibraryGroups } from "@queries/getLibraryGroups";

export const Route = createFileRoute("/__authenticated/groups/")({
	validateSearch: validateGridSearch,
	loaderDeps: ({ search }) => search,
	beforeLoad: ({ search, location }) => {
		const restore = rememberedViewRedirect(groupsView, search, location.state);
		if (restore) throw redirect({ to: "/groups", ...restore });
	},
	loader: ({ context: { queryClient, cfg, auth }, deps, location, cause }) => {
		// Skip prefetching for unauthenticated visitors - see hostlmss/index.tsx.
		if (!auth?.isAuthenticated) return;
		// The reader paging or sorting: the grid is already fetching it
		if (cause === "stay") return;
		const models = defaultQueryModels(groupsView, deps, location.state);
		if (!models) return;
		return queryClient.ensureQueryData(
			groupsQuery(createGraphQLClient(cfg, auth), models),
		);
	},
	component: GroupsRouteComponent,
});

function GroupsRouteComponent() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const gridId = groupsView.id;
	const search = useSearch({ from: "/__authenticated/groups/" });
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const [showNewGroup, setShowNewGroup] = useState(false);

	const columns: GridColDef[] = useMemo(
		() => [
			...customColumns,
			{
				field: "name",
				headerName: t("groups.name"),
				minWidth: 150,
				flex: 0.6,
				filterOperators: standardFilters,
			},
			{
				field: "code",
				headerName: t("groups.code"),
				minWidth: 50,
				flex: 0.6,
				filterOperators: standardFilters,
			},
			{
				field: "type",
				headerName: t("groups.type"),
				minWidth: 50,
				flex: 0.4,
				filterOperators: standardFilters,
			},
			{
				field: "id",
				headerName: t("groups.id"),
				minWidth: 100,
				flex: 0.8,
				filterOperators: standardFilters,
			},
		],
		[customColumns, t],
	);

	// What the filter panel offers, which DataGrid narrows to what the server can answer
	const viewColumns = useMemo(
		() => constrainToServerOperators(columns),
		[columns],
	);
	const view = useGridView(groupsView, viewColumns, search);

	const {
		data: gridData,
		isLoading,
		isFetching,
	} = useQuery(
		groupsQuery(gqlClient, {
			paginationModel: view.paginationModel,
			sortModel: view.sortModel,
			filterModel: view.appliedFilterModel,
		}),
	);

	// Cold-load guard: on a hard page load the prefetch loader is skipped
	// while OIDC is still restoring the session (auth not yet authenticated),
	// so the cache is empty when this mounts. Without this, the grid paints a
	// misleading "0" for one frame before the first fetch resolves. isLoading
	// is only true on a genuine cold start - placeholderData keeps it false
	// during pagination/filter refetches, so interactions don't blank the grid.
	if (isLoading)
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("nav.groups.name").toLowerCase(),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);

	return (
		<PageContainer data-tid="groups-title" title={t("nav.groups.name")}>
			{isAnAdmin && (
				<Stack direction="row" sx={{ mb: 3 }}>
					<Button
						data-tid="new-group-button"
						variant="contained"
						onClick={() => setShowNewGroup(true)}
					>
						{t("groups.type_new")}
					</Button>
				</Stack>
			)}

			<DataGrid
				identifier={gridId}
				type={"groups"}
				columns={columns}
				viewNotice={<GridViewNotice view={view} />}
				rows={gridData?.libraryGroups?.content ?? []}
				rowCount={gridData?.libraryGroups?.totalSize ?? 0}
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
					query: getLibraryGroups,
					coreType: "libraryGroups",
				}}
				disableAggregation
				disableHoverInteractions={false}
				disableRowGrouping
				disablePivoting
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("groups.no_results")}
				searchText={t("groups.search_placeholder")}
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
			/>

			{showNewGroup && (
				<NewGroup show={showNewGroup} onClose={() => setShowNewGroup(false)} />
			)}
		</PageContainer>
	);
}
