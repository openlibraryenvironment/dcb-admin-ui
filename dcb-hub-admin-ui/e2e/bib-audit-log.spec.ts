import { test, expect } from "./fixtures/test";
import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL, overrideGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { scanForViolations } from "./fixtures/axe";
import { MOCKS } from "./fixtures/routes";
import bibDetail from "./fixtures-data/bib-detail.json";

const BIB_ID = "bb220000-2222-5222-9222-bbbbbbbbbbbb";

const AUDIT_LOG = {
	ingest: [
		{
			id: "a1",
			processType: "ingest",
			processId: "p1",
			subjectId: BIB_ID,
			message: "Matched on ISBN 9780000000001",
			timestamp: "2026-11-01T10:00:00Z",
		},
	],
};

test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await mockGraphQL(page, MOCKS);
	await overrideGraphQL(page, {
		LoadBibMainDetails: bibDetail,
		LoadBibSourceRecord: bibDetail,
	});
});

test("an ADMIN can open what the last ingest recorded, fetched only then", async ({
	page,
}) => {
	let fetched = 0;
	await page.route(`**/bibs/${BIB_ID}/audit-log`, (route) => {
		fetched += 1;
		return route.fulfill({ json: AUDIT_LOG });
	});
	await seedAuth(page, { roles: ADMIN_ROLES });
	await page.goto(`/bibs/${BIB_ID}`);

	const summary = page.getByRole("button", { name: "Ingest audit log" });
	await expect(summary).toBeVisible();
	expect(fetched).toBe(0);

	await summary.click();
	await expect(
		page.getByRole("cell", { name: "Matched on ISBN 9780000000001" }),
	).toBeVisible();
	expect(fetched).toBe(1);
});

test("is not offered without ADMIN", async ({ page }) => {
	await seedAuth(page, { roles: ["CONSORTIUM_ADMIN"] });
	await page.goto(`/bibs/${BIB_ID}`);
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

	await expect(
		page.getByRole("button", { name: "Ingest audit log" }),
	).toHaveCount(0);
});

for (const scheme of ["light", "dark"] as const) {
	test(`passes axe open, ${scheme}`, async ({ page }) => {
		await page.emulateMedia({ colorScheme: scheme });
		await page.route(`**/bibs/${BIB_ID}/audit-log`, (route) =>
			route.fulfill({ json: AUDIT_LOG }),
		);
		await seedAuth(page, { roles: ADMIN_ROLES });
		await page.goto(`/bibs/${BIB_ID}`);
		await page.getByRole("button", { name: "Ingest audit log" }).click();
		await expect(
			page.getByRole("cell", { name: "Matched on ISBN 9780000000001" }),
		).toBeVisible();

		await scanForViolations(page);
	});
}

test.describe("A bib that no longer exists", () => {
	const NO_SUCH_BIB = { sourceBibs: { totalSize: 0, content: [] } };

	test.beforeEach(async ({ page }) => {
		await overrideGraphQL(page, { LoadBibMainDetails: NO_SUCH_BIB });
	});

	test("an ADMIN is told it was deleted, and shown what DCB last recorded", async ({
		page,
	}) => {
		await page.route(`**/bibs/${BIB_ID}/audit-log`, (route) =>
			route.fulfill({ json: AUDIT_LOG }),
		);
		await seedAuth(page, { roles: ADMIN_ROLES });
		await page.goto(`/bibs/${BIB_ID}`);

		await expect(
			page.getByRole("heading", {
				level: 1,
				name: "This bib record no longer exists",
			}),
		).toBeVisible();
		await expect(
			page.getByText(/last recorded this bib record on 2026-11-01/),
		).toBeVisible();
		await expect(
			page.getByRole("cell", { name: "Matched on ISBN 9780000000001" }),
		).toBeVisible();
	});

	test("an ADMIN is told it cannot be found when DCB recorded nothing for it", async ({
		page,
	}) => {
		await page.route(`**/bibs/${BIB_ID}/audit-log`, (route) =>
			route.fulfill({ json: {} }),
		);
		await seedAuth(page, { roles: ADMIN_ROLES });
		await page.goto(`/bibs/${BIB_ID}`);

		await expect(
			page.getByRole("heading", {
				level: 1,
				name: "Unable to find the record",
			}),
		).toBeVisible();
	});

	test("without ADMIN it is not found, and the audit log is never asked for", async ({
		page,
	}) => {
		let fetched = 0;
		await page.route(`**/bibs/${BIB_ID}/audit-log`, (route) => {
			fetched += 1;
			return route.fulfill({ json: AUDIT_LOG });
		});
		await seedAuth(page, { roles: ["CONSORTIUM_ADMIN"] });
		await page.goto(`/bibs/${BIB_ID}`);

		await expect(
			page.getByRole("heading", {
				level: 1,
				name: "Unable to find the record",
			}),
		).toBeVisible();
		expect(fetched).toBe(0);
	});

	for (const scheme of ["light", "dark"] as const) {
		test(`passes axe, ${scheme}`, async ({ page }) => {
			await page.emulateMedia({ colorScheme: scheme });
			await page.route(`**/bibs/${BIB_ID}/audit-log`, (route) =>
				route.fulfill({ json: AUDIT_LOG }),
			);
			await seedAuth(page, { roles: ADMIN_ROLES });
			await page.goto(`/bibs/${BIB_ID}`);
			await expect(
				page.getByRole("cell", { name: "Matched on ISBN 9780000000001" }),
			).toBeVisible();

			await scanForViolations(page);
		});
	}
});
