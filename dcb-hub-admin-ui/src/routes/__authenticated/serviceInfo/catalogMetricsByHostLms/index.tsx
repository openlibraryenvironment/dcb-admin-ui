import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	redirect,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { GridColDef, type GridRowModesModel } from "@mui/x-data-grid-premium";
import { Alert, Button, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { z } from "@schemas/zod";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import ScopeSelector from "@components/Insights/ScopeSelector";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";

import { useGridView } from "@hooks/useGridView";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import { rememberedViewRedirect } from "@helpers/viewState/viewRoute";
import { catalogMetricsByHostLmsView } from "@constants/dataGrid/gridViews";
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
	// A link that names a scope is a link: nothing remembered is restored over it
	validateSearch: (search: Record<string, unknown>) => ({
		...catalogMetricsSearchSchema.parse(search),
		...validateGridSearch(search),
	}),
	beforeLoad: ({ search, location }) => {
		const restore = rememberedViewRedirect(
			catalogMetricsByHostLmsView,
			search,
			location.state,
		);
		if (restore)
			throw redirect({
				to: "/serviceInfo/catalogMetricsByHostLms",
				...restore,
			});
	},
	component: CatalogMetricsByHostLms,
});

function CatalogMetricsByHostLms() {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const navigate = useNavigate({
		from: "/serviceInfo/catalogMetricsByHostLms/",
	});
	const search = useSearch({
		from: "/__authenticated/serviceInfo/catalogMetricsByHostLms/",
	});
	const { scope = [] } = search;
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

	const gridId = catalogMetricsByHostLmsView.id;
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

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
	const view = useGridView(catalogMetricsByHostLmsView, columns, search);

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
								// The grid's own view stays as it is
								search: {
									...search,
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
					viewNotice={<GridViewNotice view={view} />}
					rows={tooMany || nothingToCount ? [] : (records ?? [])}
					loading={isFetching || resolving}
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
					disableAggregation={false}
					aggregationModel={view.aggregationModel}
					onAggregationModelChange={view.onAggregationModelChange}
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
