import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	GridRowModel,
	GridColDef,
	GridColumnVisibilityModel,
} from "@mui/x-data-grid-premium";

import DataGrid from "@components/DataGrid/DataGrid";
import Confirmation from "@components/Confirmation/Confirmation";

import { useGridState } from "@hooks/useGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import { buildRowEditActionsColumn } from "@helpers/dataGrid/buildRowEditActions";
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
			buildRowEditActionsColumn({
				t,
				rowModesModel,
				setRowModesModel,
				onDelete: (id) => setDeleteMappingId(id as string),
				canEdit: isAnAdmin,
			}),
		],
		[columns, rowModesModel, setRowModesModel, isAnAdmin, t],
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
