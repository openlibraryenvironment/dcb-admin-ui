import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Alert, AlertTitle } from "@mui/material";
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
import { CustomLinkButton } from "@components/CustomLink/CustomLink";

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
import {
	consortiumBasicsQuery,
	readConsortiumPresence,
} from "@/queryOptions/consortium";
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

	const navigate = useNavigate();
	const [showNewLibrary, setShowNewLibrary] = useState(false);
	const [groupModalLibraries, setGroupModalLibraries] = useState<
		{ id: string; name: string }[] | null
	>(null);

	// A library belongs to a consortium, and there is exactly one per instance.
	// On a fresh system the grid is empty and "New library" leads nowhere useful,
	// so the page says what is actually missing.
	const consortiumQuery = useQuery(consortiumBasicsQuery(gqlClient));
	const { hasConsortium } = readConsortiumPresence(consortiumQuery);

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

	// A library belongs to a consortium, and both of these produce something incoherent
	// without one. Measured against a running service, not assumed: createLibrary with no
	// consortium SUCCEEDS and yields a library that is part of nothing, and addLibraryToGroup
	// with no groups fails with a null-on-non-null GraphQL error rather than a refusal. One
	// is silently wrong, the other is loudly wrong in a way that reads as a bug.
	//
	// Disabled rather than hidden: hiding them would leave a first-time user wondering where
	// the thing they came here for went. The tooltip says why, because a disabled control
	// with no explanation is a dead end.
	const consortiumMissing = hasConsortium === false;
	const needsConsortium = consortiumMissing
		? t("libraries.requires_consortium")
		: undefined;

	const pageActions = [
		// Offered only where it can do anything: creating a consortium is a
		// once-per-instance job, so on a configured system the button would be a
		// permanent dead end.
		//
		// It NAVIGATES rather than opening a modal. Setting a consortium up is a guided
		// flow that spans several sittings and has to survive a refresh, a bookmark and
		// being handed to a colleague - none of which a dialog can do. Offering a second,
		// modal way to do the same job was two implementations of one task.
		...(consortiumMissing
			? [
					{
						key: "newConsortium",
						onClick: () => navigate({ to: "/setup/$step", params: { step: "consortium" } }),
						disabled: !isAnAdmin,
						label: t("consortium.new.title"),
					},
				]
			: []),
		{
			key: "newLibrary",
			onClick: () => setShowNewLibrary(true),
			disabled: !isAnAdmin || consortiumMissing,
			tooltip: needsConsortium,
			label: t("libraries.new.title"),
		},
		{
			key: "addToGroup",
			onClick: () => setGroupModalLibraries([]),
			disabled: !isAnAdmin || consortiumMissing,
			tooltip: needsConsortium,
			label: t("libraries.add_to_group"),
		},
		{
			key: "addToGroupBulk",
			onClick: handleBulkAddToGroup,
			disabled:
				!isAnAdmin || consortiumMissing || selectedLibraryIds.length === 0,
			tooltip: needsConsortium,
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
			{hasConsortium === false && (
				<Alert
					severity="warning"
					sx={{ mb: 3 }}
					action={
						isAnAdmin ? (
							// A real anchor, so it is openable in a new tab and announced as a
							// link. Same destination as the page action above.
							<CustomLinkButton
								color="inherit"
								size="small"
								variant="outlined"
								to="/setup/$step"
								params={{ step: "consortium" }}
							>
								{t("consortium.new.title")}
							</CustomLinkButton>
						) : undefined
					}
				>
					<AlertTitle>{t("consortium.new.required_title")}</AlertTitle>
					{t("consortium.new.required_body")}
				</Alert>
			)}

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
					// Closes the wizard and hands over to the setup flow, which is now the
					// only place a consortium is created.
					onCreateConsortium={() => {
						setShowNewLibrary(false);
						navigate({ to: "/setup/$step", params: { step: "consortium" } });
					}}
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
