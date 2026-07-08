import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";

import { Button, Stack, Tooltip } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import NewLocation from "@forms/NewLocation/NewLocation";
import Import from "@components/Import/Import";

import { useGridState } from "@hooks/useGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import useCode from "@hooks/useCode";

import { getLocations } from "@queries/getLocations";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import { defaultLocationColumns } from "@columns/locationColumns";

export const Route = createFileRoute("/__authenticated/locations/")({
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
	const isMinLibraryAdmin = isAnAdmin || userRoles.includes("LIBRARY_ADMIN");

	const gridId = "locations";

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
			localId: false,
			isEnabledForPickupAnywhere: false,
			agencyCode: false,
		},
	});

	const [newLocation, setNewLocation] = useState({
		show: false,
		hostLmsCode: "",
		agencyCode: "",
		libraryName: "",
		ils: "",
	});
	const [showImport, setImport] = useState(false);

	const {
		data: gridData,
		isLoading: gridLoading,
		isFetching,
		refetch,
	} = useQuery({
		queryKey: ["locations", gridId, paginationModel, sortModel, filterModel],
		queryFn: () =>
			gqlClient.request<any>(
				getLocations,
				buildServerGridQueryVars({
					filterModel,
					sortModel,
					paginationModel,
					defaultOrder: "lastImported",
					defaultPageSize: 200,
				}),
			),
		placeholderData: (previousData) => previousData,
	});

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

	const shouldShowLoading = gridLoading || (isFetching && !!gridData);

	const columns: GridColDef[] = useMemo(
		() => [...customColumns, ...defaultLocationColumns],
		[customColumns],
	);

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
				rows={gridData?.locations?.content ?? []}
				rowCount={gridData?.locations?.totalSize ?? 0}
				loading={shouldShowLoading}
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
				checkboxSelection={true}
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
					type="Pickup"
					ils={newLocation.ils}
				/>
			)}

			{showImport && (
				<Import show={showImport} onClose={closeImport} type="Locations" />
			)}
		</PageContainer>
	);
}
