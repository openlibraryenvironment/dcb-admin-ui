import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Button, Tooltip, Stack } from "@mui/material";
import { GridColDef, type GridRowModesModel } from "@mui/x-data-grid-premium";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { useGridView } from "@hooks/useGridView";
import { constrainToServerOperators } from "@filters/serverFilterOperators";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import {
	defaultQueryModels,
	rememberedViewRedirect,
} from "@helpers/viewState/viewRoute";
import { referenceValueMappingsView } from "@constants/dataGrid/gridViews";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import {
	referenceValueMappingsQuery,
	REFERENCE_VALUE_MAPPINGS_BASE_QUERY,
} from "@/queryOptions/gridQueries";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import { MAPPING_IMPORT_COLUMNS } from "@constants/mappingImportContract";
import Import from "@components/Import/Import";
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";
import NewMapping from "@forms/NewMapping/NewMapping";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useEntityMutation } from "@hooks/useEntityMutation";
import { standardRefValueMappingColumns } from "@columns/referenceValueMappingColumns";
import { buildRowEditActionsColumn } from "@helpers/dataGrid/buildRowEditActions";

import { getMappings } from "@queries/getMappings";
import { getHostLmsCodes } from "@queries/getHostLmsCodes";
import { nonCriticalQuery } from "@helpers/queryPolicy";
import type { LoadHostLmsCodesQueryVariables } from "@generated/graphql";

export const Route = createFileRoute(
	"/__authenticated/mappings/allReferenceValue/",
)({
	validateSearch: validateGridSearch,
	loaderDeps: ({ search }) => search,
	beforeLoad: ({ search, location }) => {
		const restore = rememberedViewRedirect(
			referenceValueMappingsView,
			search,
			location.state,
		);
		if (restore)
			throw redirect({ to: "/mappings/allReferenceValue", ...restore });
	},
	loader: ({ context: { queryClient, cfg, auth }, deps, location, cause }) => {
		// Skip prefetching for unauthenticated visitors - see hostlmss/index.tsx.
		if (!auth?.isAuthenticated) return;
		// The reader paging or sorting: the grid is already fetching it
		if (cause === "stay") return;
		const models = defaultQueryModels(
			referenceValueMappingsView,
			deps,
			location.state,
		);
		if (!models) return;
		return queryClient.ensureQueryData(
			referenceValueMappingsQuery(createGraphQLClient(cfg, auth), models),
		);
	},
	component: ReferenceValueMappingsRoute,
});

function ReferenceValueMappingsRoute() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const gridId = referenceValueMappingsView.id;

	const search = useSearch({
		from: "/__authenticated/mappings/allReferenceValue/",
	});
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
	const [showImport, setImport] = useState(false);
	const [showNewMapping, setNewMapping] = useState(false);

	const mappingMutation = useEntityMutation("referenceValueMapping");

	// This page is consortium-wide, so it has no library to take a Host LMS code
	// from. The new-mapping form still needs the set of contexts a mapping can be
	// scoped to, so fetch the codes and hand it the full list.
	const { data: hostLmsData } = useQuery({
		queryKey: ["hostLmsCodes"],
		queryFn: () =>
			gqlClient.request<any, LoadHostLmsCodesQueryVariables>(getHostLmsCodes, {
				query: "",
				pagesize: 1000,
			}),
		staleTime: 1000 * 60 * 5,
		...nonCriticalQuery,
	});
	const hostLmsCodes: string[] = useMemo(
		() =>
			(hostLmsData?.hostLms?.content ?? [])
				.map((hostLms: { code: string }) => hostLms.code)
				.filter(Boolean),
		[hostLmsData],
	);

	const actionsColumn: GridColDef[] = useMemo(
		() => [
			buildRowEditActionsColumn({
				t,
				rowModesModel,
				setRowModesModel,
				onDelete: (id) =>
					mappingMutation.requestDelete({
						id: id as string,
						name: t("mappings.ref_value_one"),
					}),
				canEdit: isAnAdmin,
			}),
		],
		[rowModesModel, isAnAdmin, t, setRowModesModel, mappingMutation],
	);

	const columns = useMemo(
		() => [...standardRefValueMappingColumns, ...actionsColumn],
		[actionsColumn],
	);

	// What the filter panel offers, which DataGrid narrows to what the server can answer
	const viewColumns = useMemo(
		() => constrainToServerOperators(columns),
		[columns],
	);
	const view = useGridView(referenceValueMappingsView, viewColumns, search);

	const {
		data: gridData,
		isLoading: gridLoading,
		isFetching,
	} = useQuery(
		referenceValueMappingsQuery(gqlClient, {
			paginationModel: view.paginationModel,
			sortModel: view.sortModel,
			filterModel: view.appliedFilterModel,
		}),
	);

	return (
		<PageContainer title={t("nav.mappings.allReferenceValue")}>
			<Stack spacing={4} direction="row" sx={{ mb: 3 }}>
				<Button
					variant="outlined"
					onClick={() => setNewMapping(true)}
					disabled={!isAnAdmin}
				>
					{t("mappings.new.title")}
				</Button>
				<Tooltip title={isAnAdmin ? "" : t("mappings.import_disabled")}>
					<span>
						<Button
							variant="contained"
							onClick={() => setImport(true)}
							disabled={!isAnAdmin}
						>
							{t("mappings.import")}
						</Button>
					</span>
				</Tooltip>
			</Stack>

			<DataGrid
				identifier={gridId}
				type={"referenceValueMappings"}
				columns={columns}
				viewNotice={<GridViewNotice view={view} />}
				rows={gridData?.referenceValueMappings?.content ?? []}
				rowCount={gridData?.referenceValueMappings?.totalSize ?? 0}
				loading={gridLoading || (isFetching && !!gridData)}
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
				editMode="row"
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
				processRowUpdate={mappingMutation.requestGridEdit}
				rowSelection
				exportConfig={{
					query: getMappings,
					coreType: "referenceValueMappings",
					roundTrip: MAPPING_IMPORT_COLUMNS.referenceValueMappings,
					baseQuery: REFERENCE_VALUE_MAPPINGS_BASE_QUERY,
					wizard: true,
				}}
				disableAggregation
				disableHoverInteractions={false}
				disableRowGrouping
				disablePivoting
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("mappings.no_results")}
				searchText={t("ui.data_grid.search")}
			/>

			<EntityMutationDialogs {...mappingMutation.dialogProps} />
			{showNewMapping && (
				<NewMapping
					show={showNewMapping}
					onClose={() => {
						setNewMapping(false);
						queryClient.invalidateQueries({ queryKey: [gridId] });
					}}
					category=""
					hostLmsCode=""
					agencyCode=""
					libraryName=""
					hostLmsCodes={hostLmsCodes}
				/>
			)}
			{showImport && (
				<Import
					show={showImport}
					onClose={() => {
						setImport(false);
						queryClient.invalidateQueries({ queryKey: [gridId] });
					}}
					type="Reference value mappings"
				/>
			)}
		</PageContainer>
	);
}
