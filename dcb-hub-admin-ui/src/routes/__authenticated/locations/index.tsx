import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { type GridRowModesModel, GridColDef } from "@mui/x-data-grid-premium";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { useGridView } from "@hooks/useGridView";
import { constrainToServerOperators } from "@filters/serverFilterOperators";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import {
	defaultQueryModels,
	rememberedViewRedirect,
} from "@helpers/viewState/viewRoute";
import { locationsView } from "@constants/dataGrid/gridViews";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { locationsQuery } from "@/queryOptions/gridQueries";

import { Button, Stack, Tooltip } from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import EntityMutationDialogs from "@components/EntityMutationDialogs/EntityMutationDialogs";
import NewLocation from "@forms/NewLocation/NewLocation";
import Import from "@components/Import/Import";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { useEntityMutation } from "@hooks/useEntityMutation";
import useCode from "@hooks/useCode";

import { getLocations } from "@queries/getLocations";
import { buildRowEditActionsColumn } from "@helpers/dataGrid/buildRowEditActions";
import { getDefaultLocationColumns } from "@columns/locationColumns";

export const Route = createFileRoute("/__authenticated/locations/")({
	validateSearch: validateGridSearch,
	loaderDeps: ({ search }) => search,
	beforeLoad: ({ search, location }) => {
		const restore = rememberedViewRedirect(
			locationsView,
			search,
			location.state,
		);
		if (restore) throw redirect({ to: "/locations", ...restore });
	},
	loader: ({ context: { queryClient, cfg, auth }, deps, location, cause }) => {
		// Skip prefetching for unauthenticated visitors - see hostlmss/index.tsx.
		if (!auth?.isAuthenticated) return;
		// The reader paging or sorting: the grid is already fetching it
		if (cause === "stay") return;
		const models = defaultQueryModels(locationsView, deps, location.state);
		if (!models) return;
		return queryClient.ensureQueryData(
			locationsQuery(createGraphQLClient(cfg, auth), models),
		);
	},
	component: LocationsRouteComponent,
});

function LocationsRouteComponent() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();
	const auth = useAuth();
	const { updateCategory, updateCode, resetAll } = useCode();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");
	// Was `isAnAdmin || LIBRARY_ADMIN`. The second term is unreachable now that role
	// cannot reach this application at all.
	const isMinLibraryAdmin = isAnAdmin;

	const gridId = locationsView.id;
	const search = useSearch({ from: "/__authenticated/locations/" });
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const locationMutation = useEntityMutation("location");

	const [newLocation, setNewLocation] = useState({
		show: false,
		hostLmsCode: "",
		agencyCode: "",
		libraryName: "",
		ils: "",
	});
	const [showImport, setImport] = useState(false);

	const closeImport = () => {
		setImport(false);
		resetAll();
		refetch();
	};

	const openImport = () => {
		updateCategory("Locations");
		updateCode("");
		setImport(true);
	};

	const columns: GridColDef[] = useMemo(
		() => [
			...customColumns,
			...getDefaultLocationColumns(t),
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
	const view = useGridView(locationsView, viewColumns, search);

	const {
		data: gridData,
		isLoading: gridLoading,
		isFetching,
		refetch,
	} = useQuery(
		locationsQuery(gqlClient, {
			paginationModel: view.paginationModel,
			sortModel: view.sortModel,
			filterModel: view.appliedFilterModel,
		}),
	);

	const shouldShowLoading = gridLoading || (isFetching && !!gridData);

	return (
		<PageContainer title={t("nav.locations")}>
			{isAnAdmin && (
				<Stack spacing={4} direction="row" sx={{ mb: 3 }}>
					<Button
						data-tid="new-location-button"
						variant="outlined"
						onClick={() => {
							setNewLocation({
								show: true,
								hostLmsCode: "",
								agencyCode: "",
								libraryName: "",
								ils: "",
							});
						}}
					>
						{t("locations.new.button")}
					</Button>
					<Tooltip
						title={isMinLibraryAdmin ? "" : t("mappings.import_disabled")}
					>
						<span>
							<Button
								variant="outlined"
								onClick={openImport}
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
				type="locations"
				columns={columns}
				viewNotice={<GridViewNotice view={view} />}
				rows={gridData?.locations?.content ?? []}
				rowCount={gridData?.locations?.totalSize ?? 0}
				loading={shouldShowLoading}
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
				processRowUpdate={locationMutation.requestGridEdit}
				rowSelection
				exportConfig={{
					query: getLocations,
					coreType: "locations",
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
				noResultsText={t("locations.no_results")}
				searchText={t("locations.search_placeholder")}
			/>

			{newLocation.show && (
				<NewLocation
					show={newLocation.show}
					onClose={() => {
						setNewLocation({
							show: false,
							hostLmsCode: "",
							agencyCode: "",
							libraryName: "",
							ils: "",
						});
						refetch();
					}}
					hostLmsCode={newLocation.hostLmsCode}
					agencyCode={newLocation.agencyCode}
					libraryName={newLocation.libraryName}
					type="PICKUP"
					ils={newLocation.ils}
				/>
			)}

			{showImport && (
				<Import show={showImport} onClose={closeImport} type="Locations" />
			)}

			<EntityMutationDialogs {...locationMutation.dialogProps} />
		</PageContainer>
	);
}
