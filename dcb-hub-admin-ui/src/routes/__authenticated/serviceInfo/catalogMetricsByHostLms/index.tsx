import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { GridColDef } from "@mui/x-data-grid-premium";
import { Alert, Button, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { z } from "@schemas/zod";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import ScopeSelector from "@components/Insights/ScopeSelector";

import { useGridState } from "@hooks/useGridState";
import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { scopeSearchParam } from "@helpers/insightsSearch";
import { scopeCodes, scopeId, selectedScope } from "@helpers/insightsScope";
import { isHostLmsProbesEnabled } from "@helpers/featureFlags";
import { insightsScopeOptionsQuery } from "@/queryOptions/libraries";
import {
	MAX_SCOPED_HOST_LMS,
	allImportIngestDetailsQueryOptions,
	processingStateCount,
	scopedImportIngestDetailsQueryOptions,
	type ImportIngestDetails,
} from "@helpers/importIngestDetails";

// The same scope encoding as Insights, so a link to one reads the same on the other.
const catalogMetricsSearchSchema = z.object({ scope: scopeSearchParam });

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/catalogMetricsByHostLms/",
)({
	validateSearch: catalogMetricsSearchSchema,
	component: CatalogMetricsByHostLms,
});

function CatalogMetricsByHostLms() {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const navigate = useNavigate({
		from: "/serviceInfo/catalogMetricsByHostLms/",
	});
	const { scope = [] } = useSearch({
		from: "/__authenticated/serviceInfo/catalogMetricsByHostLms/",
	});
	// An older dcb-service ignores hostLmsCodes and counts the whole consortium, which
	// would be shown as the selection's count
	const canScope = isHostLmsProbesEnabled();

	const gqlClient = useGraphQLClient();
	const {
		data: options = [],
		isLoading: scopeLoading,
		isError: scopeFailed,
	} = useQuery({ ...insightsScopeOptionsQuery(gqlClient), enabled: canScope });
	const selected = useMemo(
		() => selectedScope(options, scope),
		[options, scope],
	);
	const codes = useMemo(() => scopeCodes(selected), [selected]);

	// A failed list counts as resolved, as on Insights: the count is consortium-wide and
	// the selector says why
	const scoped = canScope && scope.length > 0 && !scopeFailed;
	// Until the library list arrives a scoped URL resolves to no codes, and asking then
	// would start the consortium-wide count the reader did not ask for.
	const resolving = scoped && options.length === 0;
	const nothingToCount = scoped && !resolving && codes.length === 0;
	const tooMany = codes.length > MAX_SCOPED_HOST_LMS;

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
		isFetching,
		isError,
		refetch,
	} = useQuery<
		ImportIngestDetails[],
		Error,
		ImportIngestDetails[],
		readonly unknown[]
	>({
		...(scoped
			? scopedImportIngestDetailsQueryOptions(client, codes)
			: allImportIngestDetailsQueryOptions(client)),
		enabled: !resolving && !nothingToCount && !tooMany,
		placeholderData: keepPreviousData,
	});

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

	return (
		<PageContainer
			title={t("nav.serviceInfo.catalogMetricsByHostLms")}
			docLink="https://openlibraryfoundation.atlassian.net/wiki/x/GgAnyg"
			subtitle={t("ui.reference.catalog_build")}
		>
			<Stack spacing={2}>
				{canScope && (
					<ScopeSelector
						options={options}
						value={selected}
						onChange={(next) =>
							navigate({
								search: {
									scope: next.length > 0 ? next.map(scopeId) : undefined,
								},
								replace: true,
							})
						}
						loading={scopeLoading}
						failed={scopeFailed}
					/>
				)}
				<Typography variant="attributeText" role="status">
					{countedAt && !isFetching
						? `${t("catalogMetricsByHostLms.counted_at", {
								time: dayjs(countedAt).format("YYYY-MM-DD HH:mm:ss"),
							})} `
						: ""}
					{t(
						scoped
							? "catalogMetricsByHostLms.scoped_count"
							: "catalogMetricsByHostLms.shared_count",
					)}
				</Typography>
				{tooMany && (
					<Alert severity="warning">
						{t("catalogMetricsByHostLms.too_many", {
							max: MAX_SCOPED_HOST_LMS,
							count: codes.length,
						})}
					</Alert>
				)}
				{nothingToCount && (
					<Alert severity="info">
						{t("catalogMetricsByHostLms.no_host_lms")}
					</Alert>
				)}
				{isError && (
					<Alert
						severity="error"
						action={
							<Button color="inherit" size="small" onClick={() => refetch()}>
								{t("catalogMetricsByHostLms.retry")}
							</Button>
						}
					>
						{scoped
							? t("ui.info.connection_issue")
							: t("catalogMetricsByHostLms.list_timeout")}
					</Alert>
				)}
				<DataGrid
					identifier={gridId}
					type={"catalogMetricsByHostLms"}
					columns={columns}
					rows={tooMany || nothingToCount ? [] : (records ?? [])}
					loading={isFetching || resolving}
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
