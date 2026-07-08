import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Button, Stack } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import Loading from "@components/Loading/Loading";
import NewGroup from "@forms/NewGroup/NewGroup";

import { useGridState } from "@hooks/useGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import { standardFilters } from "@filters/standardFilters";

import { getLibraryGroups } from "@queries/getLibraryGroups";
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

export const Route = createFileRoute("/__authenticated/groups/")({
	loader: ({ context: { queryClient, cfg, auth } }) => {
		// Skip prefetching for unauthenticated visitors - the request would
		// fail (no token) and its failure would trigger the global
		// network/401 error handler in main.tsx before __authenticated.tsx's
		// own component-level auth-gate redirect to /login ever runs.
		if (!auth?.isAuthenticated) return;
		return queryClient.ensureQueryData({
			queryKey: [
				"groups",
				DEFAULT_PAGINATION_MODEL,
				DEFAULT_SORT_MODEL,
				DEFAULT_FILTER_MODEL,
			],
			queryFn: () =>
				createGraphQLClient(cfg, auth).request<any>(getLibraryGroups, {
					query: "",
					pageno: DEFAULT_PAGINATION_MODEL.page,
					pagesize: DEFAULT_PAGINATION_MODEL.pageSize,
					order: DEFAULT_SORT_MODEL[0].field,
					orderBy: "ASC",
				}),
		});
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

	const gridId = "groups";

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

	const [showNewGroup, setShowNewGroup] = useState(false);

	const {
		data: gridData,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: [gridId, paginationModel, sortModel, filterModel],
		queryFn: () =>
			gqlClient.request<any>(
				getLibraryGroups,
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
				headerName: t("groups.group_name", "Group name"),
				minWidth: 150,
				flex: 0.6,
				filterOperators: standardFilters,
			},
			{
				field: "code",
				headerName: t("groups.group_code", "Group code"),
				minWidth: 50,
				flex: 0.6,
				filterOperators: standardFilters,
			},
			{
				field: "type",
				headerName: t("groups.group_type", "Group type"),
				minWidth: 50,
				flex: 0.4,
				filterOperators: standardFilters,
			},
			{
				field: "id",
				headerName: t("groups.group_uuid", "Group UUID"),
				minWidth: 100,
				flex: 0.8,
				filterOperators: standardFilters,
			},
		],
		[customColumns, t],
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
				rows={gridData?.libraryGroups?.content ?? []}
				rowCount={gridData?.libraryGroups?.totalSize ?? 0}
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
