import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	GridPaginationModel,
	GridSortModel,
	GridFilterModel,
	GridRowModesModel,
	GridRowModel,
	GridRowModes,
	GridActionsCellItem,
	GridRowParams,
	GridColDef,
	GridColumnVisibilityModel,
} from "@mui/x-data-grid-premium";
import { Delete, Edit, Save, Cancel } from "@mui/icons-material";

import DataGrid from "@components/DataGrid/DataGrid";
import Confirmation from "@components/Confirmation/Confirmation";

import { useGridStore } from "@/hooks/useDataGridStore";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import {
	getSortOrderForServer,
	processGridFilterModel,
} from "@helpers/dataGrid/utilities";
import { computeMutation } from "@helpers/computeMutation";

interface MappingsGridProps {
	gridId: string;
	hostLmsCode: string;
	baseQuery: string;
	isAnAdmin: boolean;
	columns: GridColDef[];
	getQuery: any;
	updateMutation: any;
	deleteMutation: any;
	dataKey: "referenceValueMappings" | "numericRangeMappings";
	mutationUpdateKey:
		"updateReferenceValueMapping" | "updateNumericRangeMapping";
	hiddenColumns?: GridColumnVisibilityModel;
}

export default function MappingsGrid({
	gridId,
	hostLmsCode,
	baseQuery,
	isAnAdmin,
	columns,
	getQuery,
	updateMutation,
	deleteMutation,
	dataKey,
	mutationUpdateKey,
	hiddenColumns = {},
}: MappingsGridProps) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();

	const {
		paginationModel: storedPaginationModel,
		sortModel: storedSortModel,
		filterModel: storedFilterModel,
		setPaginationModel,
		setSortModel,
		setFilterModel,
	} = useGridStore();

	const [paginationModel, setLocalPaginationModel] =
		useState<GridPaginationModel>(
			storedPaginationModel[gridId] ?? { page: 0, pageSize: 200 },
		);
	const [filterModel, setLocalFilterModel] = useState<GridFilterModel>(
		storedFilterModel[gridId] ?? { items: [] },
	);
	const [sortModel, setLocalSortModel] = useState<GridSortModel>(
		storedSortModel[gridId] ?? [{ field: "lastImported", sort: "asc" }],
	);

	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
	const [promiseArguments, setPromiseArguments] = useState<any>(null);
	const [deleteMappingId, setDeleteMappingId] = useState<string | null>(null);

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
			const queryVariables = {
				query: processGridFilterModel(filterModel, baseQuery, []) ?? "",
				pageno: paginationModel.page ?? 0,
				pagesize: paginationModel.pageSize ?? 200,
				order: sortModel[0]?.field ?? "lastImported",
				orderBy: getSortOrderForServer(sortModel[0]?.sort) ?? "ASC",
			};
			return gqlClient.request<any>(getQuery, queryVariables);
		},
		enabled: !!hostLmsCode,
		placeholderData: (previousData) => previousData,
	});

	const { mutateAsync: doUpdate } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request<any>(updateMutation, variables),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: [gridId] }),
	});
	const { mutate: doDelete } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request<any>(deleteMutation, variables),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: [gridId] }),
	});

	const processRowUpdate = useCallback(
		(newRow: GridRowModel, oldRow: GridRowModel) =>
			new Promise<GridRowModel>((resolve, reject) => {
				const changes = computeMutation(newRow, oldRow);
				if (!changes) return resolve(oldRow);
				setPromiseArguments({ resolve, reject, newRow, oldRow });
			}),
		[],
	);

	const handleModalConfirm = async (
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
	) => {
		if (promiseArguments) {
			const { resolve, reject, newRow, oldRow } = promiseArguments;
			const input: Record<string, any> = {
				id: newRow.id,
				reason,
				changeCategory,
				changeReferenceUrl,
			};
			Object.keys(newRow).forEach((key) => {
				if (newRow[key] !== oldRow[key]) input[key] = newRow[key];
			});

			try {
				const result = await doUpdate({ input });
				resolve(result[mutationUpdateKey]);
			} catch (error) {
				reject(error);
			} finally {
				setPromiseArguments(null);
			}
		} else if (deleteMappingId) {
			doDelete(
				{
					input: {
						id: deleteMappingId,
						reason,
						changeCategory,
						changeReferenceUrl,
					},
				},
				{ onSettled: () => setDeleteMappingId(null) },
			);
		}
	};

	const gridColumns: GridColDef[] = useMemo(
		() => [
			...columns,
			{
				field: "actions",
				type: "actions",
				headerName: t("ui.data_grid.actions"),
				width: 100,
				getActions: ({ id }: GridRowParams) => {
					if (rowModesModel[id]?.mode === GridRowModes.Edit) {
						return [
							<GridActionsCellItem
								key="save"
								icon={<Save />}
								label={t("ui.save")}
								onClick={() =>
									setRowModesModel({
										...rowModesModel,
										[id]: { mode: GridRowModes.View },
									})
								}
							/>,
							<GridActionsCellItem
								key="cancel"
								icon={<Cancel />}
								label={t("ui.cancel")}
								onClick={() =>
									setRowModesModel({
										...rowModesModel,
										[id]: {
											mode: GridRowModes.View,
											ignoreModifications: true,
										},
									})
								}
							/>,
						];
					}
					return [
						<GridActionsCellItem
							key="edit"
							icon={<Edit />}
							label={t("ui.edit")}
							onClick={() =>
								setRowModesModel({
									...rowModesModel,
									[id]: { mode: GridRowModes.Edit },
								})
							}
							disabled={!isAnAdmin}
						/>,
						<GridActionsCellItem
							key="delete"
							icon={<Delete />}
							label={t("ui.delete")}
							onClick={() => setDeleteMappingId(id as string)}
							disabled={!isAnAdmin}
						/>,
					];
				},
			},
		],
		[columns, rowModesModel, isAnAdmin, t],
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
				onPaginationModelChange={(m: GridPaginationModel) => {
					setLocalPaginationModel(m);
					setPaginationModel(gridId, m);
				}}
				sortingMode="server"
				sortModel={sortModel}
				onSortModelChange={(m) => {
					setLocalSortModel(m);
					setSortModel(gridId, m);
				}}
				filterMode="server"
				filterModel={filterModel}
				onFilterModelChange={(m) => {
					setLocalFilterModel(m);
					setFilterModel(gridId, m);
				}}
				columnVisibilityModel={hiddenColumns}
				editMode="row"
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
				processRowUpdate={processRowUpdate}
				checkboxSelection={false}
				disableAggregation
				disableRowGrouping
				disableHoverInteractions={false}
				disablePivoting
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("mappings.no_results")}
				searchText={t("general.search")}
			/>
			<Confirmation
				open={!!promiseArguments || !!deleteMappingId}
				onClose={() => {
					if (promiseArguments) {
						promiseArguments.resolve(promiseArguments.oldRow);
						setPromiseArguments(null);
					}
					setDeleteMappingId(null);
				}}
				onConfirm={handleModalConfirm}
				action={promiseArguments ? "gridEdit" : "deletion"}
				entityName="Mapping"
			/>
		</>
	);
}
