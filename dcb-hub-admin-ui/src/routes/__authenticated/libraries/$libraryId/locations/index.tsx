import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
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
import { Delete } from "@mui/icons-material";
import { GridColDef, type GridRowModesModel } from "@mui/x-data-grid-premium";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import type { LoadLocationsQueryVariables } from "@generated/graphql";

import PageContainer from "@layout/PageContainer/PageContainer";
import LibraryTabs from "@components/LibraryTabs/LibraryTabs";
import DataGrid from "@components/DataGrid/DataGrid";
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import Import from "@components/Import/Import";
import NewLocation from "@forms/NewLocation/NewLocation";

import { useGridView } from "@hooks/useGridView";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { constrainToServerOperators } from "@filters/serverFilterOperators";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import {
	rememberedViewRedirect,
	scopedView,
} from "@helpers/viewState/viewRoute";
import { libraryLocationsView } from "@constants/dataGrid/gridViews";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useEntityMutation } from "@hooks/useEntityMutation";
import { useCustomColumns } from "@hooks/useCustomColumns";
import useCode from "@hooks/useCode";
import { buildRowEditActionsColumn } from "@helpers/dataGrid/buildRowEditActions";
import { luceneDateRangeOperators } from "@filters/luceneDateRangeOperators";
import { getILS } from "@helpers/getILS";

import { libraryQuery } from "@/queryOptions/library";
import { getLocations } from "@queries/getLocations";
import { standardFilters } from "@filters/standardFilters";
import { equalsOnly } from "@filters/equalsOnly";

export const Route = createFileRoute(
	"/__authenticated/libraries/$libraryId/locations/",
)({
	validateSearch: validateGridSearch,
	beforeLoad: ({ search, location, params }) => {
		const restore = rememberedViewRedirect(
			scopedView(libraryLocationsView, params.libraryId),
			search,
			location.state,
		);
		if (restore)
			throw redirect({
				to: "/libraries/$libraryId/locations",
				params,
				...restore,
			});
	},
	component: LibraryLocations,
});

function LibraryLocations() {
	const { t } = useTranslation();
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
	// Was widened with LIBRARY_ADMIN. That role cannot reach this application at all now,
	// so the extra term was unreachable and the two flags had become the same answer.
	const isMinLibraryAdmin = isAnAdmin;

	const gridView = useMemo(
		() => scopedView(libraryLocationsView, libraryId),
		[libraryId],
	);
	const gridId = gridView.id;
	const search = useSearch({
		from: "/__authenticated/libraries/$libraryId/locations/",
	});
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	// The grid edits and deletes locations; the page action deletes the library.
	const locationMutation = useEntityMutation("location");
	const libraryMutation = useEntityMutation("library");

	const [showImport, setImport] = useState(false);
	const [newLocation, setNewLocation] = useState({
		show: false,
		hostLmsCode: "",
		agencyCode: "",
		libraryName: "",
		ils: "",
	});

	const {
		data: library,
		isLoading: isLibraryLoading,
		isError: isLibraryError,
	} = useQuery(libraryQuery(gqlClient, libraryId));

	const presetQueryVariables = library?.secondHostLms
		? `hostSystem: ${library?.agency?.hostLms?.id} OR hostSystem: ${library?.secondHostLms?.id}`
		: `hostSystem: ${library?.agency?.hostLms?.id}`;

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
			buildRowEditActionsColumn({
				t,
				rowModesModel,
				setRowModesModel,
				onDelete: (id, row) =>
					locationMutation.requestDelete({
						id: id as string,
						name: row.name,
					}),
				canEdit: isAnAdmin,
			}),
		],
		[
			customColumns,
			rowModesModel,
			setRowModesModel,
			isAnAdmin,
			t,
			locationMutation,
		],
	);
	// What the filter panel offers, which DataGrid narrows to what the server can answer
	const viewColumns = useMemo(
		() => constrainToServerOperators(columns),
		[columns],
	);
	const view = useGridView(gridView, viewColumns, search);

	const {
		data: gridData,
		isLoading: isGridLoading,
		isFetching,
	} = useQuery({
		queryKey: [
			gridId,
			presetQueryVariables,
			view.paginationModel,
			view.sortModel,
			view.appliedFilterModel,
		],
		queryFn: async () => {
			return gqlClient.request<any, LoadLocationsQueryVariables>(
				getLocations,
				buildServerGridQueryVars({
					filterModel: view.appliedFilterModel,
					sortModel: view.sortModel,
					paginationModel: view.paginationModel,
					baseQuery: presetQueryVariables,
					defaultOrder: "lastImported",
					defaultPageSize: libraryLocationsView.defaultPageSize,
				}),
			);
		},
		enabled: !!library?.agency?.hostLms?.id,
		placeholderData: (previousData) => previousData,
	});

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
				message={t("ui.error.invalid_UUID")}
			/>
		);

	return (
		<PageContainer
			title={library?.fullName}
			pageActions={[
				libraryMutation.buildDeleteAction({
					id: libraryId,
					name: library?.fullName,
					redirect: "/libraries",
					disabled: !isAnAdmin,
					icon: <Delete htmlColor={theme.palette.primary.exclamationIcon} />,
				}),
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
						viewNotice={<GridViewNotice view={view} />}
						rows={gridData?.locations?.content ?? []}
						rowCount={gridData?.locations?.totalSize ?? 0}
						loading={isGridLoading || isFetching}
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
						rowSelection
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
						processRowUpdate={locationMutation.requestGridEdit}
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
					type="PICKUP"
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
			<EntityMutationDialogs {...locationMutation.dialogProps} />
			<EntityMutationDialogs {...libraryMutation.dialogProps} />
		</PageContainer>
	);
}
