import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { GridColDef, GridRowModel } from "@mui/x-data-grid-premium";

import DataGrid from "@components/DataGrid/DataGrid";
import { getILS } from "@helpers/getILS";

import { useGridView } from "@hooks/useGridView";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { constrainToServerOperators } from "@filters/serverFilterOperators";
import { welcomeLibrariesView } from "@constants/dataGrid/gridViews";
import { welcomeLibrariesQuery } from "@/queryOptions/welcomeLibraries";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { updateLibraryMutation } from "@mutations/updateLibrary";
import { standardFilters } from "@filters/standardFilters";
import { equalsOnly } from "@filters/equalsOnly";

export default function OperatingWelcome() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const gridId = welcomeLibrariesView.id;
	// The home page's only grid: its view is the page's main parameters
	const search = useSearch({ strict: false });

	const updateMutation = useMutation({
		mutationFn: async (updatedRow: GridRowModel) => {
			return gqlClient.request(updateLibraryMutation(), {
				input: updatedRow,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["LoadLibraries"] });
		},
	});

	const processRowUpdate = async (newRow: GridRowModel) => {
		try {
			await updateMutation.mutateAsync(newRow);
			return newRow;
		} catch {
			// Make sure that this throws a custom object so DataGrid can extract the row's name for alerts

			throw {
				message: "Update failed",
				rowName: newRow.fullName || newRow.name,
			};
		}
	};

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
	// What the filter panel offers, which DataGrid narrows to what the server can answer
	const viewColumns = useMemo(
		() => constrainToServerOperators(columns),
		[columns],
	);
	const view = useGridView(welcomeLibrariesView, viewColumns, search);

	const { data, isLoading, isFetching } = useQuery(
		welcomeLibrariesQuery(gqlClient, {
			paginationModel: view.paginationModel,
			sortModel: view.sortModel,
			filterModel: view.appliedFilterModel,
		}),
	);

	return (
		<DataGrid
			identifier={gridId}
			type="welcomeLibraries"
			columns={columns}
			viewNotice={<GridViewNotice view={view} />}
			// Map TanStack query response to grid props. Adjust 'libraries.content' to match your actual GraphQL shape
			rows={data?.libraries?.content ?? []}
			rowCount={data?.libraries?.totalSize ?? 0}
			loading={isLoading || isFetching}
			// Pagination
			pagination={true}
			paginationMode="server"
			paginationModel={view.paginationModel}
			onPaginationModelChange={view.onPaginationModelChange}
			// Sorting
			sortingMode="server"
			sortModel={view.sortModel}
			onSortModelChange={view.onSortModelChange}
			// Filtering
			filterMode="server"
			filterModel={view.filterModel}
			onFilterModelChange={view.onFilterModelChange}
			// Visibility
			columnVisibilityModel={view.columnVisibilityModel}
			onColumnVisibilityModelChange={view.onColumnVisibilityModelChange}
			columnLayout={view.columnLayout}
			// Editing
			processRowUpdate={processRowUpdate}
			rowModesModel={{}}
			// Feature Flags
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
