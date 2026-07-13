import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	Box,
	Stack,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateRangePicker } from "@mui/x-date-pickers-pro";
import dayjs from "dayjs";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useChartPalette } from "@hooks/useChartPalette";
import { useInsightsPlotStore, RangePreset } from "@hooks/insightsPlotStore";
import {
	dashboardQueryOptions,
	demandByPickupLocationQueryOptions,
	demandByPatronGroupQueryOptions,
	topRequestedTitlesQueryOptions,
	unmetLocalDemandQueryOptions,
	acquisitionOpportunitiesQueryOptions,
	consortialLifelineQueryOptions,
	StatsParams,
	PickupLocationDemandStat,
	PatronGroupDemandStat,
	RequestedTitleStat,
	TopClusterStat,
	ConsortialLifelineStat,
} from "@helpers/statsApi";
import {
	rangeToParams,
	intervalForRange,
	intervalForSpan,
	formatDuration,
} from "@helpers/insightsRange";

import KpiTile from "./KpiTile";
import CostAvoidanceTile from "./CostAvoidanceTile";
import StatusFlowChart from "./StatusFlowChart";
import FailureTaxonomyChart from "./FailureTaxonomyChart";
import SupplierReliabilityChart from "./SupplierReliabilityChart";
import TimeInStatusChart from "./TimeInStatusChart";
import SupplierResponseSlaChart from "./SupplierResponseSlaChart";
import DemandHeatmapChart from "./DemandHeatmapChart";
import NetFlowChart from "./NetFlowChart";
import RareGemPanel from "./RareGemPanel";
import BarStatPanel from "./BarStatPanel";
import TableStatPanel from "./TableStatPanel";
import LazyPanel from "./LazyPanel";
import PeerBenchmarkPanel from "./PeerBenchmarkPanel";
import CollectionDimensionPanel from "./CollectionDimensionPanel";
import NewAcquisitionsPanel from "./NewAcquisitionsPanel";

const RANGE_PRESETS: RangePreset[] = ["7d", "30d", "90d", "365d"];

function fillRate(successful: number, failed: number): number | null {
	const total = successful + failed;
	return total === 0 ? null : (successful / total) * 100;
}

export default function InsightsDashboard({
	libraryCode,
}: {
	// Omitted = consortium-wide.
	libraryCode?: string;
}) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const { categorical } = useChartPalette();

	const rangePreset = useInsightsPlotStore((s) => s.rangePreset);
	const setRangePreset = useInsightsPlotStore((s) => s.setRangePreset);
	const customRange = useInsightsPlotStore((s) => s.customRange);
	const setCustomRange = useInsightsPlotStore((s) => s.setCustomRange);

	const { params, interval } = useMemo(() => {
		// An explicit custom window wins over the preset.
		const current = customRange ?? rangeToParams(rangePreset);
		return {
			params: { libraryCode, ...current } as StatsParams,
			interval: customRange
				? intervalForSpan(current.startDate, current.endDate)
				: intervalForRange(rangePreset),
		};
	}, [rangePreset, customRange, libraryCode]);

	// The whole KPI header in ONE round-trip (prior window + all aggregates fanned out
	// server-side). The heavier panels below fetch lazily as they scroll into view.
	const dashboard = useQuery(dashboardQueryOptions(client, params));
	const d = dashboard.data;
	const loading = dashboard.isLoading;

	const currentRate = d
		? fillRate(
				d.fulfillmentCurrent.successfulCount,
				d.fulfillmentCurrent.failedCount,
			)
		: null;
	const priorRate = d
		? fillRate(
				d.fulfillmentPrior.successfulCount,
				d.fulfillmentPrior.failedCount,
			)
		: null;
	const rateDelta =
		currentRate != null && priorRate != null ? currentRate - priorRate : null;

	// Error rate is the complement of the success/fill rate; a rise is bad.
	const currentErrRate = currentRate != null ? 100 - currentRate : null;
	const priorErrRate = priorRate != null ? 100 - priorRate : null;
	const errDelta =
		currentErrRate != null && priorErrRate != null
			? currentErrRate - priorErrRate
			: null;

	const resolved = d
		? d.fulfillmentCurrent.successfulCount + d.fulfillmentCurrent.failedCount
		: 0;
	const totalBorrows = d?.lendBorrowTotals.borrowedCount ?? 0;
	const totalLends = d?.lendBorrowTotals.suppliedCount ?? 0;
	const checkoutRate =
		d && d.checkoutRate.totalCount > 0
			? (d.checkoutRate.reachedCount / d.checkoutRate.totalCount) * 100
			: null;

	return (
		<Stack spacing={3}>
			<Stack
				direction="row"
				spacing={2}
				sx={{
					justifyContent: "flex-end",
					alignItems: "center",
					flexWrap: "wrap",
					rowGap: 1,
				}}
			>
				<Typography variant="body2" color="text.secondary">
					{t("insights.range.label")}
				</Typography>
				<ToggleButtonGroup
					size="small"
					exclusive
					// No preset is highlighted while a custom range is active.
					value={customRange ? null : rangePreset}
					onChange={(_e, value) => value && setRangePreset(value)}
					aria-label={t("insights.range.label")}
				>
					{RANGE_PRESETS.map((preset) => (
						<ToggleButton key={preset} value={preset}>
							{t(`insights.range.${preset}`)}
						</ToggleButton>
					))}
				</ToggleButtonGroup>
				<LocalizationProvider dateAdapter={AdapterDayjs}>
					<DateRangePicker
						value={
							customRange
								? [dayjs(customRange.startDate), dayjs(customRange.endDate)]
								: [null, null]
						}
						onChange={(value) => {
							const [start, end] = value;
							if (start && end) {
								setCustomRange({
									startDate: start.startOf("day").toISOString(),
									endDate: end.endOf("day").toISOString(),
								});
							} else if (!start && !end) {
								setCustomRange(null);
							}
						}}
						disableFuture
						slotProps={{ textField: { size: "small" } }}
						localeText={{
							start: t("insights.range.from"),
							end: t("insights.range.to"),
						}}
					/>
				</LocalizationProvider>
			</Stack>

			{/* KPI row - auto-fit so the tile count can flex. */}
			<Box
				sx={{
					display: "grid",
					gap: 2,
					gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
				}}
			>
				<KpiTile
					title={t("insights.kpi.fill_rate.title")}
					value={currentRate != null ? `${currentRate.toFixed(1)}%` : "—"}
					deltaPct={rateDelta}
					higherIsBetter
					subtitle={t("insights.kpi.vs_prior")}
					loading={loading}
				/>
				<KpiTile
					title={t("insights.kpi.error_rate.title")}
					value={currentErrRate != null ? `${currentErrRate.toFixed(1)}%` : "—"}
					deltaPct={errDelta}
					higherIsBetter={false}
					subtitle={t("insights.kpi.vs_prior")}
					loading={loading}
				/>
				<KpiTile
					title={t("insights.kpi.time_to_loan.title")}
					value={formatDuration(d?.turnaroundToLoaned?.p50Seconds)}
					subtitle={t("insights.kpi.time_to_loan.subtitle", {
						p95: formatDuration(d?.turnaroundToLoaned?.p95Seconds),
					})}
					loading={loading}
				/>
				<KpiTile
					title={t("insights.kpi.resolved.title")}
					value={resolved.toLocaleString()}
					subtitle={t("insights.kpi.resolved.subtitle")}
					loading={loading}
				/>
				<CostAvoidanceTile
					fulfilled={d?.fulfillmentCurrent.successfulCount ?? 0}
					loading={loading}
				/>
			</Box>

			{/* Second KPI row: checkout, flow totals, rescues, unique demand. */}
			<Box
				sx={{
					display: "grid",
					gap: 2,
					gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
				}}
			>
				<KpiTile
					title={t("insights.kpi.checkout_rate.title")}
					value={checkoutRate != null ? `${checkoutRate.toFixed(1)}%` : "—"}
					subtitle={
						d
							? t("insights.kpi.checkout_rate.subtitle", {
									reached: d.checkoutRate.reachedCount,
									total: d.checkoutRate.totalCount,
								})
							: undefined
					}
					loading={loading}
				/>
				<KpiTile
					title={t("insights.kpi.total_borrows.title")}
					value={totalBorrows.toLocaleString()}
					subtitle={t("insights.kpi.total_borrows.subtitle")}
					loading={loading}
				/>
				<KpiTile
					title={t("insights.kpi.total_lends.title")}
					value={totalLends.toLocaleString()}
					subtitle={t("insights.kpi.total_lends.subtitle")}
					loading={loading}
				/>
				<KpiTile
					title={t("insights.kpi.rescued.title")}
					value={(d?.savedByReResolution ?? 0).toLocaleString()}
					subtitle={t("insights.kpi.rescued.subtitle")}
					loading={loading}
				/>
				<KpiTile
					title={t("insights.kpi.unique_titles.title")}
					value={(
						d?.collectionSummary.uniqueTitlesRequested ?? 0
					).toLocaleString()}
					subtitle={t("insights.kpi.unique_titles.subtitle", {
						total: d?.collectionSummary.totalRequests ?? 0,
					})}
					loading={loading}
				/>
			</Box>

			{/* Trend spine + plot-builder */}
			<StatusFlowChart params={params} interval={interval} />

			{/* Peer benchmarking - this library vs the consortium median */}
			<LazyPanel minHeight={320}>
				<PeerBenchmarkPanel
					params={{ startDate: params.startDate, endDate: params.endDate }}
					libraryCode={libraryCode}
				/>
			</LazyPanel>

			{/* Operational breakdowns */}
			<LazyPanel minHeight={360}>
				<Box
					sx={{
						display: "grid",
						gap: 3,
						gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
					}}
				>
					<FailureTaxonomyChart params={params} />
					<SupplierReliabilityChart params={params} />
				</Box>
			</LazyPanel>

			{/* Bottleneck + lender responsiveness */}
			<LazyPanel minHeight={360}>
				<Box
					sx={{
						display: "grid",
						gap: 3,
						gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
					}}
				>
					<TimeInStatusChart params={params} />
					<SupplierResponseSlaChart params={params} />
				</Box>
			</LazyPanel>

			{/* Demand pattern (staffing) */}
			<LazyPanel minHeight={320}>
				<DemandHeatmapChart params={params} />
			</LazyPanel>

			{/* Collection analysis: format mix + most-requested titles */}
			<LazyPanel minHeight={360}>
				<Box
					sx={{
						display: "grid",
						gap: 3,
						gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
					}}
				>
					<CollectionDimensionPanel params={params} />
					<TableStatPanel<RequestedTitleStat>
						titleKey="insights.charts.top_titles.title"
						subtitleKey="insights.charts.top_titles.subtitle"
						queryOptions={topRequestedTitlesQueryOptions(client, params)}
						getRowKey={(r) => r.title}
						columns={[
							{
								headerKey: "insights.charts.top_titles.col_title",
								cell: (r) => r.title ?? "—",
							},
							{
								headerKey: "insights.charts.top_titles.col_requests",
								align: "right",
								cell: (r) => r.requestCount,
							},
						]}
					/>
				</Box>
			</LazyPanel>

			{/* Demand breakdowns: pickup location + patron group */}
			<LazyPanel minHeight={360}>
				<Box
					sx={{
						display: "grid",
						gap: 3,
						gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
					}}
				>
					<BarStatPanel<PickupLocationDemandStat>
						titleKey="insights.charts.demand_by_pickup.title"
						subtitleKey="insights.charts.demand_by_pickup.subtitle"
						seriesLabelKey="insights.charts.demand_by_pickup.series"
						queryOptions={demandByPickupLocationQueryOptions(client, params)}
						getLabel={(r) => r.pickupLocationName ?? r.pickupLocationCode}
						getValue={(r) => r.requestCount}
						color={categorical[0]}
						horizontal
					/>
					<BarStatPanel<PatronGroupDemandStat>
						titleKey="insights.charts.demand_by_patron_group.title"
						subtitleKey="insights.charts.demand_by_patron_group.subtitle"
						seriesLabelKey="insights.charts.demand_by_patron_group.series"
						queryOptions={demandByPatronGroupQueryOptions(client, params)}
						getLabel={(r) => r.patronGroup}
						getValue={(r) => r.requestCount}
						color={categorical[0]}
						horizontal
					/>
				</Box>
			</LazyPanel>

			{/* Collection gaps + supply value - library scope only. */}
			{libraryCode && (
				<LazyPanel minHeight={400}>
					<>
						<Box
							sx={{
								display: "grid",
								gap: 3,
								gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
							}}
						>
							<TableStatPanel<TopClusterStat>
								titleKey="insights.charts.unmet_local.title"
								subtitleKey="insights.charts.unmet_local.subtitle"
								queryOptions={unmetLocalDemandQueryOptions(client, {
									...params,
									libraryCode,
								})}
								getRowKey={(r) => r.clusterId}
								columns={[
									{
										headerKey: "insights.charts.top_titles.col_title",
										cell: (r) => r.title ?? "—",
									},
									{
										headerKey: "insights.charts.top_titles.col_requests",
										align: "right",
										cell: (r) => r.requestCount,
									},
								]}
							/>
							<TableStatPanel<TopClusterStat>
								titleKey="insights.charts.acquisition_opportunities.title"
								subtitleKey="insights.charts.acquisition_opportunities.subtitle"
								queryOptions={acquisitionOpportunitiesQueryOptions(client, {
									...params,
									libraryCode,
								})}
								getRowKey={(r) => r.clusterId}
								columns={[
									{
										headerKey: "insights.charts.top_titles.col_title",
										cell: (r) => r.title ?? "—",
									},
									{
										headerKey: "insights.charts.top_titles.col_requests",
										align: "right",
										cell: (r) => r.requestCount,
									},
								]}
							/>
						</Box>

						<TableStatPanel<ConsortialLifelineStat>
							titleKey="insights.charts.consortial_lifeline.title"
							subtitleKey="insights.charts.consortial_lifeline.subtitle"
							queryOptions={consortialLifelineQueryOptions(client, {
								...params,
								libraryCode,
							})}
							getRowKey={(r) => r.clusterId}
							columns={[
								{
									headerKey: "insights.charts.top_titles.col_title",
									cell: (r) => r.title ?? "—",
								},
								{
									headerKey: "insights.charts.rare_gem.col_author",
									cell: (r) => r.author ?? "—",
								},
								{
									headerKey: "insights.charts.consortial_lifeline.col_supplied",
									align: "right",
									cell: (r) => r.supplyCount,
								},
							]}
						/>

						<NewAcquisitionsPanel params={params} libraryCode={libraryCode} />
					</>
				</LazyPanel>
			)}

			{/* Reciprocity / value */}
			<LazyPanel minHeight={360}>
				<NetFlowChart params={params} />
			</LazyPanel>

			{/* Unique collection value - library scope only (requires a libraryCode). */}
			{libraryCode && (
				<LazyPanel minHeight={320}>
					<RareGemPanel params={{ ...params, libraryCode }} />
				</LazyPanel>
			)}
		</Stack>
	);
}
