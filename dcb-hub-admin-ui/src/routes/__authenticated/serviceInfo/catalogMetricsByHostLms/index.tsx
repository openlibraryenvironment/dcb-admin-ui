import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { GridColDef } from "@mui/x-data-grid-premium";
import { Stack, Typography } from "@mui/material";
import dayjs from "dayjs";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";

import { useGridState } from "@hooks/useGridState";
import { useDcbRestClient } from "@hooks/useDcbRestClient";
import {
	allImportIngestDetailsQueryOptions,
	processingStateCount,
} from "@helpers/importIngestDetails";

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/catalogMetricsByHostLms/",
)({
	component: CatalogMetricsByHostLms,
});

function CatalogMetricsByHostLms() {
	const { t } = useTranslation();
	const client = useDcbRestClient();

	const gridId = "catalogMetricsByHostLms";

	const {
		paginationModel,
		sortModel,
		filterModel,
		columnVisibilityModel,
		rowModesModel,
		setRowModesModel,
		onPaginationModelChange: handlePaginationChange,
		onSortModelChange: handleSortChange,
		onFilterModelChange: handleFilterChange,
		onColumnVisibilityModelChange: handleColumnVisibilityChange,
	} = useGridState(gridId, {
		pagination: { page: 0, pageSize: 20 },
		sort: [{ field: "name", sort: "asc" }],
		columnVisibility: {
			id: false,
			checkPointId: false,
			sourceSystemId: false,
		},
	});

	const {
		data: records,
		isLoading,
		isError,
		refetch,
	} = useQuery(allImportIngestDetailsQueryOptions(client));

	const countedAt = records?.[0]?.countedAt;

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
				valueGetter: (value, row) =>
					processingStateCount(row, "PROCESSING_REQUIRED"),
			},
			{
				field: "failed",
				headerName: t("catalogMetricsByHostLms.failed"),
				flex: 0.5,
				groupable: false,
				type: "number",
				valueGetter: (value, row) => processingStateCount(row, "FAILURE"),
			},
			{
				field: "ingested",
				headerName: t("catalogMetricsByHostLms.ingested"),
				flex: 0.5,
				groupable: false,
				type: "number",
				valueGetter: (value, row) => processingStateCount(row, "SUCCESS"),
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
			// The SAME chrome as the loaded branch, titled with the generic label for
			// this kind of record. Withholding the breadcrumbs and the title box and
			// adding them when the data lands inserts 77px above the page and pushes it
			// down; the specific name replaces this on one line, so the box does not
			// change height. See docs/performance-budget.md, "Layout shift on every
			// route".
			<PageContainer title={t("nav.serviceInfo.catalogMetricsByHostLms")}>
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
					description={t("catalogMetricsByHostLms.list_timeout")}
					action={t("ui.actions.try_again")}
					onAction={() => void refetch()}
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
			<Stack spacing={2}>
				<Typography variant="attributeText">
					{countedAt
						? `${t("catalogMetricsByHostLms.counted_at", {
								time: dayjs(countedAt).format("YYYY-MM-DD HH:mm:ss"),
							})} `
						: ""}
					{t("catalogMetricsByHostLms.shared_count")}
				</Typography>
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
					disableAggregation={false}
					disableHoverInteractions={false}
					disableRowGrouping
					disablePivoting
					listViewEnabled={false}
					pivotingEnabled={false}
					toolbarVisible
					scrollbarVisible={false}
					noResultsText={t("catalogMetricsByHostLms.no_results")}
					searchText={t("ui.data_grid.search")}
					rowModesModel={rowModesModel}
					onRowModesModelChange={setRowModesModel}
				/>
			</Stack>
		</PageContainer>
	);
}
