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
	requestCount: number;
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

export interface FormatDemandStat {
	format: string;
	requestCount: number;
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

const STATS_BASE = "/patrons/requests/stats";

// Strip undefined so axios does not serialise `libraryCode=undefined` etc.
function cleanParams<T extends object>(params: T): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(params).filter(([, v]) => v !== undefined && v !== null),
	);
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

export function borrowerFulfillmentQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
) {
	return {
		queryKey: ["stats", "fulfillment", "borrower", params] as const,
		queryFn: async (): Promise<FulfillmentStat> => {
			const { data } = await client.get(`${STATS_BASE}/fulfillment/borrower`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

// libraryCode is REQUIRED by this endpoint (unique-to-one-library is meaningless
// consortium-wide), so this is only used on the per-library page.
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

export function checkoutRateQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
) {
	return {
		queryKey: ["stats", "checkout-rate", params] as const,
		queryFn: async (): Promise<CheckoutRateStat> => {
			const { data } = await client.get(`${STATS_BASE}/checkout-rate`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

export function collectionSummaryQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
) {
	return {
		queryKey: ["stats", "collection-summary", params] as const,
		queryFn: async (): Promise<CollectionSummaryStat> => {
			const { data } = await client.get(`${STATS_BASE}/collection-summary`, {
				params: cleanParams(params),
			});
			return data;
		},
	};
}

export function demandByFormatQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
) {
	return {
		queryKey: ["stats", "demand-by-format", params] as const,
		queryFn: async (): Promise<FormatDemandStat[]> => {
			const { data } = await client.get(`${STATS_BASE}/demand-by-format`, {
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

export function savedByReResolutionQueryOptions(
	client: AxiosInstance,
	params: StatsParams,
) {
	return {
		queryKey: ["stats", "saved-by-re-resolution", params] as const,
		queryFn: async (): Promise<number> => {
			const { data } = await client.get(
				`${STATS_BASE}/saved-by-re-resolution`,
				{
					params: cleanParams(params),
				},
			);
			return data;
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
