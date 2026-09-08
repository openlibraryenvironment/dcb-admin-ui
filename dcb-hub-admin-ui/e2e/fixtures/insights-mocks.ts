import type { Page } from "@playwright/test";

/**
 * Route-level mocks for the Insights REST surface, plus the runtime config that turns the
 * feature on.
 *
 * Every panel on the dashboard is fed from here, so the accessibility scan sees a fully
 * populated page - charts with marks, tables with rows, tiles with numbers - rather than
 * the empty states, which are the easy case and not the one that fails contrast.
 *
 * Any /insights path not listed below is answered with an empty collection rather than
 * being left to hang, so adding a panel cannot silently stall the gate.
 */

const partner = (
	partnerCode: string,
	partnerName: string | null,
	n: number,
) => ({
	partnerCode,
	partnerName,
	requestCount: n,
});

const cluster = (clusterId: string, title: string, requestCount: number) => ({
	clusterId,
	title,
	author: "Ursula K. Le Guin",
	requestCount,
	supplyCount: requestCount,
	localBibId: `bib-${clusterId}`,
	dateAdded: "2026-01-04T00:00:00Z",
});

const INSIGHTS: Record<string, unknown> = {
	dashboard: {
		fulfillmentCurrent: { successfulCount: 812, failedCount: 96 },
		fulfillmentPrior: { successfulCount: 690, failedCount: 130 },
		turnaroundToLoaned: { p50Seconds: 187_200, p95Seconds: 540_000 },
		checkoutRate: { reachedCount: 744, totalCount: 908 },
		lendBorrowTotals: { borrowedCount: 908, suppliedCount: 1041 },
		savedByReResolution: 37,
		collectionSummary: { uniqueTitlesRequested: 763, totalRequests: 908 },
	},
	"dashboard-metrics": {
		turnaroundToLoaned: { p50Seconds: 187_200, p95Seconds: 540_000 },
		turnaroundToFinalised: { p50Seconds: 1_209_600, p95Seconds: 2_592_000 },
		topSuppliers: [
			partner("NORTH", "Northern University", 210),
			partner("CENTRAL", "Central City Libraries", 168),
			partner("EAST", null, 94),
		],
		topBorrowers: [
			partner("WEST", "Western College", 187),
			partner("SOUTH", "Southern Institute", 143),
		],
	},
	turnaround: { p50Seconds: 1_209_600, p95Seconds: 2_592_000 },
	"fulfillment/borrower": { successfulCount: 812, failedCount: 96 },
	"fulfillment/supplier": { successfulCount: 941, failedCount: 100 },
	timeseries: [
		{ bucket: "2026-07-01T00:00:00Z", series: "LOANED", count: 41 },
		{ bucket: "2026-07-08T00:00:00Z", series: "LOANED", count: 55 },
		{
			bucket: "2026-07-01T00:00:00Z",
			series: "REQUEST_PLACED_AT_SUPPLYING_AGENCY",
			count: 62,
		},
		{
			bucket: "2026-07-08T00:00:00Z",
			series: "REQUEST_PLACED_AT_SUPPLYING_AGENCY",
			count: 71,
		},
	],
	"failure-taxonomy": [
		{ reason: "NO_ITEMS_SELECTABLE_AT_ANY_AGENCY", count: 44 },
		{ reason: "PATRON_VERIFICATION_FAILED", count: 21 },
	],
	"supplier-reliability": [
		{ supplierCode: "NORTH", fulfilledCount: 190, failedCount: 20 },
		{ supplierCode: "CENTRAL", fulfilledCount: 150, failedCount: 18 },
	],
	"net-flow": [
		{ libraryCode: "NORTH", borrowedCount: 120, suppliedCount: 210 },
		{ libraryCode: "WEST", borrowedCount: 187, suppliedCount: 64 },
	],
	"time-in-status": [
		{ fromStatus: "REQUEST_PLACED_AT_SUPPLYING_AGENCY", medianSeconds: 86_400 },
		{ fromStatus: "CONFIRMED", medianSeconds: 43_200 },
	],
	"supplier-response-sla": [
		{ supplierCode: "NORTH", medianSeconds: 21_600 },
		{ supplierCode: "CENTRAL", medianSeconds: 46_800 },
	],
	"demand-heatmap": [
		{ dayOfWeek: 1, hourOfDay: 9, requestCount: 12 },
		{ dayOfWeek: 3, hourOfDay: 14, requestCount: 20 },
	],
	"peer-benchmarks": [
		{
			libraryCode: "NORTH",
			libraryName: "Northern University",
			totalRequests: 410,
			checkoutCount: 350,
			successCount: 380,
			failedCount: 30,
		},
		{
			libraryCode: "WEST",
			libraryName: null,
			totalRequests: 260,
			checkoutCount: 190,
			successCount: 210,
			failedCount: 50,
		},
	],
	"demand-by-dimension": [
		{ dimensionValue: "Book", requestCount: 540 },
		{ dimensionValue: "DVD", requestCount: 96 },
	],
	"demand-by-pickup-location": [
		{
			pickupLocationCode: "MAIN",
			pickupLocationName: "Main desk",
			requestCount: 320,
		},
		{ pickupLocationCode: "ANNEX", pickupLocationName: null, requestCount: 88 },
	],
	"demand-by-patron-group": [
		{ patronGroup: "Undergraduate", requestCount: 410 },
		{ patronGroup: "Staff", requestCount: 122 },
	],
	"unfillable-demand": [cluster("c-9", "A book nobody holds", 14)],
	"unique-contributions": [cluster("c-1", "The Dispossessed", 9)],
	"unmet-local-demand": [cluster("c-2", "The Left Hand of Darkness", 7)],
	"acquisition-opportunities": [cluster("c-3", "A Wizard of Earthsea", 11)],
	"consortial-lifeline": [cluster("c-4", "The Word for World Is Forest", 6)],
	"new-acquisitions-performance": [
		{
			clusterId: "c-5",
			title: "Recently bought",
			dateAdded: "2026-06-01T00:00:00Z",
			supplyCount: 4,
		},
	],
	"top-partners": {
		content: [
			{
				partnerCode: "NORTH",
				partnerName: "Northern University",
				borrowedFromCount: 120,
				suppliedToCount: 210,
				totalCount: 330,
			},
			{
				partnerCode: "EAST",
				partnerName: null,
				borrowedFromCount: 40,
				suppliedToCount: 54,
				totalCount: 94,
			},
		],
		totalSize: 2,
	},
	"collection-totals": {
		distinctTitles: 4_120_884,
		singlyHeldTitles: 1_902_311,
		holdings: 7_884_002,
		contributingSources: 42,
	},
	"collection-profile": [
		{
			sourceSystemId: "s-1",
			sourceSystemCode: "NORTH",
			clusterCount: 900_120,
			uniqueTitleCount: 210_004,
		},
		{
			sourceSystemId: "s-2",
			sourceSystemCode: "CENTRAL",
			clusterCount: 640_000,
			uniqueTitleCount: 88_120,
		},
	],
	"cluster-size-distribution": [
		{ holderCount: 1, clusterCount: 1_902_311 },
		{ holderCount: 2, clusterCount: 1_200_400 },
		{ holderCount: 3, clusterCount: 640_000 },
		{ holderCount: 12, clusterCount: 378_173 },
	],
	"format-profile": [
		{
			sourceSystemId: "s-1",
			sourceSystemCode: "NORTH",
			derivedType: "Book",
			titleCount: 800_000,
		},
		{
			sourceSystemId: "s-2",
			sourceSystemCode: "CENTRAL",
			derivedType: "Book",
			titleCount: 500_000,
		},
		{
			sourceSystemId: "s-1",
			sourceSystemCode: "NORTH",
			derivedType: null,
			titleCount: 12_000,
		},
	],
	"collection-overlap": [
		{
			leftSystemId: "s-1",
			leftSystemCode: "NORTH",
			rightSystemId: "s-2",
			rightSystemCode: "CENTRAL",
			sharedTitleCount: 410_002,
		},
	],
	"top-requested-titles": {
		content: [
			{
				title: "The Dispossessed",
				author: "Ursula K. Le Guin",
				requestCount: 31,
			},
			{ title: "Piranesi", author: "Susanna Clarke", requestCount: 24 },
		],
		totalSize: 2,
	},
};

export async function mockInsights(page: Page) {
	await page.route("**/insights/**", async (route) => {
		const path = new URL(route.request().url()).pathname;
		const key = path.slice(path.indexOf("/insights/") + "/insights/".length);

		// Longest match first, so "fulfillment/supplier" wins over a bare segment.
		const match = Object.keys(INSIGHTS)
			.filter(
				(candidate) => key === candidate || key.startsWith(`${candidate}/`),
			)
			.sort((a, b) => b.length - a.length)[0];

		await route.fulfill({ json: match ? INSIGHTS[match] : [] });
	});
}

/**
 * Turn the feature on for this page.
 *
 * getStandaloneConfig() short-circuits on window.__APP_ENV__, so seeding it before any app
 * script runs both enables the flag and spares the run a fetch of inject_env.json that the
 * preview server does not answer.
 */
export async function enableInsights(page: Page) {
	await page.addInitScript(() => {
		window.__APP_ENV__ = {
			VITE_MUI_X_LICENSE_KEY: "",
			VITE_KEYCLOAK_URL: "https://e2e-fake-keycloak.invalid/realms/dcb",
			VITE_KEYCLOAK_ID: "dcb-admin-e2e",
			VITE_DCB_API_BASE: "http://localhost:4173/api",
			VITE_DCB_SEARCH_BASE: "http://localhost:4173/search",
			VITE_FEATURE_INSIGHTS: "true",
		};
	});
}
