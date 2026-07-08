import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
// Internal Components & Layouts
import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";

// Hooks & Queries
import { useGridState } from "@hooks/useGridState";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getBibs } from "@queries/getBibs";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import { standardBibColumns } from "@columns/bibColumns";
import { bibColumnVisibility } from "@columns/columnVisibility/bibColumnVisbility";

export const Route = createFileRoute("/__authenticated/bibs/")({
	component: BibsRouteComponent,
});

function BibsRouteComponent() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();

	const gridId = "sourceBibs";

	// No bib column is user-sortable, so the grid's sort model stays empty; the
	// default server order (dateCreated desc) is applied by the query fallbacks
	// below. Seeding a sort on a non-existent column would make MUI emit an
	// onSortModelChange during its render-phase init.
	const {
		paginationModel,
		sortModel,
		filterModel,
		rowModesModel,
		setRowModesModel,
		onPaginationModelChange,
		onSortModelChange,
		onFilterModelChange,
	} = useGridState(gridId, { pagination: { page: 0, pageSize: 25 } });

	const {
		data: gridData,
		isLoading: gridLoading,
		isFetching,
	} = useQuery({
		queryKey: ["sourceBibs", gridId, paginationModel, sortModel, filterModel],
		queryFn: () =>
			gqlClient.request<any>(
				getBibs,
				buildServerGridQueryVars({
					filterModel,
					sortModel,
					paginationModel,
					defaultOrder: "dateCreated",
					defaultPageSize: 25,
				}),
			),
		placeholderData: (previousData) => previousData,
	});

	const shouldShowLoading = gridLoading || (isFetching && !!gridData);

	return (
		<PageContainer
			title={t("nav.bibs")}
			docLink="https://openlibraryfoundation.atlassian.net/wiki/x/GgAnyg"
			subtitle={t("ui.reference.catalog_build")}
		>
			<DataGrid
				identifier={gridId}
				type={"bibs"}
				columns={standardBibColumns}
				columnVisibilityModel={bibColumnVisibility}
				rows={gridData?.sourceBibs?.content ?? []}
				rowCount={gridData?.sourceBibs?.totalSize ?? 0}
				loading={shouldShowLoading}
				paginationMode="server"
				pagination
				paginationModel={paginationModel}
				onPaginationModelChange={onPaginationModelChange}
				sortingMode="server"
				sortModel={sortModel}
				onSortModelChange={onSortModelChange}
				filterMode="server"
				filterModel={filterModel}
				onFilterModelChange={onFilterModelChange}
				editMode="row"
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
				checkboxSelection={false}
				exportConfig={{
					query: getBibs,
					coreType: "sourceBibs",
				}}
				disableAggregation
				disableHoverInteractions={false}
				disableRowGrouping
				disablePivoting
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("ui.data_grid.no_results")}
				searchText={t("ui.data_grid.search")}
			/>
		</PageContainer>
	);
}
