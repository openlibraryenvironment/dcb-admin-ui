import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Button, Tooltip, Stack } from "@mui/material";
import { Edit, Delete, Save, Cancel } from "@mui/icons-material";
import {
	GridColDef,
	GridRowModes,
	GridRowModel,
	GridActionsCellItem,
} from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import Import from "@components/Import/Import";
import Confirmation from "@components/Confirmation/Confirmation";

import { useMappingGridState } from "@/hooks/useMappingGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { standardNumRangeMappingColumns } from "@columns/numericRangeMappingColumns";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import { computeMutation } from "@helpers/computeMutation";

import { getNumericRangeMappings } from "@queries/getNumericRangeMappings";
import { updateNumericRangeMapping } from "@mutations/updateNumericRangeMapping";

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
		promiseArguments,
		setPromiseArguments,
		editRecord,
		setEditRecord,
		deleteConfirmationId,
		setDeleteConfirmationId,
		showImport,
		setImport,
		setNewMapping,
	} = useMappingGridState(gridId, { lastImported: false });

	const {
		data: gridData,
		isLoading: gridLoading,
		isFetching,
	} = useQuery({
		queryKey: [gridId, paginationModel, sortModel, filterModel],
		queryFn: async () => {
			return gqlClient.request<any>(
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

	const { mutateAsync: updateMapping } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request<any>(updateNumericRangeMapping, variables),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: [gridId] }),
	});

	const processRowUpdate = useCallback(
		(newRow: GridRowModel, oldRow: GridRowModel) =>
			new Promise<GridRowModel>((resolve, reject) => {
				const changes = computeMutation(newRow, oldRow);
				if (!changes) return resolve(oldRow);
				setEditRecord(changes);
				setPromiseArguments({ resolve, reject, newRow, oldRow });
			}),
		[setEditRecord, setPromiseArguments],
	);

	const handleModalConfirm = async (
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
	) => {
		if (!promiseArguments) return;
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
			const result = await updateMapping({ input });
			resolve(result.updateNumericRangeMapping);
		} catch (error) {
			reject(error);
		} finally {
			setPromiseArguments(null);
			setEditRecord(null);
		}
	};

	const actionsColumn: GridColDef[] = useMemo(
		() => [
			{
				field: "actions",
				type: "actions",
				headerName: t("ui.data_grid.actions"),
				width: 100,
				getActions: ({ id }) => {
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
							onClick={() => setDeleteConfirmationId(id)}
							disabled={!isAnAdmin}
						/>,
					];
				},
			},
		],
		[rowModesModel, isAnAdmin, t, setRowModesModel, setDeleteConfirmationId],
	);

	const columns = useMemo(
		() => [...standardNumRangeMappingColumns, ...actionsColumn],
		[actionsColumn],
	);

	return (
		<PageContainer title={t("nav.mappings.allNumericRange")}>
			<Stack spacing={4} direction="row" sx={{ mb: 3 }}>
				<Button
					variant="outlined"
					onClick={() => setNewMapping(true)}
					disabled={!isAnAdmin}
				>
					{t("mappings.new")}
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
				processRowUpdate={processRowUpdate}
				checkboxSelection={false}
				disableAggregation
				disableHoverInteractions={false}
				disableRowGrouping
				disablePivoting
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("mappings.no_results")}
				searchText={t("general.search")}
			/>

			<Confirmation
				open={!!promiseArguments || !!deleteConfirmationId}
				onClose={() => {
					if (promiseArguments) {
						promiseArguments.resolve(promiseArguments.oldRow);
						setPromiseArguments(null);
						setEditRecord(null);
					}
					setDeleteConfirmationId(null);
				}}
				onConfirm={handleModalConfirm}
				entityName="NumericRangeMapping"
				action={promiseArguments ? "gridEdit" : "deletion"}
				editInformation={editRecord ?? ""}
			/>
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
