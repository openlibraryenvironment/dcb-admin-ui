import { AxiosInstance } from "axios";

// --- Response types (mirror org.olf.dcb.core.api.serde.*) -------------------

export interface TimeSeriesPoint {
	bucket: string; // ISO instant of the bucket start
	series: string; // the DCB status transitioned into
	count: number;
}

export interface TurnaroundStat {
	p50Seconds: number;
	p95Seconds: number;
}

export interface PartnerStat {
	partnerCode: string;
	// Null when the Host LMS has traffic but is not onboarded as a library - fall back to the
	// code rather than rendering a blank. One Host LMS can serve several libraries, so
	// dcb-service lists all of their names rather than picking one.
	partnerName: string | null;
	requestCount: number;
}

/**
 * One partner and the traffic in BOTH directions, ranked on the total. Not derivable from
 * topSuppliers and topBorrowers: a partner sixth in each can out-total one third in one, and
 * appears in neither. The split is kept so an uneven relationship stays visible.
 */
export interface TradingPartnerStat {
	partnerCode: string;
	partnerName: string | null;
	borrowedFromCount: number;
	suppliedToCount: number;
	totalCount: number;
}

export interface DashboardMetrics {
	turnaroundToLoaned: TurnaroundStat;
	turnaroundToFinalised: TurnaroundStat;
	topSuppliers: PartnerStat[];
	topBorrowers: PartnerStat[];
}

export interface FailureReasonStat {
	reason: string;
	count: number;
}

export interface SupplierReliabilityStat {
	supplierCode: string;
	fulfilledCount: number;
	failedCount: number;
}

export interface NetFlowStat {
	libraryCode: string;
	borrowedCount: number;
	suppliedCount: number;
}

export interface FulfillmentStat {
	successfulCount: number;
	failedCount: number;
}

/**
 * Demand nothing in the consortium could satisfy: titles requested where no library
 * holds a bib record. Distinct from the failure taxonomy, which says why requests that
 * had a supplier still failed - this is demand with no supplier to begin with.
 */
export interface UnfillableDemandStat {
	clusterId: string;
	title: string;
	author: string;
	requestCount: number;
}

// --- Collection analysis ------------------------------------------------------
// These aggregate bib_record - the catalogue as INGESTED - rather than patron_request,
// so they take no date window and report on what the consortium holds rather than on
// what it has been asked for. See docs/insights.md part 5 in dcb-service.

/** The consortium in four numbers. Only as good as the clustering - read with ClusterSizeStat. */
export interface CollectionTotalsStat {
	distinctTitles: number;
	singlyHeldTitles: number;
	holdings: number;
	contributingSources: number;
}

export interface CollectionProfileStat {
	sourceSystemId: string;
	// Host LMS code - the stable identifier, not display text.
	sourceSystemCode: string;
	clusterCount: number;
	uniqueTitleCount: number;
}

// One unordered pair, emitted once (left < right), so a consumer drawing a full matrix
// mirrors it. Requested for one library, so the rows are that library against the others.
export interface CollectionOverlapStat {
	leftSystemId: string;
	leftSystemCode: string;
	rightSystemId: string;
	rightSystemCode: string;
	sharedTitleCount: number;
}

/**
 * How many source systems hold each work. The confidence signal for every other
 * collection number: a corpus that is overwhelmingly holderCount = 1 is under-clustered,
 * and the unique-title counts are then fiction. Never render the others without it.
 */
export interface ClusterSizeStat {
	holderCount: number;
	clusterCount: number;
}

export interface SourceFormatStat {
	sourceSystemId: string;
	sourceSystemCode: string;
	// Nullable: derived_type has no NOT NULL, and an ingest that could not derive one
	// produces a null. Reported rather than dropped, so the totals still add up.
	derivedType: string | null;
	titleCount: number;
}

// "Rare gem": clusters this library is the ONLY contributor to, that the network
// requested - the unique collection value it brings to the consortium.
export interface RareGem {
	clusterId: string;
	title: string;
	author: string;
	localBibId: string;
	supplyCount: number;
}

export interface StatusDwellStat {
	status: string;
	medianDwellSeconds: number;
	sampleCount: number;
}

export interface SupplierResponseStat {
	supplierCode: string;
	medianResponseSeconds: number;
	sampleCount: number;
}

export interface DemandHeatCell {
	dayOfWeek: number; // 0 = Sunday .. 6 = Saturday (Postgres DOW)
	hourOfDay: number; // 0 .. 23
	requestCount: number;
}

export interface CheckoutRateStat {
	reachedCount: number;
	totalCount: number;
}

export interface CollectionBalanceStat {
	borrowedCount: number;
	suppliedCount: number;
	netBalance?: number;
}

// One round-trip for the whole KPI header (see /stats/dashboard).
export interface DashboardSummary {
	fulfillmentCurrent: FulfillmentStat;
	fulfillmentPrior: FulfillmentStat;
	turnaroundToLoaned: TurnaroundStat;
	checkoutRate: CheckoutRateStat;
	lendBorrowTotals: CollectionBalanceStat;
	savedByReResolution: number;
	collectionSummary: CollectionSummaryStat;
}

export interface CollectionSummaryStat {
	uniqueTitlesRequested: number;
	totalRequests: number;
}

// Shapes for the previously-unsurfaced endpoints.
export interface RequestedTitleStat {
	title: string;
	requestCount: number;
}
export interface PickupLocationDemandStat {
	pickupLocationCode: string;
	pickupLocationName: string;
	requestCount: number;
}
export interface PatronGroupDemandStat {
	patronGroup: string;
	requestCount: number;
}
export interface TopClusterStat {
	clusterId: string;
	title: string;
	requestCount: number;
}
export interface ConsortialLifelineStat {
	clusterId: string;
	title: string;
	author: string;
	isbn: string;
	localBibId: string;
	supplyCount: number;
}

export interface PeerBenchmarkStat {
	libraryCode: string;
	// The name a librarian recognises. Null when no library row maps to that Host LMS - a
	// system with requests that is not onboarded as a library - so callers fall back to the
	// code rather than rendering a blank row.
	libraryName: string | null;
	totalRequests: number;
	checkoutCount: number;
	successCount: number;
	failedCount: number;
}

export interface DimensionDemandStat {
	category: string;
	requestCount: number;
}

export type CollectionDimension = "format" | "language" | "subject" | "decade";

export interface NewAcquisitionPerformanceStat {
	clusterId: string;
	title: string;
	author: string;
	localBibId: string;
	dateAdded: string;
	supplyCount: number;
}

// --- Params ------------------------------------------------------------------

export interface StatsParams {
	// Omitted (undefined) means consortium-wide. Present means a single library
	// (a Host LMS code, matching patron_hostlms_code / local_item_hostlms_code).
	libraryCode?: string;
	startDate?: string; // ISO instant
	endDate?: string; // ISO instant
}

export type TimeSeriesInterval = "day" | "week" | "month";

// dcb-service serves Insights from /insights. It was /patrons/requests/stats, which was
// accurate when the surface was ten endpoints on the patron request controller and misleading
// at thirty-five - half of them never read patron_request at all. Only /top-requestors and
// /top-requested-titles are still answered under the old base, by LegacyStatsController, and
// that class is marked for removal. Requires a dcb-service carrying the rename;
// VITE_FEATURE_INSIGHTS gates that, see featureFlags.
const STATS_BASE = "/insights";

/**
 * The wire name for the library filter.
 *
 * dcb-service binds `requestedLibraryCode`, not `libraryCode` - deliberately, because
 * StatsScopeGuard treats it as a REQUEST rather than an instruction and checks it against the
 * caller's token. `StatsScopeArchitectureTests` fails the build if an endpoint ever goes back
 * to binding the trusted name.
 *
 * We keep `libraryCode` throughout this app because that is what it is to us, and rename once
 * here at the serialisation boundary. Sending the old name is silently wrong rather than an
 * error: the endpoint ignores it, and a consortium administrator asking for one library gets
 * consortium-wide figures rendered under that library's name.
 *
 * `libraryCodes` - the CSV taken by /turnaround - is a different parameter and keeps its own
 * name, so the rename matches the exact key only.
 */
export const LIBRARY_CODE_PARAM = "requestedLibraryCode";

// Strip undefined so axios does not serialise `libraryCode=undefined` etc., and rename the
// library filter to the name the API actually binds.
function cleanParams<T extends object>(params: T): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(params)
			.filter(([, v]) => v !== undefined && v !== null)
			.map(([k, v]) => [k === "libraryCode" ? LIBRARY_CODE_PARAM : k, v]),
	);
}

/** The fields of a Micronaut Page this app actually reads. */
export interface Paged<T> {
	content: T[];
	totalSize: number;
}

// --- TanStack Query options factories ---------------------------------------
// Shared by route loaders (queryClient.ensureQueryData) and components (useQuery)
// so the query keys can never drift between prefetch and read.

export function timeSeriesQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
	interval: TimeSeriesInterval,
) {
	return {
		queryKey: ["stats", "timeseries", interval, params] as const,
		queryFn: async (): Promise<TimeSeriesPoint[]> => {
			const { data } = await client.get(`${STATS_BASE}/timeseries`, {
				params: cleanParams({ interval, ...params }),
			});
			return data;
		},
	};
}

export function dashboardMetricsQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
) {
	return {
		queryKey: ["stats", "dashboard-metrics", params] as const,
		queryFn: async (): Promise<DashboardMetrics> => {
			const { data } = await client.get(`${STATS_BASE}/dashboard-metrics`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

/**
 * libraryCode is required by the endpoint - "who do we trade with" needs a "we" - so the
 * caller must supply it rather than relying on the consortium-wide default.
 *
 * Returns the PAGE rather than unwrapping to the first one, unlike the summary endpoints
 * around it. The whole point of this endpoint over dashboard-metrics' fixed top ten is that
 * the tail is reachable, and a helper that quietly returned page zero would put it back out
 * of reach. totalSize counts partners, not requests, so it drives a page control directly.
 *
 * Sorting is optional: dcb-service applies total_count descending when none is given, so
 * "top partners" is the default without this client having to know the column name. Pass
 * `sort` to rank by one direction instead.
 */
export function topPartnersQueryOptions(
	client: AxiosInstance,
	params: StatsParams & {
		libraryCode: string;
		page?: number;
		size?: number;
		sort?: string;
	},
) {
	return {
		queryKey: ["stats", "top-partners", params] as const,
		queryFn: async (): Promise<Paged<TradingPartnerStat>> => {
			const { data } = await client.get(`${STATS_BASE}/top-partners`, {
				params: cleanParams(params),
			});
			return { content: data?.content ?? [], totalSize: data?.totalSize ?? 0 };
		},
	};
}

export function failureTaxonomyQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
) {
	return {
		queryKey: ["stats", "failure-taxonomy", params] as const,
		queryFn: async (): Promise<FailureReasonStat[]> => {
			const { data } = await client.get(`${STATS_BASE}/failure-taxonomy`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

export function supplierReliabilityQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
) {
	return {
		queryKey: ["stats", "supplier-reliability", params] as const,
		queryFn: async (): Promise<SupplierReliabilityStat[]> => {
			const { data } = await client.get(`${STATS_BASE}/supplier-reliability`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

export function netFlowQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
) {
	return {
		queryKey: ["stats", "net-flow", params] as const,
		queryFn: async (): Promise<NetFlowStat[]> => {
			const { data } = await client.get(`${STATS_BASE}/net-flow`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

// libraryCode is REQUIRED by this endpoint (unique-to-one-library is meaningless
// consortium-wide), so this is only used on the per-library page.
/**
 * The supplying half of the fill rate. The borrowing half is in the combined /dashboard
 * call already, so only this one needs asking for separately: "how often do WE come
 * through for the network" is a different question from "how often does the network come
 * through for us", and a library can be good at one and poor at the other.
 */
export function supplierFulfillmentQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
) {
	return {
		queryKey: ["stats", "fulfillment", "supplier", params] as const,
		queryFn: async (): Promise<FulfillmentStat> => {
			const { data } = await client.get(`${STATS_BASE}/fulfillment/supplier`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

export function unfillableDemandQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
) {
	return {
		queryKey: ["stats", "unfillable-demand", params] as const,
		queryFn: async (): Promise<UnfillableDemandStat[]> => {
			const { data } = await client.get(`${STATS_BASE}/unfillable-demand`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

export function uniqueContributionsQueryOptions(
	client: AxiosInstance,
	params: StatsParams & { libraryCode: string },
) {
	return {
		queryKey: ["stats", "unique-contributions", params] as const,
		queryFn: async (): Promise<RareGem[]> => {
			const { data } = await client.get(`${STATS_BASE}/unique-contributions`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

export function timeInStatusQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
) {
	return {
		queryKey: ["stats", "time-in-status", params] as const,
		queryFn: async (): Promise<StatusDwellStat[]> => {
			const { data } = await client.get(`${STATS_BASE}/time-in-status`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

export function supplierResponseSlaQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
) {
	return {
		queryKey: ["stats", "supplier-response-sla", params] as const,
		queryFn: async (): Promise<SupplierResponseStat[]> => {
			const { data } = await client.get(`${STATS_BASE}/supplier-response-sla`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

export function demandHeatmapQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
) {
	return {
		queryKey: ["stats", "demand-heatmap", params] as const,
		queryFn: async (): Promise<DemandHeatCell[]> => {
			const { data } = await client.get(`${STATS_BASE}/demand-heatmap`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

// Combined KPI header - one request instead of ~7.
export function dashboardQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
) {
	return {
		queryKey: ["stats", "dashboard", params] as const,
		queryFn: async (): Promise<DashboardSummary> => {
			const { data } = await client.get(`${STATS_BASE}/dashboard`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

export function demandByPickupLocationQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
) {
	return {
		queryKey: ["stats", "demand-by-pickup-location", params] as const,
		queryFn: async (): Promise<PickupLocationDemandStat[]> => {
			const { data } = await client.get(
				`${STATS_BASE}/demand-by-pickup-location`,
				{ params: cleanParams(params) },
			);
			return data;
		},
	};
}

export function demandByPatronGroupQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
) {
	return {
		queryKey: ["stats", "demand-by-patron-group", params] as const,
		queryFn: async (): Promise<PatronGroupDemandStat[]> => {
			const { data } = await client.get(
				`${STATS_BASE}/demand-by-patron-group`,
				{
					params: cleanParams(params),
				},
			);
			return data;
		},
	};
}

// This endpoint is paginated (Micronaut Page); we surface the first page only.
export function topRequestedTitlesQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
) {
	return {
		queryKey: ["stats", "top-requested-titles", params] as const,
		queryFn: async (): Promise<RequestedTitleStat[]> => {
			const { data } = await client.get(`${STATS_BASE}/top-requested-titles`, {
				params: cleanParams({ ...params, size: 20 }),
			});
			return data?.content ?? [];
		},
	};
}

// The following require a libraryCode (NotNull on the endpoint) - library scope only.
export function unmetLocalDemandQueryOptions(
	client: AxiosInstance,
	params: StatsParams & { libraryCode: string },
) {
	return {
		queryKey: ["stats", "unmet-local-demand", params] as const,
		queryFn: async (): Promise<TopClusterStat[]> => {
			const { data } = await client.get(`${STATS_BASE}/unmet-local-demand`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

export function acquisitionOpportunitiesQueryOptions(
	client: AxiosInstance,
	params: StatsParams & { libraryCode: string },
) {
	return {
		queryKey: ["stats", "acquisition-opportunities", params] as const,
		queryFn: async (): Promise<TopClusterStat[]> => {
			const { data } = await client.get(
				`${STATS_BASE}/acquisition-opportunities`,
				{ params: cleanParams(params) },
			);
			return data;
		},
	};
}

export function consortialLifelineQueryOptions(
	client: AxiosInstance,
	params: StatsParams & { libraryCode: string },
) {
	return {
		queryKey: ["stats", "consortial-lifeline", params] as const,
		queryFn: async (): Promise<ConsortialLifelineStat[]> => {
			const { data } = await client.get(`${STATS_BASE}/consortial-lifeline`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

// Peer benchmarks are consortium-wide (every library's figures) regardless of scope,
// so the UI can rank the selected library against the network. No libraryCode param.
export function peerBenchmarksQueryOptions(
	client: AxiosInstance,
	params: { startDate?: string; endDate?: string },
) {
	return {
		queryKey: ["stats", "peer-benchmarks", params] as const,
		queryFn: async (): Promise<PeerBenchmarkStat[]> => {
			const { data } = await client.get(`${STATS_BASE}/peer-benchmarks`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

export function demandByDimensionQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
	dimension: CollectionDimension,
) {
	return {
		queryKey: ["stats", "demand-by-dimension", dimension, params] as const,
		queryFn: async (): Promise<DimensionDemandStat[]> => {
			const { data } = await client.get(`${STATS_BASE}/demand-by-dimension`, {
				params: cleanParams({ dimension, ...params }),
			});
			return data;
		},
	};
}

// Turnaround for a library, the consortium, or a COMBINATION (comma-separated codes).
export function turnaroundQueryOptions(
	client: AxiosInstance,
	params: {
		libraryCodes?: string;
		targetStatus?: string;
		startDate?: string;
		endDate?: string;
	},
) {
	return {
		queryKey: ["stats", "turnaround", params] as const,
		queryFn: async (): Promise<TurnaroundStat> => {
			const { data } = await client.get(`${STATS_BASE}/turnaround`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

// Requires libraryCode + acquiredSince (both NotNull on the endpoint) - library scope.
// --- Collection analysis ------------------------------------------------------
//
// Four of these five are consortium-wide and take NO parameters at all - not even the
// date window - because they aggregate the catalogue as ingested rather than the traffic
// over it. Their query keys are therefore constant: changing the range picker must not
// refetch them, and would show the same numbers if it did.
//
// dcb-service runs them one at a time behind CollectionAnalysisService, caches each for
// 15 minutes, and answers 429 when a caller has waited out its budget rather than
// queueing a second 20M-row aggregate. Two consequences for this client, both deliberate:
//
//   staleTime 15m - matched to the server's own cache, so a remount inside that window
//   costs nothing. The global default is 5 minutes, which would ask three times as often
//   for an answer that cannot have changed.
//
//   retry: false - a 429 here means "the one permit is busy", and retrying immediately is
//   exactly the wrong response: it spends the next caller's budget too. The panel surfaces
//   the refusal and offers a manual retry instead.
const COLLECTION_ANALYSIS_STALE_MS = 15 * 60 * 1000;

const collectionAnalysisPolicy = {
	staleTime: COLLECTION_ANALYSIS_STALE_MS,
	retry: false as const,
};

export function collectionTotalsQueryOptions(client: AxiosInstance) {
	return {
		...collectionAnalysisPolicy,
		queryKey: ["stats", "collection-totals"] as const,
		queryFn: async (): Promise<CollectionTotalsStat> => {
			const { data } = await client.get(`${STATS_BASE}/collection-totals`);
			return data;
		},
	};
}

export function collectionProfileQueryOptions(client: AxiosInstance) {
	return {
		...collectionAnalysisPolicy,
		queryKey: ["stats", "collection-profile"] as const,
		queryFn: async (): Promise<CollectionProfileStat[]> => {
			const { data } = await client.get(`${STATS_BASE}/collection-profile`);
			return data;
		},
	};
}

export function clusterSizeDistributionQueryOptions(client: AxiosInstance) {
	return {
		...collectionAnalysisPolicy,
		queryKey: ["stats", "cluster-size-distribution"] as const,
		queryFn: async (): Promise<ClusterSizeStat[]> => {
			const { data } = await client.get(
				`${STATS_BASE}/cluster-size-distribution`,
			);
			return data;
		},
	};
}

export function formatProfileQueryOptions(client: AxiosInstance) {
	return {
		...collectionAnalysisPolicy,
		queryKey: ["stats", "format-profile"] as const,
		queryFn: async (): Promise<SourceFormatStat[]> => {
			const { data } = await client.get(`${STATS_BASE}/format-profile`);
			return data;
		},
	};
}

/**
 * The one collection query that is scoped: it answers "who duplicates US", so it needs a
 * "us". dcb-service returns this library against all others, never the full matrix - at
 * 500 members a matrix is 124,750 pairs and no panel that renders it is honest.
 */
export function collectionOverlapQueryOptions(
	client: AxiosInstance,
	params: { libraryCode: string },
) {
	return {
		...collectionAnalysisPolicy,
		queryKey: ["stats", "collection-overlap", params.libraryCode] as const,
		queryFn: async (): Promise<CollectionOverlapStat[]> => {
			const { data } = await client.get(`${STATS_BASE}/collection-overlap`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

export function newAcquisitionsQueryOptions(
	client: AxiosInstance,
	params: StatsParams & { libraryCode: string; acquiredSince: string },
) {
	return {
		queryKey: ["stats", "new-acquisitions-performance", params] as const,
		queryFn: async (): Promise<NewAcquisitionPerformanceStat[]> => {
			const { data } = await client.get(
				`${STATS_BASE}/new-acquisitions-performance`,
				{ params: cleanParams(params) },
			);
			return data;
		},
	};
}
