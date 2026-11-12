import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Grid, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import {
	GridColDef,
	GridRowModesModel,
	type GridPaginationModel,
} from "@mui/x-data-grid-premium";

import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Link from "@components/Link/Link";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { clusterFullQuery } from "@/queryOptions/cluster";
import { hostLmsSelectionQuery } from "@/queryOptions/hostLms";
import { useMemo, useState } from "react";

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

	const { data, isLoading, error } = useQuery(
		clusterFullQuery(gqlClient, clusterId),
	);

	const cluster = data?.instanceClusters?.content?.[0];
	// No toolbar, so nothing to share: the page lives here. It needs a change handler -
	// a controlled model without one left members past page 1 unreachable.
	const [paginationModel, onPaginationModelChange] =
		useState<GridPaginationModel>({ page: 0, pageSize: 25 });

	const hostLmss = useQuery(hostLmsSelectionQuery(gqlClient));
	const selectedBib = cluster?.selectedBib;
	const columns: GridColDef[] = useMemo(() => {
		const systems = new Map<string, string>(
			(hostLmss.data?.hostLms?.content ?? []).map(
				(system: { id: string; name: string }) => [system.id, system.name],
			),
		);
		return [
			{
				field: "title",
				headerName: t("ui.data_grid.title"),
				minWidth: 300,
				flex: 0.5,
			},
			{
				field: "selected",
				headerName: t("search.members.selected"),
				minWidth: 120,
				valueGetter: (_value, row) =>
					row.id === selectedBib ? t("search.members.selected_yes") : "",
			},
			{
				field: "sourceSystemId",
				headerName: t("hostlms.hostlms_one"),
				minWidth: 160,
				valueGetter: (value: string | null) =>
					(value && systems.get(value)) ?? value ?? "",
			},
			{
				field: "sourceRecordId",
				headerName: t("bibRecords.source_record_id"),
				minWidth: 140,
			},
			{ field: "author", headerName: t("search.author"), minWidth: 180 },
			{
				field: "typeOfRecord",
				headerName: t("bibRecords.record_type"),
				minWidth: 120,
			},
			{
				field: "processingState",
				headerName: t("search.members.processing_state"),
				minWidth: 160,
				valueGetter: (_value, row) => row.sourceRecord?.processingState ?? "",
			},
			{
				field: "lastProcessed",
				headerName: t("search.members.last_processed"),
				minWidth: 170,
				type: "dateTime",
				valueGetter: (_value, row) =>
					row.sourceRecord?.lastProcessed
						? new Date(row.sourceRecord.lastProcessed)
						: null,
				valueFormatter: (value: Date | null) =>
					value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "",
			},
		];
	}, [t, hostLmss.data, selectedBib]);

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
				message={t("ui.error.invalid_UUID")}
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
					paginationModel={paginationModel}
					onPaginationModelChange={onPaginationModelChange}
					getDetailPanelContent={({ row }: any) => (
						<MasterDetail row={row} type="cluster" />
					)}
					paginationMode="client"
					sortingMode="client"
					filterMode="client"
					disableHoverInteractions={false}
					listViewEnabled={false}
					toolbarVisible={false}
					pagination
					scrollbarVisible={false}
					noResultsText={t("ui.data_grid.no_results")}
					searchText=""
					rowModesModel={rowModesModel}
					onRowModesModelChange={setRowModesModel}
				/>
			</Grid>
		</Grid>
	);
}
