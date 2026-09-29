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

/** The shared list, and one Host LMS whose awaiting count is read from `awaiting`. */
export async function mockCatalogMetrics(
	page: Page,
	awaiting: () => number = () => 1200,
) {
	await page.route("**/hostlmss/importIngestDetails", (route) =>
		route.fulfill({ json: [harvestingHostLms(1200), idleHostLms] }),
	);
	await page.route("**/hostlmss/importIngestDetails/*", (route) =>
		route.request().url().endsWith(METRICS_HOST_LMS_ID)
			? route.fulfill({ json: harvestingHostLms(awaiting()) })
			: route.fulfill({ status: 404, body: "" }),
	);
}
