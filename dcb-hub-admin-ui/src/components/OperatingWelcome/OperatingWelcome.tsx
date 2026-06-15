import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	GridColDef,
	GridPaginationModel,
	GridSortModel,
	GridFilterModel,
	GridColumnVisibilityModel,
	GridRowModel,
} from "@mui/x-data-grid-premium";

import DataGrid from "@components/DataGrid/DataGrid";
import { getILS } from "@helpers/getILS";

import { useGridStore } from "@/hooks/useDataGridStore";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { updateLibraryMutation } from "@mutations/updateLibrary";
import { getLibraries } from "@queries/getLibraries";
import { standardFilters } from "@filters/standardFilters";
import { equalsOnly } from "@filters/equalsOnly";

export default function OperatingWelcome() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const gridId = "welcomeLibraries";

	// 1. Pull Global State from Zustand
	const {
		paginationModel: storedPagination,
		sortModel: storedSort,
		filterModel: storedFilter,
		columnVisibilityModel: storedVisibility,
		setPaginationModel,
		setSortModel,
		setFilterModel,
		setColumnVisibilityModel,
	} = useGridStore();

	// 2. Initialize Local State (Falling back to Zustand, then Defaults)
	const [paginationModel, setLocalPaginationModel] =
		useState<GridPaginationModel>(
			storedPagination[gridId] || { page: 0, pageSize: 200 },
		);
	const [sortModel, setLocalSortModel] = useState<GridSortModel>(
		storedSort[gridId] || [{ field: "fullName", sort: "asc" }],
	);
	const [filterModel, setLocalFilterModel] = useState<GridFilterModel>(
		storedFilter[gridId] || { items: [] },
	);
	const [columnVisibilityModel, setLocalVisibilityModel] =
		useState<GridColumnVisibilityModel>(
			storedVisibility[gridId] || {
				id: false,
				hostLmsCatalogue: false,
				hostLmsCirculation: false,
				authProfile: false,
			},
		);

	// 3. TanStack Query for Data Fetching
	const { data, isLoading, isFetching } = useQuery({
		queryKey: ["LoadLibraries", paginationModel, sortModel, filterModel],
		queryFn: async () => {
			const orderBy = sortModel[0]?.sort?.toUpperCase() || "ASC";
			const order = sortModel[0]?.field || "fullName";

			return gqlClient.request<any>(getLibraries, {
				pageno: paginationModel.page,
				pagesize: paginationModel.pageSize,
				order,
				orderBy,
				query: "",
			});
		},
	});

	// 4. TanStack Mutation for Editing Rows (Replaces `editQuery` prop)
	const updateMutation = useMutation({
		mutationFn: async (updatedRow: GridRowModel) => {
			return gqlClient.request(updateLibraryMutation, {
				input: updatedRow,
			});
		},
		onSuccess: () => {
			// Invalidate the cache to force a background refresh of the grid
			queryClient.invalidateQueries({ queryKey: ["LoadLibraries"] });
		},
	});

	const processRowUpdate = async (
		newRow: GridRowModel,
		oldRow: GridRowModel,
	) => {
		try {
			await updateMutation.mutateAsync(newRow);
			return newRow;
		} catch (error) {
			console.error("Failed to update row", error);
			return oldRow; // Reverts the row if the mutation fails
		}
	};

	// 5. State Synchronization Handlers
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

	const handleVisibilityChange = useCallback(
		(m: GridColumnVisibilityModel) => {
			setLocalVisibilityModel(m);
			setColumnVisibilityModel(gridId, m);
		},
		[gridId, setColumnVisibilityModel],
	);

	// 6. Column Definitions
	const columns: GridColDef[] = useMemo(
		() => [
			{
				field: "abbreviatedName",
				headerName: "Abbreviated name",
				flex: 0.3,
				filterOperators: standardFilters,
				editable: true,
			},
			{
				field: "fullName",
				headerName: "Full name",
				flex: 0.5,
				filterOperators: standardFilters,
				editable: true,
			},
			{
				field: "agencyCode",
				headerName: "Agency code",
				flex: 0.3,
				filterOperators: standardFilters,
			},
			{
				field: "ils",
				headerName: "ILS",
				flex: 0.3,
				filterable: false,
				sortable: false,
				valueGetter: (value, row) =>
					getILS(row?.agency?.hostLms?.lmsClientClass),
			},
			{
				field: "clientConfigIngest",
				headerName: "Ingest enabled",
				minWidth: 50,
				flex: 0.3,
				filterable: false,
				sortable: false,
				valueGetter: (value, row) => row?.agency?.hostLms?.clientConfig?.ingest,
			},
			{
				field: "authProfile",
				headerName: "Auth profile",
				flex: 0.5,
				filterable: false,
				sortable: false,
				valueGetter: (value, row) => row?.agency?.authProfile,
			},
			{
				field: "isSupplyingAgency",
				headerName: "Supplying",
				flex: 0.25,
				filterable: false,
				sortable: false,
				valueGetter: (value, row) => {
					const agency = row?.agency;
					if (
						agency &&
						Object.prototype.hasOwnProperty.call(agency, "isSupplyingAgency") &&
						agency?.isSupplyingAgency == null
					)
						return t("libraries.circulation.not_set");
					return row?.agency?.isSupplyingAgency;
				},
			},
			{
				field: "isBorrowingAgency",
				headerName: "Borrowing",
				flex: 0.25,
				filterable: false,
				sortable: false,
				valueGetter: (value, row) => {
					const agency = row?.agency;
					if (
						agency &&
						Object.prototype.hasOwnProperty.call(agency, "isBorrowingAgency") &&
						agency?.isBorrowingAgency == null
					)
						return t("libraries.circulation.not_set");
					return row?.agency?.isBorrowingAgency;
				},
			},
			{
				field: "hostLmsCirculation",
				headerName: "Host LMS (circulation)",
				flex: 0.5,
				filterable: false,
				sortable: false,
				valueGetter: (value, row) => row?.agency?.hostLms?.code,
			},
			{
				field: "hostLmsCatalogue",
				headerName: "Host LMS (catalogue)",
				flex: 0.5,
				filterable: false,
				sortable: false,
				valueGetter: (value, row) => row?.secondHostLms?.code,
			},
			{
				field: "id",
				headerName: "Library UUID",
				flex: 0.5,
				filterOperators: equalsOnly,
			},
		],
		[t],
	);

	return (
		<DataGrid
			identifier={gridId}
			type="welcomeLibraries"
			columns={columns}
			// Map TanStack query response to grid props. Adjust 'libraries.content' to match your actual GraphQL shape
			rows={data?.libraries?.content ?? []}
			rowCount={data?.libraries?.totalElements ?? 0}
			loading={isLoading || isFetching}
			// Pagination
			pagination={true}
			paginationMode="server"
			paginationModel={paginationModel}
			onPaginationModelChange={handlePaginationChange}
			// Sorting
			sortingMode="server"
			sortModel={sortModel}
			onSortModelChange={handleSortChange}
			// Filtering
			filterMode="server"
			filterModel={filterModel}
			onFilterModelChange={handleFilterChange}
			// Visibility
			columnVisibilityModel={columnVisibilityModel}
			onColumnVisibilityModelChange={handleVisibilityChange}
			// Editing
			processRowUpdate={processRowUpdate}
			rowModesModel={{}}
			// Feature Flags
			checkboxSelection={true}
			disableAggregation={true}
			disableHoverInteractions={false}
			disablePivoting={true}
			disableRowGrouping={true}
			listViewEnabled={false}
			pivotingEnabled={false}
			scrollbarVisible={true}
			toolbarVisible={true}
			noResultsText={t("libraries.none_found")}
			searchText={t("libraries.search_placeholder")}
		/>
	);
}
