import { test, expect } from "./fixtures/test";
import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL, overrideGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { scanForViolations } from "./fixtures/axe";
import { MOCKS } from "./fixtures/routes";
import bibDetail from "./fixtures-data/bib-detail.json";

const BIB_ID = "bb220000-2222-5222-9222-bbbbbbbbbbbb";
const POINTS = [
	{
		value: "5d1a0000-1111-5111-9111-5d1a5d1a5d1a",
		domain: "ISBN",
		sourceValueHint: "9780000000001",
	},
];

test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await mockGraphQL(page, MOCKS);
	await overrideGraphQL(page, {
		LoadBibMainDetails: bibDetail,
		LoadBibSourceRecord: bibDetail,
	});
});

// What answers "why did these two not cluster": nothing on the page showed it
test("an ADMIN can see what the bib clusters on, fetched only when asked", async ({
	page,
}) => {
	let fetched = 0;
	await page.route(`**/bibs/${BIB_ID}/matchpoints`, (route) => {
		fetched++;
		return route.fulfill({ json: POINTS });
	});
	await seedAuth(page, { roles: ADMIN_ROLES });
	await page.goto(`/bibs/${BIB_ID}`);

	const summary = page.getByRole("button", { name: "Match points" });
	await expect(summary).toBeVisible();
	expect(fetched).toBe(0);

	await summary.click();
	const row = page.getByRole("row").filter({ hasText: "ISBN" });
	await expect(row).toContainText("9780000000001");
	await expect(row).toContainText(POINTS[0].value);
	expect(fetched).toBe(1);
	await scanForViolations(page);
});

// GET /bibs/{id}/matchpoints is @Secured(ADMINISTRATOR), 8.71.0-9.3.0
test("is not offered without ADMIN", async ({ page }) => {
	await seedAuth(page, { roles: ["CONSORTIUM_ADMIN"] });
	await page.goto(`/bibs/${BIB_ID}`);
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

	await expect(page.getByRole("button", { name: "Match points" })).toHaveCount(
		0,
	);
});
