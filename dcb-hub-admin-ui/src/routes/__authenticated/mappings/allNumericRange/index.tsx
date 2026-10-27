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
import { numericRangeMappingsView } from "@constants/dataGrid/gridViews";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import {
	numericRangeMappingsQuery,
	NUMERIC_RANGE_MAPPINGS_BASE_QUERY,
} from "@/queryOptions/gridQueries";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import { MAPPING_IMPORT_COLUMNS } from "@constants/mappingImportContract";
import Import from "@components/Import/Import";
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useEntityMutation } from "@hooks/useEntityMutation";
import { standardNumRangeMappingColumns } from "@columns/numericRangeMappingColumns";
import { buildRowEditActionsColumn } from "@helpers/dataGrid/buildRowEditActions";

import { getNumericRangeMappings } from "@queries/getNumericRangeMappings";

export const Route = createFileRoute(
	"/__authenticated/mappings/allNumericRange/",
)({
	validateSearch: validateGridSearch,
	loaderDeps: ({ search }) => search,
	beforeLoad: ({ search, location }) => {
		const restore = rememberedViewRedirect(
			numericRangeMappingsView,
			search,
			location.state,
		);
		if (restore)
			throw redirect({ to: "/mappings/allNumericRange", ...restore });
	},
	loader: ({ context: { queryClient, cfg, auth }, deps, location, cause }) => {
		// Skip prefetching for unauthenticated visitors - see hostlmss/index.tsx.
		if (!auth?.isAuthenticated) return;
		// The reader paging or sorting: the grid is already fetching it
		if (cause === "stay") return;
		const models = defaultQueryModels(
			numericRangeMappingsView,
			deps,
			location.state,
		);
		if (!models) return;
		return queryClient.ensureQueryData(
			numericRangeMappingsQuery(createGraphQLClient(cfg, auth), models),
		);
	},
	component: NumericRangeMappingsRoute,
});

function NumericRangeMappingsRoute() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const auth = useAuth();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const gridId = numericRangeMappingsView.id;

	const search = useSearch({
		from: "/__authenticated/mappings/allNumericRange/",
	});
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
	const [showImport, setImport] = useState(false);

	const mappingMutation = useEntityMutation("numericRangeMapping");

	const actionsColumn: GridColDef[] = useMemo(
		() => [
			buildRowEditActionsColumn({
				t,
				rowModesModel,
				setRowModesModel,
				onDelete: (id) =>
					mappingMutation.requestDelete({
						id: id as string,
						name: t("mappings.num_range_one"),
					}),
				canEdit: isAnAdmin,
			}),
		],
		[rowModesModel, isAnAdmin, t, setRowModesModel, mappingMutation],
	);

	const columns = useMemo(
		() => [...standardNumRangeMappingColumns, ...actionsColumn],
		[actionsColumn],
	);

	// What the filter panel offers, which DataGrid narrows to what the server can answer
	const viewColumns = useMemo(
		() => constrainToServerOperators(columns),
		[columns],
	);
	const view = useGridView(numericRangeMappingsView, viewColumns, search);

	const {
		data: gridData,
		isLoading: gridLoading,
		isFetching,
	} = useQuery(
		numericRangeMappingsQuery(gqlClient, {
			paginationModel: view.paginationModel,
			sortModel: view.sortModel,
			filterModel: view.appliedFilterModel,
		}),
	);

	return (
		<PageContainer title={t("nav.mappings.allNumericRange")}>
			<Stack spacing={4} direction="row" sx={{ mb: 3 }}>
				{/* No "new mapping" button here: NewMapping only creates reference
				    value mappings, so the button did nothing but set a flag nobody
				    read. Numeric range mappings are import-only for now. */}
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
				type={"numericRangeMappings"}
				columns={columns}
				viewNotice={<GridViewNotice view={view} />}
				rows={gridData?.numericRangeMappings?.content ?? []}
				rowCount={gridData?.numericRangeMappings?.totalSize ?? 0}
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
					query: getNumericRangeMappings,
					coreType: "numericRangeMappings",
					roundTrip: MAPPING_IMPORT_COLUMNS.numericRangeMappings,
					baseQuery: NUMERIC_RANGE_MAPPINGS_BASE_QUERY,
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
			{showImport && (
				<Import
					show={showImport}
					onClose={() => {
						setImport(false);
						queryClient.invalidateQueries({ queryKey: [gridId] });
					}}
					type="Numeric range mappings"
				/>
			)}
		</PageContainer>
	);
}
