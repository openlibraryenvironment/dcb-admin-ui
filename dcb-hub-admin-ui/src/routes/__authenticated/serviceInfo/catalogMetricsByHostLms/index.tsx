import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import {
	GridPaginationModel,
	GridSortModel,
	GridFilterModel,
	GridColumnVisibilityModel,
	GridColDef,
	GridRowModesModel,
} from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";

import { useGridStore } from "@/hooks/useDataGridStore";
import { ProcessState } from "@models/ProcessState";

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/catalogMetricsByHostLms/",
)({
	component: CatalogMetricsByHostLms,
});

function CatalogMetricsByHostLms() {
	const { t } = useTranslation();
	const auth = useAuth();

	const gridId = "catalogMetricsByHostLms";
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

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
			storedState.pagination ?? { page: 0, pageSize: 20 },
		);
	const [filterModel, setLocalFilterModel] = useState<GridFilterModel>(
		storedState.filter ?? { items: [] },
	);
	const [sortModel, setLocalSortModel] = useState<GridSortModel>(
		storedState.sort ?? [{ field: "name", sort: "asc" }],
	);
	const [columnVisibilityModel, setLocalColumnVisibilityModel] =
		useState<GridColumnVisibilityModel>(
			storedState.columnVisibility ?? {
				id: false,
				checkPointId: false,
				sourceSystemId: false,
			},
		);

	const {
		data: records,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["catalogMetricsByHostLms"],
		queryFn: async () => {
			const res = await fetch(
				`${import.meta.env.VITE_DCB_API_BASE}/hostlmss/importIngestDetails`,
				{
					headers: { Authorization: `Bearer ${auth.user?.access_token}` },
				},
			);
			if (!res.ok) console.error("Failed to fetch catalog metrics");
			return res.json();
		},
		staleTime: 1000 * 60 * 5, // Cache for 5 minutes since this is a heavy request
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
		(model: GridColumnVisibilityModel) => {
			setLocalColumnVisibilityModel(model);
			setColumnVisibilityModel(gridId, model);
		},
		[gridId, setColumnVisibilityModel],
	);

	const columns: GridColDef[] = useMemo(
		() => [
			{
				field: "name",
				headerName: t("catalogMetricsByHostLms.source_system"),
				flex: 0.75,
			},
			{
				field: "ingestEnabled",
				headerName: t("catalogMetricsByHostLms.harvest_enabled"),
				flex: 0.5,
				type: "boolean",
			},
			{
				field: "sourceRecordCount",
				headerName: t("catalogMetricsByHostLms.harvested"),
				flex: 0.5,
				type: "number",
				groupable: false,
			},
			{
				field: "awaiting",
				headerName: t("catalogMetricsByHostLms.await"),
				flex: 0.5,
				groupable: false,
				type: "number",
				valueGetter: (value, row) => {
					const states: ProcessState[] = row?.processStates || [];
					const state = states.find((s) => s.value === "PROCESSING_REQUIRED");
					return state ? state.count : 0;
				},
			},
			{
				field: "failed",
				headerName: t("catalogMetricsByHostLms.failed"),
				flex: 0.5,
				groupable: false,
				type: "number",
				valueGetter: (value, row) => {
					const states: ProcessState[] = row?.processStates || [];
					const state = states.find((s) => s.value === "FAILURE");
					return state ? state.count : 0;
				},
			},
			{
				field: "ingested",
				headerName: t("catalogMetricsByHostLms.ingested"),
				flex: 0.5,
				groupable: false,
				type: "number",
				valueGetter: (value, row) => {
					const states: ProcessState[] = row?.processStates || [];
					const state = states.find((s) => s.value === "SUCCESS");
					return state ? state.count : 0;
				},
			},
			{
				field: "bibRecordCount",
				headerName: t("nav.bibs"),
				flex: 0.5,
				type: "number",
				groupable: false,
			},
			{
				field: "difference",
				headerName: t("catalogMetricsByHostLms.difference"),
				flex: 0.75,
				type: "number",
				groupable: false,
				valueGetter: (value, row) =>
					(row.sourceRecordCount || 0) - (row.bibRecordCount || 0),
			},
			{
				field: "id",
				headerName: t("catalogMetricsByHostLms.source_system_id"),
				flex: 1,
			},
			{
				field: "checkPointId",
				headerName: t("catalogMetricsByHostLms.checkpoint_id"),
				flex: 1,
			},
		],
		[t],
	);

	if (isLoading) {
		return (
			<PageContainer hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type:
							t("catalogMetricsByHostLms.name").charAt(0).toLowerCase() +
							t("catalogMetricsByHostLms.name").slice(1),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</PageContainer>
		);
	}

	if (isError) {
		return (
			<PageContainer title={t("nav.serviceInfo.catalogMetricsByHostLms")}>
				<Error
					title={t("common.error_loading", {
						page_title: t("nav.serviceInfo.catalogMetricsByHostLms"),
					})}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.actions.reload")}
					// onClick={refetch}
				/>
			</PageContainer>
		);
	}

	return (
		<PageContainer
			title={t("nav.serviceInfo.catalogMetricsByHostLms")}
			docLink="https://openlibraryfoundation.atlassian.net/wiki/x/GgAnyg"
			subtitle={t("ui.reference.catalog_build")}
		>
			<DataGrid
				identifier={gridId}
				type={"catalogMetricsByHostLms"}
				columns={columns}
				rows={records ?? []}
				loading={isLoading}
				paginationMode="client"
				sortingMode="client"
				filterMode="client"
				pagination
				paginationModel={paginationModel}
				onPaginationModelChange={handlePaginationChange}
				sortModel={sortModel}
				onSortModelChange={handleSortChange}
				filterModel={filterModel}
				onFilterModelChange={handleFilterChange}
				columnVisibilityModel={columnVisibilityModel}
				onColumnVisibilityModelChange={handleColumnVisibilityChange}
				checkboxSelection={false}
				disableAggregation={false}
				disableHoverInteractions={false}
				disableRowGrouping
				disablePivoting
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("catalogMetricsByHostLms.no_results")}
				searchText={t("general.search")}
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
			/>
		</PageContainer>
	);
}
