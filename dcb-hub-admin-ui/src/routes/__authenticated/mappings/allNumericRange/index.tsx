import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Button, Tooltip, Stack } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import Import from "@components/Import/Import";
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";

import { useMappingGridState } from "@/hooks/useMappingGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useEntityMutation } from "@hooks/useEntityMutation";
import { standardNumRangeMappingColumns } from "@columns/numericRangeMappingColumns";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import { buildRowEditActionsColumn } from "@helpers/dataGrid/buildRowEditActions";

import { getNumericRangeMappings } from "@queries/getNumericRangeMappings";
import type { LoadNumericRangeMappingsQueryVariables } from "@generated/graphql";

export const Route = createFileRoute(
	"/__authenticated/mappings/allNumericRange/",
)({
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

	const gridId = "numericRangeMappings";

	const {
		paginationModel,
		handlePaginationChange,
		filterModel,
		handleFilterChange,
		sortModel,
		handleSortChange,
		columnVisibilityModel,
		handleColumnVisibilityChange,
		rowModesModel,
		setRowModesModel,
		showImport,
		setImport,
	} = useMappingGridState(gridId, { lastImported: false });

	const mappingMutation = useEntityMutation("numericRangeMapping");

	const {
		data: gridData,
		isLoading: gridLoading,
		isFetching,
	} = useQuery({
		queryKey: [gridId, paginationModel, sortModel, filterModel],
		queryFn: async () => {
			return gqlClient.request<any, LoadNumericRangeMappingsQueryVariables>(
				getNumericRangeMappings,
				buildServerGridQueryVars({
					filterModel,
					sortModel,
					paginationModel,
					baseQuery: "(domain: * AND NOT deleted:true)",
					defaultOrder: "lastImported",
					defaultPageSize: 20,
				}),
			);
		},
		placeholderData: (previousData) => previousData,
	});

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
				rows={gridData?.numericRangeMappings?.content ?? []}
				rowCount={gridData?.numericRangeMappings?.totalSize ?? 0}
				loading={gridLoading || (isFetching && !!gridData)}
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
				editMode="row"
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
				processRowUpdate={mappingMutation.requestGridEdit}
				rowSelection
				exportConfig={{
					query: getNumericRangeMappings,
					coreType: "numericRangeMappings",
					baseQuery: "(domain: * AND NOT deleted:true)",
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
