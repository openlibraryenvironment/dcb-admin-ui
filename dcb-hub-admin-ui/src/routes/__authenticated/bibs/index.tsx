import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
// Internal Components & Layouts
import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import type { GridRowModesModel } from "@mui/x-data-grid-premium";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { useGridView } from "@hooks/useGridView";
import { constrainToServerOperators } from "@filters/serverFilterOperators";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import {
	defaultQueryModels,
	rememberedViewRedirect,
} from "@helpers/viewState/viewRoute";
import { sourceBibsView } from "@constants/dataGrid/gridViews";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { sourceBibsQuery } from "@/queryOptions/gridQueries";

// Hooks & Queries
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getBibs } from "@queries/getBibs";
import { getStandardBibColumns } from "@columns/bibColumns";

export const Route = createFileRoute("/__authenticated/bibs/")({
	validateSearch: validateGridSearch,
	loaderDeps: ({ search }) => search,
	beforeLoad: ({ search, location }) => {
		const restore = rememberedViewRedirect(
			sourceBibsView,
			search,
			location.state,
		);
		if (restore) throw redirect({ to: "/bibs", ...restore });
	},
	loader: ({ context: { queryClient, cfg, auth }, deps, location, cause }) => {
		// Skip prefetching for unauthenticated visitors - see hostlmss/index.tsx.
		if (!auth?.isAuthenticated) return;
		// The reader paging or sorting: the grid is already fetching it
		if (cause === "stay") return;
		const models = defaultQueryModels(sourceBibsView, deps, location.state);
		if (!models) return;
		return queryClient.ensureQueryData(
			sourceBibsQuery(createGraphQLClient(cfg, auth), models),
		);
	},
	component: BibsRouteComponent,
});

function BibsRouteComponent() {
	const { t } = useTranslation();
	const columns = useMemo(() => getStandardBibColumns(t), [t]);
	const gqlClient = useGraphQLClient();

	const gridId = sourceBibsView.id;
	const search = useSearch({ from: "/__authenticated/bibs/" });
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	// What the filter panel offers, which DataGrid narrows to what the server can answer
	const viewColumns = useMemo(
		() => constrainToServerOperators(columns),
		[columns],
	);
	const view = useGridView(sourceBibsView, viewColumns, search);

	const {
		data: gridData,
		isLoading: gridLoading,
		isFetching,
	} = useQuery(
		sourceBibsQuery(gqlClient, {
			paginationModel: view.paginationModel,
			sortModel: view.sortModel,
			filterModel: view.appliedFilterModel,
		}),
	);

	// No bib column is user-sortable, so the grid's sort model stays empty; the
	// default server order (dateCreated desc) is applied by the query fallbacks
	// below. Seeding a sort on a non-existent column would make MUI emit an
	// onSortModelChange during its render-phase init.

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
				columns={columns}
				viewNotice={<GridViewNotice view={view} />}
				columnVisibilityModel={view.columnVisibilityModel}
				onColumnVisibilityModelChange={view.onColumnVisibilityModelChange}
				columnLayout={view.columnLayout}
				rows={gridData?.sourceBibs?.content ?? []}
				rowCount={gridData?.sourceBibs?.totalSize ?? 0}
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
				editMode="row"
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
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
