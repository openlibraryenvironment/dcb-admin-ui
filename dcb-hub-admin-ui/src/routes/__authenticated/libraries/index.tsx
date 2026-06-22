import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Button, Stack, useTheme } from "@mui/material";
import { Delete, Edit, Save, Cancel, GroupAdd } from "@mui/icons-material";
import {
	GridPaginationModel,
	GridSortModel,
	GridFilterModel,
	GridColumnVisibilityModel,
	GridRowModesModel,
	GridRowModel,
	GridRowModes,
	GridActionsCellItem,
	GridRowParams,
	useGridApiRef,
	GridColDef,
} from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import Loading from "@components/Loading/Loading";
import Confirmation from "@components/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";

import AddLibraryToGroup from "@forms/AddLibraryToGroup/AddLibraryToGroup";
import NewLibrary from "@forms/NewLibrary/NewLibrary";

import { useGridStore } from "@/hooks/useDataGridStore";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { getILS } from "@helpers/getILS";
import {
	getSortOrderForServer,
	processGridFilterModel,
} from "@helpers/dataGrid/utilities";

import { getLibraries } from "@queries/getLibraries";
import { updateLibraryMutation } from "@mutations/updateLibrary";
import { deleteLibraryMutation } from "@mutations/deleteLibrary";
import { computeMutation } from "@helpers/computeMutation";
import { findConsortium } from "@helpers/findConsortium";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";
import { libraryColumns } from "@columns/libraryColumns";

export const Route = createFileRoute("/__authenticated/libraries/")({
	component: Libraries,
});

function Libraries() {
	const { t } = useTranslation();
	const router = useRouter();
	const theme = useTheme();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const customColumns = useCustomColumns();
	const auth = useAuth();
	const { displayName } = useConsortiumInfoStore();

	const apiRef = useGridApiRef();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	const gridId = "librariesList";

	const {
		paginationModel: storedPaginationModel,
		sortModel: storedSortModel,
		filterModel: storedFilterModel,
		columnVisibilityModel: storedColumnVisibilityModel,
		setPaginationModel,
		setSortModel,
		setFilterModel,
		setColumnVisibilityModel,
	} = useGridStore();

	const [paginationModel, setLocalPaginationModel] =
		useState<GridPaginationModel>(
			storedPaginationModel[gridId] ?? { page: 0, pageSize: 200 },
		);
	const [filterModel, setLocalFilterModel] = useState<GridFilterModel>(
		storedFilterModel[gridId] ?? { items: [] },
	);
	const [sortModel, setLocalSortModel] = useState<GridSortModel>(
		storedSortModel[gridId] ?? [{ field: "abbreviatedName", sort: "asc" }],
	);
	const [columnVisibilityModel, setLocalColumnVisibilityModel] =
		useState<GridColumnVisibilityModel>(
			storedColumnVisibilityModel[gridId] ?? {
				id: false,
				clientConfigIngest: false,
				isSupplyingAgency: false,
				isBorrowingAgency: false,
				hostLmsCatalogue: false,
				hostLmsCirculation: false,
			},
		);

	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
	const [promiseArguments, setPromiseArguments] = useState<any>(null);
	const [deleteLibraryId, setDeleteLibraryId] = useState<string | null>(null);

	const [showNewLibrary, setShowNewLibrary] = useState(false);
	const [groupModalLibraries, setGroupModalLibraries] = useState<
		{ id: string; name: string }[] | null
	>(null);
	const [alert, setAlert] = useState({
		open: false,
		severity: "success",
		text: "",
		title: "",
	});

	const {
		data: gridData,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: [gridId, paginationModel, sortModel, filterModel],
		queryFn: async () => {
			const queryVariables = {
				query: processGridFilterModel(filterModel, "", []) ?? "",
				pageno: paginationModel.page ?? 0,
				pagesize: paginationModel.pageSize ?? 200,
				order: sortModel[0]?.field ?? "abbreviatedName",
				orderBy: getSortOrderForServer(sortModel[0]?.sort) ?? "ASC",
			};
			return gqlClient.request<any>(getLibraries, queryVariables);
		},
		placeholderData: (previousData) => previousData,
	});

	const { mutateAsync: updateLibrary } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request(updateLibraryMutation, variables),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: [gridId] }),
	});
	const { mutate: deleteLibrary } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request(deleteLibraryMutation, variables),
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
				const result = await updateLibrary({ input });
				resolve(result.updateLibrary);
			} catch (error) {
				reject(error);
			} finally {
				setPromiseArguments(null);
			}
		} else if (deleteLibraryId) {
			deleteLibrary(
				{
					input: {
						id: deleteLibraryId,
						reason,
						changeCategory,
						changeReferenceUrl,
					},
				},
				{ onSettled: () => setDeleteLibraryId(null) },
			);
		}
	};

	const handleBulkAddToGroup = () => {
		// Read directly from the DataGrid API to get fully selected row objects
		const selectedRowModels = apiRef.current?.getSelectedRows() || new Map();
		const selectedLibraries = Array.from(selectedRowModels.values()).map(
			(row: any) => ({
				id: row.id,
				name: row.fullName,
			}),
		);

		if (selectedLibraries.length > 0) setGroupModalLibraries(selectedLibraries);
	};

	const handlePaginationChange = useCallback(
		(m: GridPaginationModel) => {
			setLocalPaginationModel(m);
			setPaginationModel(gridId, m);
		},
		[gridId, setPaginationModel],
	);
	const handleSortChange = useCallback(
		(m: GridSortModel) => {
			setLocalSortModel(m);
			setSortModel(gridId, m);
		},
		[gridId, setSortModel],
	);
	const handleFilterChange = useCallback(
		(m: GridFilterModel) => {
			setLocalFilterModel(m);
			setFilterModel(gridId, m);
		},
		[gridId, setFilterModel],
	);
	const handleColumnVisibilityChange = useCallback(
		(m: GridColumnVisibilityModel) => {
			setLocalColumnVisibilityModel(m);
			setColumnVisibilityModel(gridId, m);
		},
		[gridId, setColumnVisibilityModel],
	);

	const columns: GridColDef[] = useMemo(
		() => [
			...customColumns,
			...libraryColumns,
			{
				field: "actions",
				type: "actions",
				headerName: t("ui.actions"),
				width: 140,
				getActions: ({ id, row }: GridRowParams) => {
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
							key="addToGroup"
							icon={<GroupAdd />}
							label={t("libraries.add_to_group")}
							onClick={(e) => {
								e.stopPropagation();
								setGroupModalLibraries([{ id: row.id, name: row.fullName }]);
							}}
							disabled={!isAnAdmin}
							showInMenu
						/>,
						<GridActionsCellItem
							key="edit"
							icon={<Edit />}
							label={t("ui.edit")}
							onClick={(e) => {
								e.stopPropagation();
								setRowModesModel({
									...rowModesModel,
									[id]: { mode: GridRowModes.Edit },
								});
							}}
							disabled={!isAnAdmin}
							showInMenu
						/>,
						<GridActionsCellItem
							key="delete"
							icon={<Delete />}
							label={t("ui.delete")}
							onClick={(e) => {
								e.stopPropagation();
								setDeleteLibraryId(id as string);
							}}
							disabled={!isAnAdmin}
							showInMenu
						/>,
					];
				},
			},
		],
		[customColumns, rowModesModel, isAnAdmin, t],
	);

	const pageActions = [
		{
			key: "newLibrary",
			onClick: () => setShowNewLibrary(true),
			disabled: !isAnAdmin,
			label: t("libraries.new.title"),
		},
		{
			key: "addToGroup",
			onClick: () => setGroupModalLibraries([]),
			disabled: !isAnAdmin,
			label: t("libraries.add_to_group"),
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
			{/* Bulk Actions Toolbar */}
			{isAnAdmin && (
				<Stack direction="row" spacing={2} sx={{ mb: 2 }}>
					<Button
						variant="outlined"
						startIcon={<GroupAdd />}
						onClick={handleBulkAddToGroup}
					>
						{t("libraries.add_selected_to_group")}
					</Button>
				</Stack>
			)}

			<DataGrid
				identifier={gridId}
				type="libraries"
				parentApiRef={apiRef}
				columns={columns}
				rows={gridData?.libraries?.content ?? []}
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
				checkboxSelection={true} // Enable Bulk Selection
				disableAggregation
				disableRowGrouping
				disableHoverInteractions={false}
				disablePivoting
				editMode="row"
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
				processRowUpdate={processRowUpdate}
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("libraries.none_found")}
				searchText={t("libraries.search_placeholder")}
			/>

			{showNewLibrary && (
				<NewLibrary
					show={showNewLibrary}
					onClose={() => setShowNewLibrary(false)}
					consortiumName={displayName}
				/>
			)}

			{groupModalLibraries !== null && (
				<AddLibraryToGroup
					show={true}
					onClose={() => setGroupModalLibraries(null)}
					selectedLibraries={groupModalLibraries}
				/>
			)}

			<Confirmation
				open={!!promiseArguments || !!deleteLibraryId}
				onClose={() => {
					if (promiseArguments) {
						promiseArguments.resolve(promiseArguments.oldRow);
						setPromiseArguments(null);
					}
					setDeleteLibraryId(null);
				}}
				onConfirm={handleModalConfirm}
				action={promiseArguments ? "gridEdit" : "deletion"}
				entityName="Library"
			/>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				alertText={alert.text}
				alertTitle={alert.title}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
			/>
		</PageContainer>
	);
}
