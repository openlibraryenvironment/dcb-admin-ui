import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import dayjs from "dayjs";
import {
	Button,
	Grid,
	Stack,
	Tooltip,
	Typography,
	useTheme,
} from "@mui/material";
import { Cancel, Delete, Edit, Save } from "@mui/icons-material";
import {
	GridColDef,
	GridRowModes,
	GridRowModel,
	GridActionsCellItem,
	GridRowParams,
} from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import LibraryTabs from "@components/LibraryTabs/LibraryTabs";
import DataGrid from "@components/DataGrid/DataGrid";
import Confirmation from "@components/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import Import from "@components/Import/Import";
import NewLocation from "@forms/NewLocation/NewLocation";

import { useGridState } from "@hooks/useGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import useCode from "@hooks/useCode";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import { handleDeleteEntity } from "@helpers/actions/editAndDeleteActions";
import { luceneDateRangeOperators } from "@filters/luceneDateRangeOperators";
import { getILS } from "@helpers/getILS";

import { getLibrary } from "@queries/getLibrary";
import { deleteLibraryMutation } from "@mutations/deleteLibrary";
import { getLocations } from "@queries/getLocations";
import { updateLocationQuery } from "@mutations/updateLocation";
import { deleteLocationQuery } from "@mutations/deleteLocation";
import { computeMutation } from "@helpers/computeMutation";
import { standardFilters } from "@filters/standardFilters";
import { equalsOnly } from "@filters/equalsOnly";

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/locations/",
)({
	component: LibraryLocations,
});

function LibraryLocations() {
	const { t } = useTranslation();
	const router = useRouter();
	const { libraryId } = Route.useParams();
	const theme = useTheme();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const customColumns = useCustomColumns();
	const auth = useAuth();
	const { updateCategory, updateCode, resetAll } = useCode();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");
	const isMinLibraryAdmin = userRoles.some((role) =>
		["ADMIN", "CONSORTIUM_ADMIN", "LIBRARY_ADMIN"].includes(role),
	);

	const gridId = "libraryLocations";

	const {
		paginationModel,
		sortModel,
		filterModel,
		columnVisibilityModel,
		rowModesModel,
		setRowModesModel,
		onPaginationModelChange: handlePaginationChange,
		onSortModelChange: handleSortChange,
		onFilterModelChange: handleFilterChange,
		onColumnVisibilityModelChange: handleColumnVisibilityChange,
	} = useGridState(gridId, {
		pagination: { page: 0, pageSize: 200 },
		sort: [{ field: "lastImported", sort: "desc" }],
		columnVisibility: {
			id: false,
			lastImported: false,
			agencyCode: false,
			localId: false,
			isEnabledForPickupAnywhere: false,
		},
	});
	const [promiseArguments, setPromiseArguments] = useState<any>(null);
	const [editRecord, setEditRecord] = useState<string | null>(null);

	const [showConfirmationDeletion, setConfirmationDeletion] = useState(false);
	const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null);
	const [showImport, setImport] = useState(false);
	const [newLocation, setNewLocation] = useState({
		show: false,
		hostLmsCode: "",
		agencyCode: "",
		libraryName: "",
		ils: "",
	});
	const [alert, setAlert] = useState({
		open: false,
		severity: "success",
		text: "",
		title: "",
	});

	const {
		data: libraryData,
		isLoading: isLibraryLoading,
		isError: isLibraryError,
	} = useQuery({
		queryKey: ["library", libraryId],
		queryFn: () =>
			gqlClient.request<any>(getLibrary, { query: `id:${libraryId}` }),
		enabled: !!libraryId,
	});

	const library = libraryData?.libraries?.content?.[0];
	const presetQueryVariables = library?.secondHostLms
		? `hostSystem: ${library?.agency?.hostLms?.id} OR hostSystem: ${library?.secondHostLms?.id}`
		: `hostSystem: ${library?.agency?.hostLms?.id}`;

	const {
		data: gridData,
		isLoading: isGridLoading,
		isFetching,
	} = useQuery({
		queryKey: [
			gridId,
			presetQueryVariables,
			paginationModel,
			sortModel,
			filterModel,
		],
		queryFn: async () => {
			return gqlClient.request<any>(
				getLocations,
				buildServerGridQueryVars({
					filterModel,
					sortModel,
					paginationModel,
					baseQuery: presetQueryVariables,
					defaultOrder: "lastImported",
					defaultPageSize: 200,
				}),
			);
		},
		enabled: !!library?.agency?.hostLms?.id,
		placeholderData: (previousData) => previousData,
	});

	const { mutateAsync: updateLocation } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request<any>(updateLocationQuery, variables),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: [gridId] }),
	});
	const { mutate: deleteLocation } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request<any>(deleteLocationQuery, variables),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: [gridId] }),
	});
	const { mutateAsync: deleteLibrary } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request<any>(deleteLibraryMutation, variables),
	});

	const processRowUpdate = useCallback(
		(newRow: GridRowModel, oldRow: GridRowModel) =>
			new Promise<GridRowModel>((resolve, reject) => {
				const changes = computeMutation(newRow, oldRow);
				if (!changes) return resolve(oldRow);
				setEditRecord(changes);
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
				const result = await updateLocation({ input });
				resolve(result.updateLocation);
			} catch (error) {
				reject(error);
			} finally {
				setPromiseArguments(null);
				setEditRecord(null);
			}
		} else if (deleteLocationId) {
			deleteLocation(
				{
					input: {
						id: deleteLocationId,
						reason,
						changeCategory,
						changeReferenceUrl,
					},
				},
				{ onSettled: () => setDeleteLocationId(null) },
			);
		}
	};

	const closeImport = () => {
		setImport(false);
		resetAll();
		queryClient.invalidateQueries({ queryKey: [gridId] });
	};

	const columns: GridColDef[] = useMemo(
		() => [
			...customColumns,
			{
				field: "agencyCode",
				headerName: "Agency code",
				minWidth: 150,
				flex: 0.6,
				filterable: false,
				sortable: false,
				valueGetter: (val, row: any) => row?.agency?.code,
			},
			{
				field: "hostSystemName",
				headerName: "Host LMS name",
				minWidth: 150,
				flex: 0.6,
				filterable: false,
				sortable: false,
				valueGetter: (val, row: any) => row?.hostSystem?.name,
			},
			{
				field: "name",
				headerName: "Location name",
				minWidth: 150,
				flex: 0.6,
				editable: true,
				filterOperators: standardFilters,
			},
			{
				field: "printLabel",
				headerName: "Print label",
				minWidth: 150,
				flex: 0.6,
				editable: true,
				filterOperators: standardFilters,
			},
			{
				field: "code",
				headerName: "Location code",
				minWidth: 50,
				flex: 0.4,
				filterOperators: standardFilters,
			},
			{
				field: "isPickup",
				headerName: t("locations.new.pickup_status"),
				minWidth: 50,
				flex: 0.4,
				filterOperators: equalsOnly,
				valueFormatter: (val: boolean) =>
					val === true
						? t("consortium.settings.enabled")
						: val === false
							? t("consortium.settings.disabled")
							: t("locations.new.pickup_not_set"),
			},
			{
				field: "isEnabledForPickupAnywhere",
				headerName: t("locations.new.pickup_anywhere_status"),
				minWidth: 50,
				flex: 0.4,
				filterOperators: equalsOnly,
				valueFormatter: (val: boolean) =>
					val === true
						? t("consortium.settings.enabled")
						: val === false
							? t("consortium.settings.disabled")
							: t("locations.new.pickup_not_set"),
			},
			{
				field: "localId",
				headerName: t("locations.local_id"),
				minWidth: 50,
				flex: 0.8,
				filterOperators: equalsOnly,
				editable: true,
			},
			{
				field: "id",
				headerName: "Location UUID",
				minWidth: 50,
				flex: 0.8,
				filterOperators: standardFilters,
			},
			{
				field: "lastImported",
				headerName: "Last imported",
				minWidth: 100,
				flex: 0.5,
				filterOperators: luceneDateRangeOperators,
				type: "dateTime",
				valueGetter: (val: any, row: any) =>
					row.lastImported ? new Date(row.lastImported) : null,
				valueFormatter: (val: Date) =>
					val ? dayjs(val).format("YYYY-MM-DD HH:mm") : "",
			},
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
							label={t("ui.data_grid.edit")}
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
							label={t("ui.data_grid.delete")}
							onClick={() => setDeleteLocationId(id as string)}
							disabled={!isAnAdmin}
						/>,
					];
				},
			},
		],
		[customColumns, rowModesModel, setRowModesModel, isAnAdmin, t],
	);

	if (isLibraryLoading)
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("nav.locations").toLowerCase(),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);
	if (isLibraryError || !library)
		return (
			<Error
				title={t("ui.error.cannot_retrieve_record")}
				action={t("ui.actions.go_back")}
				goBack="/libraries"
				message={t("error.invalid_UUID")}
			/>
		);

	return (
		<PageContainer
			title={library?.fullName}
			pageActions={[
				{
					key: "delete",
					onClick: () => setConfirmationDeletion(true),
					disabled: !isAnAdmin,
					label: t("ui.data_grid.delete_entity", {
						entity: t("libraries.library").toLowerCase(),
					}),
					startIcon: (
						<Delete htmlColor={theme.palette.primary.exclamationIcon} />
					),
				},
			]}
		>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<LibraryTabs libraryId={libraryId} value={7} />
				</Grid>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography
						variant="h2"
						sx={{
							fontWeight: "bold",
							mb: 2,
						}}
					>
						{t("nav.locations")}
					</Typography>

					{isAnAdmin && (
						<Stack spacing={4} direction="row" sx={{ mb: 2 }}>
							<Button
								variant="outlined"
								onClick={() =>
									setNewLocation({
										show: true,
										hostLmsCode: library?.agency?.hostLms?.code,
										agencyCode: library?.agencyCode,
										libraryName: library?.fullName,
										ils: getILS(library?.agency?.hostLms?.lmsClientClass) || "",
									})
								}
							>
								{t("locations.new.button")}
							</Button>
							<Tooltip
								title={isMinLibraryAdmin ? "" : t("mappings.import_disabled")}
							>
								<span>
									<Button
										variant="outlined"
										onClick={() => {
											updateCategory("Locations");
											updateCode(library?.agency?.hostLms?.code);
											setImport(true);
										}}
										disabled={!isMinLibraryAdmin}
									>
										{t("locations.import.button")}
									</Button>
								</span>
							</Tooltip>
						</Stack>
					)}

					<DataGrid
						identifier={gridId}
						type="libraryLocations"
						columns={columns}
						rows={gridData?.locations?.content ?? []}
						rowCount={gridData?.locations?.totalSize ?? 0}
						loading={isGridLoading || isFetching}
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
						checkboxSelection={true}
						exportConfig={{
							query: getLocations,
							coreType: "locations",
							baseQuery: presetQueryVariables,
							wizard: true,
						}}
						disableAggregation
						disableRowGrouping
						disableHoverInteractions={false}
						disablePivoting={true}
						editMode="row"
						rowModesModel={rowModesModel}
						onRowModesModelChange={setRowModesModel}
						processRowUpdate={processRowUpdate}
						listViewEnabled={false}
						pivotingEnabled={false}
						toolbarVisible
						scrollbarVisible={false}
						noResultsText={t("locations.no_results")}
						searchText={t("locations.search_placeholder")}
					/>
				</Grid>
			</Grid>
			{newLocation.show && (
				<NewLocation
					show={newLocation.show}
					onClose={() =>
						setNewLocation({
							show: false,
							hostLmsCode: "",
							agencyCode: "",
							libraryName: "",
							ils: "",
						})
					}
					hostLmsCode={newLocation.hostLmsCode}
					agencyCode={newLocation.agencyCode}
					libraryName={newLocation.libraryName}
					type="Pickup"
					ils={newLocation.ils}
				/>
			)}
			{showImport && (
				<Import
					show={showImport}
					onClose={closeImport}
					type="Locations"
					presetHostLms={library?.agency?.hostLms?.code}
					presetHostLmsId={library?.agency?.hostLms?.id}
					libraryName={library?.fullName}
				/>
			)}
			<Confirmation
				open={!!promiseArguments || !!deleteLocationId}
				onClose={() => {
					if (promiseArguments) {
						promiseArguments.resolve(promiseArguments.oldRow);
						setPromiseArguments(null);
						setEditRecord(null);
					}
					setDeleteLocationId(null);
				}}
				onConfirm={handleModalConfirm}
				action={promiseArguments ? "gridEdit" : "deletion"}
				entityName="Location"
				editInformation={editRecord ?? undefined}
			/>
			<Confirmation
				open={showConfirmationDeletion}
				onClose={() => setConfirmationDeletion(false)}
				onConfirm={(r, c, u) => {
					handleDeleteEntity(
						libraryId,
						r,
						c,
						u,
						setAlert,
						deleteLibrary,
						t,
						router,
						library?.fullName,
						"deleteLibrary",
						"/libraries",
					);
					setConfirmationDeletion(false);
				}}
				action="deletion"
				entityName={library?.fullName}
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
