import { ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Stack,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@mui/material";
import { DateRangePicker } from "@mui/x-date-pickers-pro";
import { MultiInputDateRangeField } from "@mui/x-date-pickers-pro/MultiInputDateRangeField";
import dayjs from "dayjs";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { useChartPalette } from "@hooks/useChartPalette";
import {
	ConsortialLifelineStat,
	PatronGroupDemandStat,
	PickupLocationDemandStat,
	RequestedTitleStat,
	StatsParams,
	TopClusterStat,
	UnfillableDemandStat,
	acquisitionOpportunitiesQueryOptions,
	consortialLifelineQueryOptions,
	dashboardQueryOptions,
	demandByPatronGroupQueryOptions,
	demandByPickupLocationQueryOptions,
	netFlowQueryOptions,
	supplierFulfillmentQueryOptions,
	topRequestedTitlesQueryOptions,
	turnaroundQueryOptions,
	unfillableDemandQueryOptions,
	unmetLocalDemandQueryOptions,
} from "@helpers/statsApi";
import {
	rangeToParams,
	customRangeToParams,
	intervalForRange,
	intervalForSpan,
	formatDuration,
} from "@helpers/insightsRange";

import KpiTile from "./KpiTile";
import DurationsPanel from "./DurationsPanel";
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
import TradingPartnersPanel from "./TradingPartnersPanel";
import CollectionAnalysisSection from "./CollectionAnalysisSection";

import { visuallyHidden } from "@mui/utils";
import { announcementParts } from "@helpers/insightsAnnouncement";

import { ExpandMore } from "@mui/icons-material";
import { activeSystems } from "@helpers/insightsHeadline";

import type { InsightsView } from "@hooks/useInsightsView";
import type { RangePreset } from "@helpers/insightsSearch";

import SubjectBar from "./SubjectBar";
import TrendStrip from "./TrendStrip";
import DrillLink from "./DrillLink";
import { InsightsExportProvider } from "./ExportContext";
import { clusterDrill, errorDrill } from "@helpers/insightsDrill";
import DurationTrendPanel from "./DurationTrendPanel";
import { resolveSubject, Subject } from "@helpers/insightsSubjects";
import {
	isInsightsPanelShown as shown,
	isInsightsSectionShown,
} from "@helpers/featureFlags";
import type {
	InsightsPanel,
	InsightsSection,
} from "@helpers/insightsSelection";
import PanelRow, { PanelGrid } from "./PanelRow";

// Lazily mounted as one, so one is enough to mount it
const GAPS_TOGETHER: readonly InsightsPanel[] = [
	"gaps.unmetLocal",
	"gaps.acquisitionOpportunities",
	"gaps.consortialLifeline",
	"gaps.newAcquisitions",
];
import DateLocalization from "@components/DateLocalization/DateLocalization";

const RANGE_PRESETS: RangePreset[] = ["7d", "30d", "90d", "365d"];

/**
 * One end of the window, as the picker reports it: null is cleared, a valid date is
 * chosen, and an invalid one is an end mid-entry - where the end ALREADY chosen has to
 * stay, or the field wipes the digits entered so far. See docs/insights-view-state.md.
 */
function chosenDate(
	picked: dayjs.Dayjs | null,
	current: string | null,
): string | null {
	if (picked === null) return null;
	return picked.isValid() ? picked.format("YYYY-MM-DD") : current;
}

function fillRate(successful: number, failed: number): number | null {
	const total = successful + failed;
	return total === 0 ? null : (successful / total) * 100;
}

/**
 * A titled region of the dashboard.
 *
 * The page has one h1 (PageContainer) and every panel titles itself with an h3, so the
 * sections are the h2 that makes the outline navigable: a screen-reader user can move
 * between "service performance" and "collection analysis" instead of walking twenty
 * sibling cards. `aria-labelledby` names each region with the heading it already shows,
 * rather than duplicating the label in an aria-label that can drift out of step.
 */
function Section({
	id,
	titleKey,
	section,
	current,
	children,
}: {
	id: string;
	titleKey: string;
	/** The subject this section is, or the overview above every subject. */
	section: InsightsSection;
	current: Subject;
	children: ReactNode;
}) {
	const { t } = useTranslation();

	// One place decides what is open, rather than five conditionals at the call sites.
	// Returning null rather than hiding with CSS is the point: a subject that is not open
	// must not mount its panels, or the cost the subjects exist to make opt-in is paid
	// anyway - and the panels below the fold would fetch on an IntersectionObserver that
	// a hidden element never fires.
	if (section !== "overview" && section !== current) return null;
	if (!isInsightsSectionShown(section)) return null;

	return (
		<Box component="section" aria-labelledby={id}>
			<Typography id={id} variant="h5" component="h2" gutterBottom>
				{t(titleKey)}
			</Typography>
			<Stack spacing={3}>{children}</Stack>
		</Box>
	);
}

export default function InsightsDashboard({
	libraryCode,
	view,
	subjectBarTo,
	subjectBarParams,
}: {
	// Omitted = consortium-wide.
	libraryCode?: string;
	/** The view as the URL states it, and the writers that change it. */
	view: InsightsView;
	/** Where the subject links point; the route knows its own path, this does not. */
	subjectBarTo: string;
	subjectBarParams?: Record<string, string>;
}) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const { categorical } = useChartPalette();

	const scopedCodes = libraryCode
		? libraryCode.split(",").filter(Boolean).length
		: 0;
	// A subject the current scope cannot show falls back rather than rendering nothing -
	// which is what an old link to Gaps does once the reader widens to the consortium.
	const subject = resolveSubject(view.tab, scopedCodes);

	const { range: rangePreset, custom: customRange, customEnds } = view;
	const setRangePreset = view.setRange;
	const setCustomRange = view.setCustomRange;

	// Referentially stable, which this control requires rather than prefers: the field
	// compares `value` with `!==` and re-derives its sections when it differs, so a fresh
	// array each render wipes what has been typed - docs/insights-view-state.md.
	const pickerValue = useMemo<[dayjs.Dayjs | null, dayjs.Dayjs | null]>(
		() => [
			customEnds.startDate ? dayjs(customEnds.startDate) : null,
			customEnds.endDate ? dayjs(customEnds.endDate) : null,
		],
		[customEnds.startDate, customEnds.endDate],
	);

	const { params, interval } = useMemo(() => {
		// An explicit custom window wins over the preset. The URL states it as two plain
		// dates and every `/insights/*` date parameter binds an Instant, so it is
		// converted here rather than stored converted - see customRangeToParams.
		const current = customRange
			? customRangeToParams(customRange)
			: rangeToParams(rangePreset);
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

	// Two KPIs the combined endpoint does not carry, so they cost a request each. Both are
	// cheap aggregates and they run in parallel with the panels below; folding them into
	// /insights/dashboard would be the better answer and is a dcb-service change.
	const supplierFill = useQuery(
		supplierFulfillmentQueryOptions(client, params),
	);
	// One row per Host LMS with what it borrowed and what it supplied, which is exactly
	// "did this member take part". No endpoint of its own is needed for the headline.
	const netFlow = useQuery(netFlowQueryOptions(client, params));

	const toFinalised = useQuery(
		turnaroundQueryOptions(client, {
			libraryCodes: libraryCode,
			targetStatus: "FINALISED",
			startDate: params.startDate,
			endDate: params.endDate,
		}),
	);

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

	// The supplying half of the same question the fill rate asks about borrowing: a library
	// can be well served by the network and poor at serving it, and one number hides that.
	const supplyRate = supplierFill.data
		? fillRate(supplierFill.data.successfulCount, supplierFill.data.failedCount)
		: null;

	// Changing the range or the scope rewrites every panel below it, and a screen-reader
	// user was told none of that - WCAG 2.2 SC 4.1.3. One announcement for the settled view,
	// not one per panel: both controls only emit when the choice is complete, so there is
	// nothing here to debounce. Keyed on the text so the region remounts and speaks again,
	// which is the pattern SetupLayout already uses.
	const parts = announcementParts(
		rangePreset,
		customRange,
		libraryCode,
		(iso) => dayjs(iso).format("D MMM YYYY"),
	);
	const announcement = t("insights.announce.view", {
		range: "literal" in parts.range ? parts.range.literal : t(parts.range.key),
		scope: t(parts.scope.key, { count: parts.scope.count }),
	});

	const exportContext = {
		scope: t(parts.scope.key, { count: parts.scope.count }),
		window: "literal" in parts.range ? parts.range.literal : t(parts.range.key),
	};

	return (
		<InsightsExportProvider value={exportContext}>
			<Stack spacing={4}>
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
					<DateLocalization>
						<DateRangePicker
							// Each end as chosen, not the resolved window: the picker reports
							// one end at a time, and a control that cannot hold half a range
							// cannot be used to enter a whole one.
							value={pickerValue}
							onChange={(value) => {
								const [start, end] = value;
								setCustomRange({
									startDate: chosenDate(start, customEnds.startDate),
									endDate: chosenDate(end, customEnds.endDate),
								});
							}}
							disableFuture
							// Two labelled inputs and the same actions as the data grid's date
							// filter, rather than one combined field with neither.
							slots={{ field: MultiInputDateRangeField }}
							slotProps={{
								textField: { size: "small" },
								actionBar: { actions: ["clear", "nextOrAccept"] },
							}}
							localeText={{
								start: t("insights.range.from"),
								end: t("insights.range.to"),
							}}
						/>
					</DateLocalization>
				</Stack>

				<SubjectBar
					current={subject}
					scopedCodes={scopedCodes}
					to={subjectBarTo}
					params={subjectBarParams}
				/>

				<Box
					key={announcement}
					aria-live="polite"
					aria-atomic="true"
					// Named, because `[aria-live="polite"]` is not ours alone. MUI X 9.15.0
					// renders an empty role="status" live region inside every chart surface,
					// so a bare attribute selector matches five elements on this page. The
					// gate that has to stay meaningful is "announced once, not once per
					// panel", and it counts THIS id - a per-panel regression still trips it.
					data-tid="insights-announcement"
					sx={visuallyHidden}
				>
					{announcement}
				</Box>

				<Section
					id="insights-overview-heading"
					section="overview"
					current={subject}
					titleKey="insights.sections.overview"
				>
					{/* THE FIVE. Twelve equal tiles was an index, not a summary: a reader had
				    to decide for themselves which of them their board cared about, and ten
				    of the twelve carried no direction at all. The rest are still here,
				    under a disclosure, until subjects give them somewhere better to live -
				    INSIGHTS_IA_AND_UX_PLAN.md section 3. */}
					{shown("overview.headline") && (
						<Box
							sx={{
								display: "grid",
								gap: 2,
								gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
							}}
						>
							<KpiTile
								title={t("insights.kpi.resolved.title")}
								metric="requests_fulfilled"
								value={resolved.toLocaleString()}
								subtitle={t("insights.kpi.resolved.subtitle")}
								loading={loading}
							/>
							<KpiTile
								title={t("insights.kpi.fill_rate.title")}
								metric="fill_rate"
								value={currentRate != null ? `${currentRate.toFixed(1)}%` : "—"}
								deltaPct={rateDelta}
								higherIsBetter
								subtitle={t("insights.kpi.vs_prior")}
								loading={loading}
							/>
							<KpiTile
								title={t("insights.kpi.time_to_loan.title")}
								metric="turnaround_to_loan"
								value={formatDuration(d?.turnaroundToLoaned?.p50Seconds)}
								subtitle={t("insights.kpi.time_to_loan.subtitle", {
									p95: formatDuration(d?.turnaroundToLoaned?.p95Seconds),
								})}
								loading={loading}
							/>
							<KpiTile
								title={t("insights.kpi.error_rate.title")}
								metric="error_rate"
								value={
									currentErrRate == null ? (
										"—"
									) : (
										// The one headline figure with an exact answer waiting: the
										// requests it counted, on the exception tab.
										<DrillLink
											drill={errorDrill(params)}
											panel={t("insights.kpi.error_rate.title")}
											subject={t("insights.kpi.error_rate.title")}
										>
											{`${currentErrRate.toFixed(1)}%`}
										</DrillLink>
									)
								}
								deltaPct={errDelta}
								higherIsBetter={false}
								subtitle={t("insights.kpi.vs_prior")}
								loading={loading}
							/>
							<KpiTile
								title={t("insights.headline.active_systems")}
								metric="libraries_active"
								value={`${activeSystems(netFlow.data)}`}
								subtitle={t("insights.headline.active_systems_sub")}
								loading={netFlow.isLoading}
							/>
						</Box>
					)}

					{/* h3 because this sits INSIDE the Overview section, alongside the panels,
				    and the sections are the h2s. MUI's default is h3 already; saying it
				    explicitly is what stops the next reader "fixing" it to h2 and skipping
				    a level in the app where the sections do not exist. */}
					{shown("overview.moreFigures") && (
						<Accordion
							variant="outlined"
							disableGutters
							slots={{ heading: "h3" }}
						>
							<AccordionSummary expandIcon={<ExpandMore />}>
								<Typography variant="body2">
									{t("insights.headline.more")}
								</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Box
									sx={{
										display: "grid",
										gap: 2,
										gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
									}}
								>
									<KpiTile
										title={t("insights.kpi.supply_rate.title")}
										value={
											supplyRate != null ? `${supplyRate.toFixed(1)}%` : "—"
										}
										subtitle={t("insights.kpi.supply_rate.subtitle")}
										loading={supplierFill.isLoading}
									/>
									<KpiTile
										title={t("insights.kpi.time_to_finalise.title")}
										metric="turnaround_to_finalise"
										value={formatDuration(toFinalised.data?.p50Seconds)}
										subtitle={t("insights.kpi.time_to_finalise.subtitle", {
											p95: formatDuration(toFinalised.data?.p95Seconds),
										})}
										loading={toFinalised.isLoading}
									/>
									<KpiTile
										title={t("insights.kpi.checkout_rate.title")}
										metric="checkout_rate"
										value={
											checkoutRate != null ? `${checkoutRate.toFixed(1)}%` : "—"
										}
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
									{/* An assumption multiplied by a count, not a measurement. Beside
							    four measured figures it borrowed a confidence it has not
							    earned; here it keeps its arithmetic on its own face. */}
									<CostAvoidanceTile
										fulfilled={d?.fulfillmentCurrent.successfulCount ?? 0}
										unitCost={view.unitCost}
										onUnitCostChange={view.setUnitCost}
										loading={loading}
									/>
								</Box>
							</AccordionDetails>
						</Accordion>
					)}
				</Section>

				<Section
					id="insights-trends-heading"
					section="trends"
					current={subject}
					titleKey="insights.sections.trends"
				>
					{/* Direction first: it answers the question the subject is named for, and
				    it reads the series the spine below already fetched. */}
					{shown("trends.trendStrip") && (
						<TrendStrip params={params} interval={interval} />
					)}

					{/* The three durations over time. Behind its own flag as well:
				    /insights/trend is on no dcb-service release, and a 404 through the
				    panel contract reads as a fault rather than as a server that is older. */}
					<PanelRow minHeight={360}>
						{shown("trends.durationTrend") && (
							<DurationTrendPanel params={params} interval={interval} />
						)}
					</PanelRow>

					{/* Trend spine + plot-builder */}
					{shown("trends.statusFlow") && (
						<StatusFlowChart params={params} interval={interval} view={view} />
					)}
				</Section>

				<Section
					id="insights-performance-heading"
					section="service"
					current={subject}
					titleKey="insights.sections.performance"
				>
					{/* First, because every other panel here is a breakdown of one of these. */}
					{shown("service.durations") && (
						<DurationsPanel
							params={params}
							toLoaned={d?.turnaroundToLoaned}
							toFinalised={toFinalised.data}
							loading={loading}
						/>
					)}

					{/* Peer benchmarking - this library vs the consortium median */}
					<PanelRow minHeight={320}>
						{shown("service.peerBenchmark") && (
							<PeerBenchmarkPanel
								params={{
									startDate: params.startDate,
									endDate: params.endDate,
								}}
								libraryCode={libraryCode}
							/>
						)}
					</PanelRow>

					{/* Operational breakdowns */}
					<PanelRow minHeight={360}>
						{shown("service.failures") && (
							<FailureTaxonomyChart params={params} />
						)}
						{shown("service.supplierReliability") && (
							<SupplierReliabilityChart params={params} />
						)}
					</PanelRow>

					{/* Bottleneck + lender responsiveness */}
					<PanelRow minHeight={360}>
						{shown("service.timeInStatus") && (
							<TimeInStatusChart params={params} />
						)}
						{shown("service.supplierResponse") && (
							<SupplierResponseSlaChart params={params} />
						)}
					</PanelRow>
				</Section>

				<Section
					id="insights-demand-heading"
					section="demand"
					current={subject}
					titleKey="insights.sections.demand"
				>
					{/* Demand pattern (staffing) */}
					<PanelRow minHeight={320}>
						{shown("demand.heatmap") && <DemandHeatmapChart params={params} />}
					</PanelRow>

					{/* What is being asked for: by collection dimension, and by title */}
					<PanelRow minHeight={360}>
						{shown("demand.dimensions") && (
							<CollectionDimensionPanel params={params} />
						)}
						{shown("demand.topTitles") && (
							<TableStatPanel<RequestedTitleStat>
								titleKey="insights.charts.top_titles.title"
								subtitleKey="insights.charts.top_titles.subtitle"
								queryOptions={topRequestedTitlesQueryOptions(client, params)}
								getRowKey={(r) => r.title}
								columns={[
									{
										headerKey: "insights.charts.top_titles.col_title",
										text: (r) => r.title,
										cell: (r) =>
											r.clusterId ? (
												<DrillLink
													drill={clusterDrill(r.clusterId, params)}
													panel={t("insights.charts.top_titles.title")}
												>
													{r.title ?? "—"}
												</DrillLink>
											) : (
												(r.title ?? "—")
											),
									},
									{
										headerKey: "insights.charts.top_titles.col_requests",
										align: "right",
										text: (r) => r.requestCount,
										cell: (r) => r.requestCount,
									},
								]}
							/>
						)}
					</PanelRow>

					{/* Demand breakdowns: pickup location + patron group */}
					<PanelRow minHeight={360}>
						{shown("demand.byPickupLocation") && (
							<BarStatPanel<PickupLocationDemandStat>
								titleKey="insights.charts.demand_by_pickup.title"
								subtitleKey="insights.charts.demand_by_pickup.subtitle"
								seriesLabelKey="insights.charts.demand_by_pickup.series"
								queryOptions={demandByPickupLocationQueryOptions(
									client,
									params,
								)}
								getLabel={(r) => r.pickupLocationName ?? r.pickupLocationCode}
								getValue={(r) => r.requestCount}
								color={categorical[0]}
								horizontal
							/>
						)}
						{shown("demand.byPatronGroup") && (
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
						)}
					</PanelRow>

					{/* Demand nothing could satisfy - the acquisition signal the failure
				    taxonomy cannot give, because these requests never had a supplier. */}
					<PanelRow minHeight={320}>
						{shown("demand.unfillable") && (
							<TableStatPanel<UnfillableDemandStat>
								titleKey="insights.charts.unfillable_demand.title"
								subtitleKey="insights.charts.unfillable_demand.subtitle"
								queryOptions={unfillableDemandQueryOptions(client, params)}
								metric="unfillable_demand"
								getRowKey={(r) => r.clusterId}
								columns={[
									{
										headerKey: "insights.charts.top_titles.col_title",
										text: (r) => r.title,
										cell: (r) => (
											<DrillLink
												drill={clusterDrill(r.clusterId, params)}
												panel={t("insights.charts.unfillable_demand.title")}
											>
												{r.title ?? "—"}
											</DrillLink>
										),
									},
									{
										headerKey: "insights.charts.rare_gem.col_author",
										text: (r) => r.author,
										cell: (r) => r.author ?? "—",
									},
									{
										headerKey: "insights.charts.top_titles.col_requests",
										align: "right",
										text: (r) => r.requestCount,
										cell: (r) => r.requestCount,
									},
								]}
							/>
						)}
					</PanelRow>
				</Section>

				<Section
					id="insights-partners-heading"
					section="partners"
					current={subject}
					titleKey="insights.sections.partners"
				>
					<PanelRow minHeight={360}>
						{shown("partners.tradingPartners") && (
							<TradingPartnersPanel params={params} libraryCode={libraryCode} />
						)}
					</PanelRow>

					{/* Reciprocity / value */}
					<PanelRow minHeight={360}>
						{shown("partners.netFlow") && <NetFlowChart params={params} />}
					</PanelRow>
				</Section>

				{/* Collection gaps + supply value - library scope only. */}
				{libraryCode && (
					<Section
						id="insights-gaps-heading"
						section="gaps"
						current={subject}
						titleKey="insights.sections.gaps"
					>
						{GAPS_TOGETHER.some(shown) && (
							<LazyPanel minHeight={400}>
								<Stack spacing={3}>
									<PanelGrid>
										{shown("gaps.unmetLocal") && (
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
														text: (r) => r.title,
														cell: (r) => r.title ?? "—",
													},
													{
														headerKey:
															"insights.charts.top_titles.col_requests",
														align: "right",
														text: (r) => r.requestCount,
														cell: (r) => r.requestCount,
													},
												]}
											/>
										)}
										{shown("gaps.acquisitionOpportunities") && (
											<TableStatPanel<TopClusterStat>
												titleKey="insights.charts.acquisition_opportunities.title"
												subtitleKey="insights.charts.acquisition_opportunities.subtitle"
												queryOptions={acquisitionOpportunitiesQueryOptions(
													client,
													{
														...params,
														libraryCode,
													},
												)}
												getRowKey={(r) => r.clusterId}
												columns={[
													{
														headerKey: "insights.charts.top_titles.col_title",
														text: (r) => r.title,
														cell: (r) => r.title ?? "—",
													},
													{
														headerKey:
															"insights.charts.top_titles.col_requests",
														align: "right",
														text: (r) => r.requestCount,
														cell: (r) => r.requestCount,
													},
												]}
											/>
										)}
									</PanelGrid>

									{shown("gaps.consortialLifeline") && (
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
													text: (r) => r.title,
													cell: (r) => r.title ?? "—",
												},
												{
													headerKey: "insights.charts.rare_gem.col_author",
													text: (r) => r.author,
													cell: (r) => r.author ?? "—",
												},
												{
													headerKey:
														"insights.charts.consortial_lifeline.col_supplied",
													align: "right",
													text: (r) => r.supplyCount,
													cell: (r) => r.supplyCount,
												},
											]}
										/>
									)}

									{shown("gaps.newAcquisitions") && (
										<NewAcquisitionsPanel
											params={params}
											libraryCode={libraryCode}
										/>
									)}
								</Stack>
							</LazyPanel>
						)}

						{/* Unique collection value - requires a libraryCode. */}
						<PanelRow minHeight={320}>
							{shown("gaps.rareGems") && (
								<RareGemPanel params={{ ...params, libraryCode }} />
							)}
						</PanelRow>
					</Section>
				)}

				{/* The catalogue itself, rather than the traffic over it. Its own section, and
			    last, because it answers a different question and costs more to answer. */}
				{subject === "collection" && (
					<CollectionAnalysisSection libraryCode={libraryCode} />
				)}
			</Stack>
		</InsightsExportProvider>
	);
}
