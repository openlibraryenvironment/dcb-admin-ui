import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
import { Grid } from "@mui/material";
import {
	GridColDef,
	type GridRowGroupingModel,
	type GridRowModesModel,
} from "@mui/x-data-grid-premium";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { useGridView } from "@hooks/useGridView";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import { rememberedViewRedirect } from "@helpers/viewState/viewRoute";
import { clusterExplanationView } from "@constants/dataGrid/gridViews";

import DataGrid from "@components/DataGrid/DataGrid";
import Link from "@components/Link/Link";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import Loading from "@components/Loading/Loading";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import {
	CLUSTERING_EVENT_KINDS,
	type ClusteringEventKind,
	clusteringEventLabelKey,
	parseClusteringAuditLog,
} from "@helpers/parseClusteringAuditLog";
import ClusteringEventChip from "@components/ClusteringEventChip/ClusteringEventChip";

export const Route = createFileRoute(
	"/__authenticated/search/$clusterId/clusterExplanation",
)({
	validateSearch: validateGridSearch,
	beforeLoad: ({ search, location, params }) => {
		const restore = rememberedViewRedirect(
			clusterExplanationView,
			search,
			location.state,
		);
		if (restore)
			throw redirect({
				to: "/search/$clusterId/clusterExplanation",
				params,
				...restore,
			});
	},
	component: ClusterExplanation,
});

function ClusterExplanation() {
	const { t } = useTranslation();
	const { clusterId } = Route.useParams();
	const client = useDcbRestClient();

	const gridId = clusterExplanationView.id;
	const search = useSearch({
		from: "/__authenticated/search/$clusterId/clusterExplanation",
	});
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
	// Events grouped under the bib they explain: a group row's "(n)" is that bib's event count
	const [rowGroupingModel, setRowGroupingModel] =
		useState<GridRowGroupingModel>(["subjectId"]);

	// A failure throws to the route's error component, inside the cluster page's tabs
	const { data, isLoading } = useQuery({
		queryKey: ["clusterAuditLog", clusterId],
		queryFn: async () => {
			const res = await client.get(`/clusters/${clusterId}/audit-log`);
			return res.data;
		},
		enabled: !!clusterId,
	});

	const rows = useMemo(() => parseClusteringAuditLog(data), [data]);

	const columns: GridColDef[] = useMemo(
		() => [
			{
				field: "subjectId",
				headerName: t("search.bib_record_id_and_number"),
				minWidth: 200,
				flex: 1,
			},
			{
				field: "eventType",
				headerName: t("search.event_type"),
				minWidth: 200,
				flex: 0.75,
				type: "singleSelect",
				valueOptions: CLUSTERING_EVENT_KINDS.map((kind) => ({
					value: kind,
					label: t(clusteringEventLabelKey(kind)),
				})),
				// A group row has no event of its own
				renderCell: (params) =>
					params.value ? (
						<ClusteringEventChip kind={params.value as ClusteringEventKind} />
					) : null,
			},
			{
				field: "matchCriteria",
				headerName: t("search.identifier"),
				minWidth: 150,
				flex: 0.5,
			},
			{
				field: "matchValue",
				headerName: t("ui.data_grid.value"),
				minWidth: 200,
				flex: 0.75,
			},
			{
				// A date, to the second, so a bib's run sorts from the matches to their outcome
				field: "timestamp",
				headerName: t("search.formatted_timestamp"),
				minWidth: 170,
				type: "dateTime",
				valueGetter: (value: string | null) => (value ? new Date(value) : null),
				valueFormatter: (value: Date | null) =>
					value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "",
			},
			{
				field: "matchedBibId",
				headerName: t("search.bib_matched_against"),
				// A whole UUID, so it can be read and copied
				minWidth: 290,
				renderCell: ({ value }) =>
					value ? (
						<Link
							to="/bibs/$bibId"
							params={{ bibId: value }}
							onClick={(e: React.MouseEvent) => e.stopPropagation()}
						>
							{value}
						</Link>
					) : null,
			},
			{
				field: "matchedClusterId",
				headerName: t("search.cluster_matched"),
				minWidth: 290,
				renderCell: ({ value }) =>
					value ? (
						<Link
							to="/search/$clusterId/cluster"
							params={{ clusterId: value }}
							onClick={(e: React.MouseEvent) => e.stopPropagation()}
						>
							{value}
						</Link>
					) : null,
			},
			{
				field: "message",
				headerName: t("ui.data_grid.message"),
				minWidth: 200,
			},
		],
		[t],
	);
	const view = useGridView(clusterExplanationView, columns, search);

	if (isLoading)
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("nav.search.cluster_explainer").toLowerCase(),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);

	return (
		<Grid
			container
			spacing={{ xs: 2, md: 3 }}
			columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
		>
			<Grid size={{ xs: 4, sm: 8, md: 12 }}>
				<DataGrid
					identifier={gridId}
					type="ClusterExplainer"
					columns={columns}
					viewNotice={<GridViewNotice view={view} />}
					rows={rows}
					loading={isLoading}
					paginationMode="client"
					sortingMode="client"
					filterMode="client"
					pagination
					paginationModel={view.paginationModel}
					onPaginationModelChange={view.onPaginationModelChange}
					sortModel={view.sortModel}
					onSortModelChange={view.onSortModelChange}
					filterModel={view.filterModel}
					onFilterModelChange={view.onFilterModelChange}
					columnVisibilityModel={view.columnVisibilityModel}
					onColumnVisibilityModelChange={view.onColumnVisibilityModelChange}
					columnLayout={view.columnLayout}
					getDetailPanelContent={({ row }: any) =>
						row?.eventType ? (
							<MasterDetail row={row} type="ClusterExplainer" />
						) : null
					}
					rowGroupingModel={rowGroupingModel}
					onRowGroupingModelChange={setRowGroupingModel}
					groupingColDef={{ minWidth: 350 }}
					// Open, so every event shows without a click per bib
					defaultGroupingExpansionDepth={-1}
					disableRowGrouping={false}
					disableHoverInteractions={false}
					listViewEnabled={false}
					toolbarVisible
					scrollbarVisible={false}
					noResultsText={t("ui.data_grid.no_results")}
					searchText={t("ui.data_grid.search")}
					rowModesModel={rowModesModel}
					onRowModesModelChange={setRowModesModel}
				/>
			</Grid>
		</Grid>
	);
}
