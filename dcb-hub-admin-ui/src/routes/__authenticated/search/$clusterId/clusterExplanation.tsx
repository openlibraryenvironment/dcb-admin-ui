import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Grid, Chip } from "@mui/material";
import { CheckCircle, Warning, Info } from "@mui/icons-material";
import {
	GridColDef,
	GridPaginationModel,
	GridSortModel,
	GridFilterModel,
	GridColumnVisibilityModel,
	GridRowModesModel,
} from "@mui/x-data-grid-premium";

import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";

import { useGridStore } from "@/hooks/useDataGridStore";
import { parseClusteringAuditLog } from "@helpers/parseClusteringAuditLog";
import { defaultClusterExplanationVisibility } from "@columns/columnVisibility/defaultClusterExplanationVisibility";

export const Route = createFileRoute(
	"/__authenticated/search/$clusterId/clusterExplanation",
)({
	component: ClusterExplanation,
});

function ClusterExplanation() {
	const { t } = useTranslation();
	const { clusterId } = Route.useParams();
	const auth = useAuth();

	const gridId = "ClusterExplainer";
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const {
		paginationModel: storedPaginationModel,
		sortModel: storedSortModel,
		filterModel: storedFilterModel,
		columnVisibilityModel: storedColumnVisibilityModel,
		setPaginationModel,
		setSortModel,
		setFilterModel,
		setColumnVisibilityModel,
	} = useGridStore();

	const [paginationModel, setLocalPaginationModel] =
		useState<GridPaginationModel>(
			storedPaginationModel[gridId] ?? { page: 0, pageSize: 25 },
		);
	const [sortModel, setLocalSortModel] = useState<GridSortModel>(
		storedSortModel[gridId] ?? [{ field: "formattedTimestamp", sort: "desc" }],
	);
	const [filterModel, setLocalFilterModel] = useState<GridFilterModel>(
		storedFilterModel[gridId] ?? { items: [] },
	);
	const [columnVisibilityModel, setLocalColumnVisibilityModel] =
		useState<GridColumnVisibilityModel>(
			storedColumnVisibilityModel[gridId] ??
				defaultClusterExplanationVisibility,
		);

	const { data, isLoading, isError } = useQuery({
		queryKey: ["clusterAuditLog", clusterId],
		queryFn: async () => {
			const res = await fetch(
				`${import.meta.env.VITE_DCB_API_BASE}/clusters/${clusterId}/audit-log`,
				{
					headers: { Authorization: `Bearer ${auth.user?.access_token}` },
				},
			);
			if (!res.ok) console.error("Could not fetch explanation");
			return res.json();
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
				renderCell: (params) => {
					let color: "success" | "warning" | "info" | "default" = "default";
					let icon = <Info fontSize="small" />;

					if (
						params.value === "Match - high confidence" ||
						params.value === "low confidence matches"
					) {
						color = "success";
						icon = <CheckCircle fontSize="small" />;
					} else if (params.value === "Warning") {
						color = "warning";
						icon = <Warning fontSize="small" />;
					} else if (params.value === "Existing Cluster") {
						color = "info";
					}

					return (
						<Chip
							label={params.value}
							color={color}
							icon={icon}
							size="small"
							variant="outlined"
						/>
					);
				},
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
				field: "formattedTimestamp",
				headerName: t("search.formatted_timestamp"),
				minWidth: 150,
			},
			{
				field: "matchedBibId",
				headerName: t("search.bib_matched_against"),
				width: 100,
			},
			{
				field: "message",
				headerName: t("ui.data_grid.message"),
				minWidth: 200,
			},
		],
		[t],
	);

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
		(model: GridColumnVisibilityModel) => {
			setLocalColumnVisibilityModel(model);
			setColumnVisibilityModel(gridId, model);
		},
		[gridId, setColumnVisibilityModel],
	);

	if (isLoading)
		return (
			<Loading
				title={t("ui.info.loading.document", {
					document_type: t("nav.search.cluster_explainer").toLowerCase(),
				})}
				subtitle={t("ui.info.wait")}
			/>
		);
	if (isError)
		return (
			<Error
				title={t("search.items_error_title")}
				message={t("ui.info.connection_issue")}
				action={t("ui.actions.reload")}
				// onClick={refetch}
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
					rows={rows}
					loading={isLoading}
					paginationMode="client"
					sortingMode="client"
					filterMode="client"
					pagination
					disablePivoting
					paginationModel={paginationModel}
					onPaginationModelChange={handlePaginationChange}
					sortModel={sortModel}
					onSortModelChange={handleSortChange}
					filterModel={filterModel}
					onFilterModelChange={handleFilterChange}
					columnVisibilityModel={columnVisibilityModel}
					onColumnVisibilityModelChange={handleColumnVisibilityChange}
					getDetailPanelContent={({ row }: any) => (
						<MasterDetail row={row} type="ClusterExplainer" />
					)}
					checkboxSelection={false}
					disableAggregation={false}
					disableRowGrouping={false}
					disableHoverInteractions={false}
					listViewEnabled={false}
					pivotingEnabled={false}
					toolbarVisible
					scrollbarVisible={false}
					noResultsText={t("ui.info.no_results")}
					searchText={t("general.search")}
					rowModesModel={rowModesModel}
					onRowModesModelChange={setRowModesModel}
				/>
			</Grid>
		</Grid>
	);
}
