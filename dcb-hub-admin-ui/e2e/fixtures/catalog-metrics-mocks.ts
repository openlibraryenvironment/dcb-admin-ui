import type { Page } from "@playwright/test";

export const METRICS_HOST_LMS_ID = "a1a1a1a1-1111-5111-9111-111111111111";
export const UNKNOWN_HOST_LMS_ID = "f0f0f0f0-0000-5000-9000-000000000000";

export const harvestingHostLms = (awaiting: number) => ({
	id: METRICS_HOST_LMS_ID,
	name: "Alpha Sierra",
	ingestEnabled: true,
	checkPointId: "c1c1c1c1-1111-5111-9111-111111111111",
	checkPoint: { offset: 2000, limit: 2000 },
	sourceRecordCount: 5000 + awaiting,
	bibRecordCount: 4990,
	processStates: [
		{ value: "SUCCESS", count: 4990 },
		{ value: "FAILURE", count: 10 },
		...(awaiting > 0
			? [{ value: "PROCESSING_REQUIRED", count: awaiting }]
			: []),
	],
	errors: [],
	countedAt: "2026-09-29T10:15:00Z",
});

const idleHostLms = {
	id: "b2b2b2b2-2222-5222-9222-222222222222",
	name: "Beta Polaris",
	ingestEnabled: false,
	sourceRecordCount: 0,
	bibRecordCount: 0,
	processStates: [],
	errors: [],
	countedAt: "2026-09-29T10:15:00Z",
};

/** Two libraries in one group, for the scope selector. */
const library = (id: string, name: string, hostLmsCode: string) => ({
	id,
	fullName: name,
	agency: { code: `${hostLmsCode}-agency`, hostLms: { code: hostLmsCode } },
	membership: [
		{
			libraryGroup: {
				id: "9a9a9a9a-9999-5999-9999-999999999999",
				name: "North",
			},
		},
	],
});

export const scopeLibraries = {
	libraries: {
		totalSize: 2,
		content: [
			library(
				"c1000000-1111-5111-9111-111111111111",
				"Alpha Library",
				"alpha-lms",
			),
			library(
				"c2000000-2222-5222-9222-222222222222",
				"Beta Library",
				"beta-lms",
			),
		],
	},
};

/**
 * The shared list, a scoped list, and one Host LMS whose awaiting count is read from
 * `awaiting`. Each scoped request's `hostLmsCodes` is pushed onto `scopedRequests`.
 */
export async function mockCatalogMetrics(
	page: Page,
	awaiting: () => number = () => 1200,
	scopedRequests: string[] = [],
) {
	await page.route(
		(url) => url.pathname.endsWith("/hostlmss/importIngestDetails"),
		(route) => {
			const codes = new URL(route.request().url()).searchParams.get(
				"hostLmsCodes",
			);
			if (codes) scopedRequests.push(codes);
			return route.fulfill({
				json: codes
					? [harvestingHostLms(1200)]
					: [harvestingHostLms(1200), idleHostLms],
			});
		},
	);
	await page.route("**/hostlmss/importIngestDetails/*", (route) =>
		route.request().url().endsWith(METRICS_HOST_LMS_ID)
			? route.fulfill({ json: harvestingHostLms(awaiting()) })
			: route.fulfill({ status: 404, body: "" }),
	);
}
