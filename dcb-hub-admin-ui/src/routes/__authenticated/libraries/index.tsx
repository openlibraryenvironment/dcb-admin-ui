import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { GroupAdd } from "@mui/icons-material";
import {
	GridPaginationModel,
	GridSortModel,
	GridFilterModel,
	GridColumnVisibilityModel,
	GridActionsCellItem,
	useGridApiRef,
	GridColDef,
	GridRowId,
} from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import Loading from "@components/Loading/Loading";
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";

import AddLibraryToGroup from "@forms/AddLibraryToGroup/AddLibraryToGroup";
import NewLibrary from "@forms/NewLibrary/NewLibrary";

import { useGridState } from "@hooks/useGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useEntityMutation } from "@hooks/useEntityMutation";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import { buildRowEditActionsColumn } from "@helpers/dataGrid/buildRowEditActions";

import { getLibraries } from "@queries/getLibraries";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";
import { libraryColumns } from "@columns/libraryColumns";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { defaultLibraryColumnVisibility } from "@columns/columnVisibility/defaultLibraryColumnVisibility";
import type { LoadLibrariesQueryVariables } from "@generated/graphql";

// Default-state prefetch: the component reads pagination/sort/filter state
// from useGridStore (a Zustand store) at mount time, which the loader
// cannot access (it isn't a hook and runs outside React). We can only
// prefetch the grid's own hardcoded default first page/sort here - these
// values must mirror the component's initial useState fallbacks below so
// the cache entry lines up on a fresh (unauthenticated-store) render.
const DEFAULT_PAGINATION_MODEL: GridPaginationModel = {
	page: 0,
	pageSize: 200,
};
const DEFAULT_SORT_MODEL: GridSortModel = [
	{ field: "abbreviatedName", sort: "asc" },
];
const DEFAULT_FILTER_MODEL: GridFilterModel = { items: [] };
const DEFAULT_COLUMN_VISIBILITY: GridColumnVisibilityModel =
	defaultLibraryColumnVisibility;
const EMPTY_ROWS: any[] = []; // Prevents the grid from remounting selection states

export const Route = createFileRoute("/__authenticated/libraries/")({
	loader: ({ context: { queryClient, cfg, auth } }) => {
		// Skip prefetching for unauthenticated visitors - the request would
		// fail (no token) and its failure would trigger the global
		// network/401 error handler in main.tsx before __authenticated.tsx's
		// own component-level auth-gate redirect to /login ever runs.
		if (!auth?.isAuthenticated) return;
		return queryClient.ensureQueryData({
			queryKey: [
				"librariesList",
				DEFAULT_PAGINATION_MODEL,
				DEFAULT_SORT_MODEL,
				DEFAULT_FILTER_MODEL,
			],
			queryFn: () =>
				createGraphQLClient(cfg, auth).request<
					any,
					LoadLibrariesQueryVariables
				>(getLibraries, {
					query: "",
					pageno: DEFAULT_PAGINATION_MODEL.page,
					pagesize: DEFAULT_PAGINATION_MODEL.pageSize,
					order: DEFAULT_SORT_MODEL[0].field,
					orderBy: "ASC",
				}),
		});
	},
	component: Libraries,
});

// Make this the exemplar: it has row editing, actions, and the usual filters as well as needing the store

function Libraries() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();
	const auth = useAuth();
	const { displayName } = useConsortiumInfoStore();

	const apiRef = useGridApiRef();
	const [selectedLibraryIds, setSelectedLibraryIds] = useState<GridRowId[]>([]);

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const gridId = "librariesList";

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
		pagination: DEFAULT_PAGINATION_MODEL,
		sort: DEFAULT_SORT_MODEL,
		filter: DEFAULT_FILTER_MODEL,
		columnVisibility: DEFAULT_COLUMN_VISIBILITY,
	});
	const libraryMutation = useEntityMutation("library");

	const [showNewLibrary, setShowNewLibrary] = useState(false);
	const [groupModalLibraries, setGroupModalLibraries] = useState<
		{ id: string; name: string }[] | null
	>(null);

	const {
		data: gridData,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: [gridId, paginationModel, sortModel, filterModel],
		queryFn: () =>
			gqlClient.request<any, LoadLibrariesQueryVariables>(
				getLibraries,
				buildServerGridQueryVars({
					filterModel,
					sortModel,
					paginationModel,
					defaultOrder: "abbreviatedName",
					defaultPageSize: 200,
				}),
			),
		placeholderData: (previousData) => previousData,
	});

	const handleBulkAddToGroup = () => {
		if (!apiRef.current || selectedLibraryIds.length === 0) return;

		const selectedLibraries = selectedLibraryIds
			.map((id) => {
				const row = apiRef.current!.getRow(id);
				if (!row) return null;

				return {
					id: row.id,
					name: row.fullName,
				};
			})
			.filter(Boolean);

		setGroupModalLibraries(selectedLibraries as any);
	};

	const columns: GridColDef[] = useMemo(
		() => [
			...customColumns,
			...libraryColumns,
			buildRowEditActionsColumn({
				t,
				rowModesModel,
				setRowModesModel,
				onDelete: (id, row) =>
					libraryMutation.requestDelete({
						id: id as string,
						name: row.fullName,
					}),
				canEdit: isAnAdmin,
				showInMenu: true,
				extraActions: ({ row }) => [
					<GridActionsCellItem
						key="addToGroup"
						showInMenu
						icon={<GroupAdd />}
						label={t("libraries.add_to_group")}
						onClick={(e) => {
							e.stopPropagation();
							setGroupModalLibraries([{ id: row.id, name: row.fullName }]);
						}}
						disabled={!isAnAdmin}
					/>,
				],
				column: { width: 140 },
			}),
		],
		[
			customColumns,
			rowModesModel,
			setRowModesModel,
			isAnAdmin,
			t,
			libraryMutation,
		],
	);

	const pageActions = [
		{
			key: "newLibrary",
			onClick: () => setShowNewLibrary(true),
			disabled: !isAnAdmin,
			label: t("libraries.new.title"),
		},
		{
			key: "addToGroup",
			onClick: () => setGroupModalLibraries([]),
			disabled: !isAnAdmin,
			label: t("libraries.add_to_group"),
		},
		{
			key: "addToGroupBulk",
			onClick: handleBulkAddToGroup,
			disabled: !isAnAdmin || selectedLibraryIds.length === 0,
			label: t("libraries.add_to_group_selected"),
		},
	];

	if (isLoading)
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("nav.libraries.name").toLowerCase(),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);

	return (
		<PageContainer title={t("nav.libraries.name")} pageActions={pageActions}>
			<DataGrid
				identifier={gridId}
				type="libraries"
				parentApiRef={apiRef}
				columns={columns}
				rows={gridData?.libraries?.content ?? EMPTY_ROWS}
				rowCount={gridData?.libraries?.totalSize ?? 0}
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
				rowSelection
				exportConfig={{
					query: getLibraries,
					coreType: "libraries",
				}}
				disableAggregation
				disableRowGrouping
				disableHoverInteractions={false}
				disablePivoting
				editMode="row"
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
				processRowUpdate={libraryMutation.requestGridEdit}
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("libraries.none_found")}
				searchText={t("libraries.search_placeholder")}
				onRowSelectionModelChange={(newSelection: any) => {
					const extractedIds = newSelection?.ids
						? Array.from(newSelection.ids)
						: Array.isArray(newSelection)
							? newSelection
							: [];

					setSelectedLibraryIds(extractedIds as GridRowId[]);
				}}
			/>

			{showNewLibrary && (
				<NewLibrary
					show={showNewLibrary}
					onClose={() => setShowNewLibrary(false)}
					consortiumName={displayName}
				/>
			)}

			{groupModalLibraries !== null && (
				<AddLibraryToGroup
					show={true}
					onClose={() => setGroupModalLibraries(null)}
					selectedLibraries={groupModalLibraries}
				/>
			)}

			<EntityMutationDialogs {...libraryMutation.dialogProps} />
		</PageContainer>
	);
}
