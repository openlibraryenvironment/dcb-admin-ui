import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Grid, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { GridColDef, GridRowModesModel } from "@mui/x-data-grid-premium";

import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Link from "@components/Link/Link";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getClusters } from "@queries/getClusters";
import { useGridStore } from "@/hooks/useDataGridStore";
import { useState } from "react";

export const Route = createFileRoute(
	"/__authenticated/search/$clusterId/cluster",
)({
	component: ClusterDetails,
});

function ClusterDetails() {
	const { t } = useTranslation();
	const { clusterId } = Route.useParams();
	const gqlClient = useGraphQLClient();
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const { data, isLoading, error } = useQuery({
		queryKey: ["cluster", "full", clusterId],
		queryFn: () =>
			gqlClient.request<any>(getClusters, { query: `id: ${clusterId}` }),
		enabled: !!clusterId,
	});

	const { paginationModel } = useGridStore();

	const cluster = data?.instanceClusters?.content?.[0];
	const gridId = "clustermembers";

	const columns: GridColDef[] = [
		{
			field: "title",
			headerName: t("ui.data_grid.title"),
			minWidth: 300,
			flex: 0.5,
		},
	];

	if (isLoading)
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("nav.search.cluster").toLowerCase(),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);
	if (error && !(error as any).message?.includes("Source emitted")) {
		return (
			<Error
				title={t("ui.error.cannot_retrieve_record")}
				action={t("ui.actions.go_back")}
				goBack="/search"
				message={t("error.error")} /** TODO */
			/>
		);
	}

	return (
		<Grid
			container
			spacing={{ xs: 2, md: 3 }}
			columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
		>
			<Grid size={{ xs: 2, sm: 4, md: 4 }}>
				<Stack direction="column">
					<Typography variant="attributeTitle">
						{t("ui.info.date_created")}
					</Typography>
					<RenderAttribute
						attribute={dayjs(cluster?.dateCreated).format("YYYY-MM-DD HH:mm")}
					/>
				</Stack>
			</Grid>
			<Grid size={{ xs: 2, sm: 4, md: 4 }}>
				<Stack direction="column">
					<Typography variant="attributeTitle">
						{t("ui.info.date_updated")}
					</Typography>
					<RenderAttribute
						attribute={dayjs(cluster?.dateUpdated).format("YYYY-MM-DD HH:mm")}
					/>
				</Stack>
			</Grid>
			<Grid size={{ xs: 2, sm: 4, md: 4 }}>
				<Stack direction="column">
					<Typography variant="attributeTitle">
						{t("requesting.selected_bib_uuid")}
					</Typography>
					<Link to={`/bibs/${cluster?.selectedBib}`} underline="hover">
						<RenderAttribute attribute={cluster?.selectedBib} />
					</Link>
				</Stack>
			</Grid>
			<Grid size={{ xs: 2, sm: 4, md: 4 }}>
				<Stack direction="column">
					<Typography variant="attributeTitle">
						{t("search.cluster_deleted")}
					</Typography>
					<RenderAttribute attribute={String(cluster?.isDeleted)} />
				</Stack>
			</Grid>
			<Grid size={{ xs: 2, sm: 4, md: 4 }}>
				<Stack direction="column">
					<Typography variant="attributeTitle">
						{t("ui.info.last_indexed")}
					</Typography>
					<RenderAttribute
						attribute={dayjs(cluster?.lastIndexed).format(
							"YYYY-MM-DD HH:mm:ss",
						)}
					/>
				</Stack>
			</Grid>

			<Grid size={{ xs: 4, sm: 8, md: 12 }} sx={{ mt: 2 }}>
				<DataGrid
					identifier="clusterMembers"
					type="clusterMembers"
					columns={columns}
					rows={cluster?.members ?? []}
					loading={isLoading}
					paginationModel={paginationModel[gridId] ?? { page: 0, pageSize: 25 }}
					getDetailPanelContent={({ row }: any) => (
						<MasterDetail row={row} type="cluster" />
					)}
					paginationMode="client"
					sortingMode="client"
					filterMode="client"
					checkboxSelection={false}
					disableAggregation
					disableRowGrouping
					disableHoverInteractions={false}
					listViewEnabled={false}
					pivotingEnabled={false}
					toolbarVisible={false}
					pagination
					disablePivoting
					scrollbarVisible={false}
					noResultsText={t("common.no_results")}
					searchText=""
					rowModesModel={rowModesModel}
					onRowModesModelChange={setRowModesModel}
				/>
			</Grid>
		</Grid>
	);
}
