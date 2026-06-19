import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	GridRowModesModel,
	GridPaginationModel,
	GridSortModel,
	GridFilterModel,
} from "@mui/x-data-grid-premium";
// bibs - info call n ot working
// Internal Components & Layouts
import AdminLayout from "@layout/AdminLayout/AdminLayout";
import DataGrid from "@components/DataGrid/DataGrid";

// Hooks & Queries
import { useGridStore } from "@/hooks/useDataGridStore";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getBibs } from "@queries/getBibs";
import {
	getSortOrderForServer,
	processGridFilterModel,
} from "@helpers/dataGrid/utilities";
import { standardBibColumns } from "@columns/bibColumns";
import { bibColumnVisibility } from "@columns/columnVisibility/bibColumnVisbility";

export const Route = createFileRoute("/__authenticated/bibs/")({
	component: BibsRouteComponent,
});

function BibsRouteComponent() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();

	const gridId = "sourceBibs";

	const {
		sortModel: storedSortModel,
		filterModel: storedFilterModel,
		paginationModel: storedPaginationModel,
		setSortModel,
		setFilterModel,
		setPaginationModel,
	} = useGridStore();

	const storedState = {
		sort: storedSortModel[gridId],
		filter: storedFilterModel[gridId],
		pagination: storedPaginationModel[gridId],
	};

	const [paginationModel, setLocalPaginationModel] =
		useState<GridPaginationModel>(
			storedState.pagination ?? { page: 0, pageSize: 25 },
		);
	const [filterModel, setLocalFilterModel] = useState<GridFilterModel>(
		storedState.filter ?? { items: [] },
	);
	const [sortModel, setLocalSortModel] = useState<GridSortModel>(
		storedState.sort ?? [{ field: "dateCreated", sort: "desc" }],
	);
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const {
		data: gridData,
		isLoading: gridLoading,
		isFetching,
	} = useQuery({
		queryKey: ["sourceBibs", gridId, paginationModel, sortModel, filterModel],
		queryFn: async () => {
			const queryVariables = {
				query: processGridFilterModel(filterModel, "", []) ?? "",
				pageno: paginationModel.page ?? 0,
				pagesize: paginationModel.pageSize ?? 25,
				order: sortModel[0]?.field ?? "dateCreated",
				orderBy: getSortOrderForServer(sortModel[0]?.sort) ?? "DESC",
			};

			return gqlClient.request(getBibs, queryVariables);
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

	const shouldShowLoading = gridLoading || (isFetching && !!gridData);

	return (
		<AdminLayout
			title={t("nav.bibs")}
			docLink="https://openlibraryfoundation.atlassian.net/wiki/x/GgAnyg"
			subtitle={t("reference.catalog_build")}
		>
			<DataGrid
				identifier={gridId}
				type={gridId}
				columns={standardBibColumns}
				columnVisibilityModel={bibColumnVisibility}
				rows={gridData?.bibs?.content ?? []}
				rowCount={gridData?.bibs?.totalSize ?? 0}
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
				editMode="row"
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
				checkboxSelection={false}
				disableAggregation
				disableHoverInteractions={false}
				disableRowGrouping
				disablePivoting
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("audit.no_results")}
				searchText={t("general.search")}
			/>
		</AdminLayout>
	);
}
