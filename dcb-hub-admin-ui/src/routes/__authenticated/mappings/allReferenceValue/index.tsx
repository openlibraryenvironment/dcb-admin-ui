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
import NewMapping from "@forms/NewMapping/NewMapping";

import { useMappingGridState } from "@/hooks/useMappingGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { standardRefValueMappingColumns } from "@columns/referenceValueMappingColumns";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import { computeMutation } from "@helpers/computeMutation";

import { getMappings } from "@queries/getMappings";
import { getHostLmsCodes } from "@queries/getHostLmsCodes";
import { updateReferenceValueMapping } from "@mutations/updateReferenceValueMapping";
import { deleteReferenceValueMapping } from "@mutations/deleteReferenceValueMapping";
import type {
	DeleteEntityInput,
	DeleteReferenceValueMappingMutationVariables,
	LoadHostLmsCodesQueryVariables,
	LoadMappingsQueryVariables,
	UpdateReferenceValueMappingMutationVariables,
} from "@generated/graphql";

export const Route = createFileRoute(
	"/__authenticated/mappings/allReferenceValue/",
)({
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

	const gridId = "referenceValueMappings";

	// is this really better?
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
		showNewMapping,
		setNewMapping,
	} = useMappingGridState(gridId, { lastImported: false, toCategory: false });

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
	});
	const hostLmsCodes: string[] = useMemo(
		() =>
			(hostLmsData?.hostLms?.content ?? [])
				.map((hostLms: { code: string }) => hostLms.code)
				.filter(Boolean),
		[hostLmsData],
	);

	const {
		data: gridData,
		isLoading: gridLoading,
		isFetching,
	} = useQuery({
		queryKey: [gridId, paginationModel, sortModel, filterModel],
		queryFn: async () => {
			return gqlClient.request<any, LoadMappingsQueryVariables>(
				getMappings,
				buildServerGridQueryVars({
					filterModel,
					sortModel,
					paginationModel,
					baseQuery: "(fromContext: * AND NOT deleted:true)",
					defaultOrder: "lastImported",
					defaultPageSize: 20,
				}),
			);
		},
		placeholderData: (previousData) => previousData,
	});

	const { mutateAsync: updateMapping } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request<any, UpdateReferenceValueMappingMutationVariables>(
				updateReferenceValueMapping,
				variables,
			),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: [gridId] }),
	});

	// The mutation declares `$input: DeleteEntityInput!`. This previously passed a
	// bare `{ id }`, so the non-null $input was never supplied and the delete was
	// rejected by the server. The audit fields the confirmation dialog collects were
	// being discarded as well.
	const { mutate: deleteMapping } = useMutation({
		mutationFn: (input: DeleteEntityInput) =>
			gqlClient.request<any, DeleteReferenceValueMappingMutationVariables>(
				deleteReferenceValueMapping,
				{ input },
			),
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
			resolve(result.updateReferenceValueMapping);
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
				getActions: ({ id, columns: rowColumns }) => {
					// Without fieldToFocus the row swaps to inputs with nothing focused.
					const fieldToFocus = rowColumns.find((col) => col.editable)?.field;
					if (rowModesModel[id]?.mode === GridRowModes.Edit) {
						return [
							<GridActionsCellItem
								key="save"
								icon={<Save />}
								label={t("ui.data_grid.save")}
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
								label={t("ui.data_grid.cancel")}
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
							label={t("ui.data_grid.edit")}
							onClick={() =>
								setRowModesModel({
									...rowModesModel,
									[id]: { mode: GridRowModes.Edit, fieldToFocus },
								})
							}
							disabled={!isAnAdmin}
						/>,
						<GridActionsCellItem
							key="delete"
							icon={<Delete />}
							label={t("ui.data_grid.delete")}
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
		() => [...standardRefValueMappingColumns, ...actionsColumn],
		[actionsColumn],
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
				rows={gridData?.referenceValueMappings?.content ?? []}
				rowCount={gridData?.referenceValueMappings?.totalSize ?? 0}
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
				exportConfig={{
					query: getMappings,
					coreType: "referenceValueMappings",
					baseQuery: "(fromContext: * AND NOT deleted:true)",
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

			<Confirmation
				open={!!promiseArguments}
				onClose={() => {
					promiseArguments?.resolve(promiseArguments.oldRow);
					setPromiseArguments(null);
					setEditRecord(null);
				}}
				onConfirm={handleModalConfirm}
				entityName="ReferenceValueMapping"
				editInformation={editRecord ?? ""}
				action="gridEdit"
			/>
			<Confirmation
				open={!!deleteConfirmationId}
				onClose={() => setDeleteConfirmationId(null)}
				onConfirm={(reason, changeCategory, changeReferenceUrl) => {
					if (deleteConfirmationId)
						deleteMapping({
							id: deleteConfirmationId as string,
							reason,
							changeCategory,
							changeReferenceUrl,
						});
					setDeleteConfirmationId(null);
				}}
				entityName="ReferenceValueMapping"
				action="deletion"
			/>
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
