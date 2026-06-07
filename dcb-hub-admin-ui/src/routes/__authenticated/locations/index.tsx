import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import dayjs from "dayjs";

import { Button, Stack, Tooltip } from "@mui/material";
import {
	GridRowModesModel,
	GridPaginationModel,
	GridSortModel,
	GridFilterModel,
	GridColDef,
} from "@mui/x-data-grid-premium";

import AdminLayout from "@layout/AdminLayout/AdminLayout";
import DataGrid from "@components/DataGrid/DataGrid";
import NewLocation from "@forms/NewLocation/NewLocation";
import Import from "@components/Import/Import";

import { useGridStore } from "@/hooks/useDataGridStore";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import useCode from "@hooks/useCode";

import { getLocations } from "@queries/getLocations";
import {
	getSortOrderForServer,
	processGridFilterModel,
} from "@helpers/dataGrid/utilities";
import { standardFilters } from "@filters/standardFilters";
import { equalsOnly } from "@filters/equalsOnly";
import { luceneDateRangeOperators } from "@filters/luceneDateRangeOperators";
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
		sortModel: storedSortModel,
		filterModel: storedFilterModel,
		paginationModel: storedPaginationModel,
		columnVisibilityModel: storedColumnVisibilityModel,
		setSortModel,
		setFilterModel,
		setPaginationModel,
		setColumnVisibilityModel,
	} = useGridStore();

	const storedState = {
		sort: storedSortModel[gridId],
		filter: storedFilterModel[gridId],
		pagination: storedPaginationModel[gridId],
		columnVisibility: storedColumnVisibilityModel[gridId],
	};

	const [paginationModel, setLocalPaginationModel] =
		useState<GridPaginationModel>(
			storedState.pagination ?? { page: 0, pageSize: 200 },
		);
	const [filterModel, setLocalFilterModel] = useState<GridFilterModel>(
		storedState.filter ?? { items: [] },
	);
	const [sortModel, setLocalSortModel] = useState<GridSortModel>(
		storedState.sort ?? [{ field: "lastImported", sort: "desc" }],
	);
	const [columnVisibilityModel, setLocalColumnVisibilityModel] = useState(
		storedState.columnVisibility ?? {
			id: false,
			lastImported: false,
			localId: false,
			isEnabledForPickupAnywhere: false,
			agencyCode: false,
		},
	);
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

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
		queryFn: async () => {
			const queryVariables = {
				query: processGridFilterModel(filterModel, "", []) ?? "",
				pageno: paginationModel.page ?? 0,
				pagesize: paginationModel.pageSize ?? 200,
				order: sortModel[0]?.field ?? "lastImported",
				orderBy: getSortOrderForServer(sortModel[0]?.sort) ?? "DESC",
			};
			return gqlClient.request(getLocations, queryVariables);
		},
		placeholderData: (previousData) => previousData,
	});

	const handlePaginationChange = useCallback(
		(model: GridPaginationModel) => {
			setLocalPaginationModel(model);
			setPaginationModel(gridId, model);
		},
		[gridId, setPaginationModel],
	);

	const handleSortChange = useCallback(
		(model: GridSortModel) => {
			setLocalSortModel(model);
			setSortModel(gridId, model);
		},
		[gridId, setSortModel],
	);

	const handleFilterChange = useCallback(
		(model: GridFilterModel) => {
			setLocalFilterModel(model);
			setFilterModel(gridId, model);
		},
		[gridId, setFilterModel],
	);

	const handleColumnVisibilityChange = useCallback(
		(model: any) => {
			setLocalColumnVisibilityModel(model);
			setColumnVisibilityModel(gridId, model);
		},
		[gridId, setColumnVisibilityModel],
	);

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
		<AdminLayout title={t("nav.locations")}>
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
		</AdminLayout>
	);
}
