import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { GridColDef, type GridRowModesModel } from "@mui/x-data-grid-premium";

import DataGrid from "@components/DataGrid/DataGrid";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";

import { useGridView } from "@hooks/useGridView";
import { MAX_DEFAULT_PAGE_SIZE } from "@constants/pagination";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useEntityMutation } from "@hooks/useEntityMutation";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import { buildRowEditActionsColumn } from "@helpers/dataGrid/buildRowEditActions";
import { mappingsGridQueryKey } from "@helpers/dataGrid/mappingsGridQueryKey";
import type { EntityKey } from "@constants/entityRegistry";
import { MAPPING_IMPORT_COLUMNS } from "@constants/mappingImportContract";
import { constrainToServerOperators } from "@filters/serverFilterOperators";
import type { GridViewSpec } from "@helpers/viewState/gridView";

type MappingDataKey = "referenceValueMappings" | "numericRangeMappings";

interface MappingsGridProps {
	/** The grid's view: scoped to the library, and namespaced when it is the page's second grid. */
	view: GridViewSpec;
	hostLmsCode: string;
	baseQuery: string;
	isAnAdmin: boolean;
	columns: GridColDef[];
	getQuery: any;
	dataKey: MappingDataKey;
}

// The mutations, their response keys and the caches to invalidate all follow
// from which kind of mapping this is, so callers no longer pass them - they
// passed three props that could disagree with each other and with `dataKey`.
const ENTITY_FOR_DATA_KEY: Record<MappingDataKey, EntityKey> = {
	referenceValueMappings: "referenceValueMapping",
	numericRangeMappings: "numericRangeMapping",
};

export default function MappingsGrid({
	view: gridView,
	hostLmsCode,
	baseQuery,
	isAnAdmin,
	columns,
	getQuery,
	dataKey,
}: MappingsGridProps) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const entity = ENTITY_FOR_DATA_KEY[dataKey];
	const mappingMutation = useEntityMutation(entity);

	const gridId = gridView.id;
	// Shared by every mapping page, so it reads the search of whichever route it is on
	const search = useSearch({ strict: false });
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const gridColumns: GridColDef[] = useMemo(
		() => [
			...columns,
			buildRowEditActionsColumn({
				t,
				rowModesModel,
				setRowModesModel,
				onDelete: (id) =>
					mappingMutation.requestDelete({
						id: id as string,
						name: t("mappings.mappings"),
					}),
				canEdit: isAnAdmin,
			}),
		],
		[columns, rowModesModel, setRowModesModel, isAnAdmin, t, mappingMutation],
	);
	// What the filter panel offers, which DataGrid narrows to what the server can answer
	const viewColumns = useMemo(
		() => constrainToServerOperators(gridColumns),
		[gridColumns],
	);
	const view = useGridView(gridView, viewColumns, search);

	const {
		data: gridData,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: mappingsGridQueryKey(
			entity,
			gridId,
			hostLmsCode,
			baseQuery,
			view.paginationModel,
			view.sortModel,
			view.appliedFilterModel,
		),
		queryFn: async () => {
			return gqlClient.request<any>(
				getQuery,
				buildServerGridQueryVars({
					filterModel: view.appliedFilterModel,
					sortModel: view.sortModel,
					paginationModel: view.paginationModel,
					baseQuery,
					defaultOrder: "lastImported",
					defaultPageSize: MAX_DEFAULT_PAGE_SIZE,
				}),
			);
		},
		enabled: !!hostLmsCode,
		placeholderData: (previousData) => previousData,
	});

	return (
		<>
			<DataGrid
				identifier={gridId}
				type={dataKey}
				columns={gridColumns}
				viewNotice={<GridViewNotice view={view} />}
				rows={gridData?.[dataKey]?.content ?? []}
				rowCount={gridData?.[dataKey]?.totalSize ?? 0}
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
				editMode="row"
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
				processRowUpdate={mappingMutation.requestGridEdit}
				rowSelection
				exportConfig={{
					query: getQuery,
					coreType: dataKey,
					baseQuery,
					wizard: true,
					roundTrip: MAPPING_IMPORT_COLUMNS[dataKey],
				}}
				disableAggregation
				disableRowGrouping
				disableHoverInteractions={false}
				disablePivoting
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("mappings.no_results")}
				searchText={t("ui.data_grid.search")}
			/>
			<EntityMutationDialogs {...mappingMutation.dialogProps} />
		</>
	);
}
