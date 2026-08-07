import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	GridColDef,
	GridColumnVisibilityModel,
} from "@mui/x-data-grid-premium";

import DataGrid from "@components/DataGrid/DataGrid";
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";

import { useGridState } from "@hooks/useGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useEntityMutation } from "@hooks/useEntityMutation";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import { buildRowEditActionsColumn } from "@helpers/dataGrid/buildRowEditActions";
import type { EntityKey } from "@constants/entityRegistry";

type MappingDataKey = "referenceValueMappings" | "numericRangeMappings";

interface MappingsGridProps {
	gridId: string;
	hostLmsCode: string;
	baseQuery: string;
	isAnAdmin: boolean;
	columns: GridColDef[];
	getQuery: any;
	dataKey: MappingDataKey;
	hiddenColumns?: GridColumnVisibilityModel;
}

// The mutations, their response keys and the caches to invalidate all follow
// from which kind of mapping this is, so callers no longer pass them - they
// passed three props that could disagree with each other and with `dataKey`.
const ENTITY_FOR_DATA_KEY: Record<MappingDataKey, EntityKey> = {
	referenceValueMappings: "referenceValueMapping",
	numericRangeMappings: "numericRangeMapping",
};

export default function MappingsGrid({
	gridId,
	hostLmsCode,
	baseQuery,
	isAnAdmin,
	columns,
	getQuery,
	dataKey,
	hiddenColumns = {},
}: MappingsGridProps) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const mappingMutation = useEntityMutation(ENTITY_FOR_DATA_KEY[dataKey]);

	const {
		paginationModel,
		sortModel,
		filterModel,
		rowModesModel,
		setRowModesModel,
		onPaginationModelChange,
		onSortModelChange,
		onFilterModelChange,
	} = useGridState(gridId, {
		pagination: { page: 0, pageSize: 200 },
		sort: [{ field: "lastImported", sort: "asc" }],
	});

	const {
		data: gridData,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: [
			gridId,
			hostLmsCode,
			baseQuery,
			paginationModel,
			sortModel,
			filterModel,
		],
		queryFn: async () => {
			return gqlClient.request<any>(
				getQuery,
				buildServerGridQueryVars({
					filterModel,
					sortModel,
					paginationModel,
					baseQuery,
					defaultOrder: "lastImported",
					defaultPageSize: 200,
				}),
			);
		},
		enabled: !!hostLmsCode,
		placeholderData: (previousData) => previousData,
	});

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

	return (
		<>
			<DataGrid
				identifier={gridId}
				type={dataKey}
				columns={gridColumns}
				rows={gridData?.[dataKey]?.content ?? []}
				rowCount={gridData?.[dataKey]?.totalSize ?? 0}
				loading={isLoading || isFetching}
				paginationMode="server"
				pagination
				paginationModel={paginationModel}
				onPaginationModelChange={onPaginationModelChange}
				sortingMode="server"
				sortModel={sortModel}
				onSortModelChange={onSortModelChange}
				filterMode="server"
				filterModel={filterModel}
				onFilterModelChange={onFilterModelChange}
				columnVisibilityModel={hiddenColumns}
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
