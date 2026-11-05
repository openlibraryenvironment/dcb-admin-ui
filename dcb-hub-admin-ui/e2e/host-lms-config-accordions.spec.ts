import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { scanForViolations } from "./fixtures/axe";
import { MOCKS } from "./fixtures/routes";
import hostLms from "./fixtures-data/host-lms.json";

const DETAIL = "/hostlmss/h1h1h1h1-1111-5111-9111-111111111111";

const polaris = structuredClone(hostLms);
polaris.hostLms.content[0] = {
	...polaris.hostLms.content[0],
	lmsClientClass: "org.olf.dcb.core.interaction.polaris.PolarisLmsClient",
	clientConfig: {
		...polaris.hostLms.content[0].clientConfig,
		item: { "barcode-prefix": "DCB-" },
		papi: { "app-id": "100" },
		services: { "organisation-id": "1" },
	} as (typeof polaris.hostLms.content)[0]["clientConfig"],
};

test.describe("Polaris client config", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		await mockGraphQL(page, { ...MOCKS, LoadHostLms: polaris });
		await page.goto(DETAIL);
		await page.getByRole("tab", { name: "Client config" }).click();
	});

	test("accordions each take a full row, stacked", async ({ page }) => {
		const boxes = [];
		for (const name of ["PAPI config", "Services config", "Item config"]) {
			const summary = page.getByRole("button", { name });
			await expect(summary).toBeVisible();
			boxes.push((await summary.boundingBox())!);
		}

		for (let i = 1; i < boxes.length; i++) {
			expect(boxes[i].y).toBeGreaterThanOrEqual(
				boxes[i - 1].y + boxes[i - 1].height,
			);
			expect(boxes[i].x).toBe(boxes[0].x);
			expect(boxes[i].width).toBe(boxes[0].width);
		}
	});

	for (const scheme of ["light", "dark"] as const) {
		test(`passes axe, ${scheme}`, async ({ page }) => {
			await page.emulateMedia({ colorScheme: scheme });
			await expect(
				page.getByRole("button", { name: "Item config" }),
			).toBeVisible();

			await scanForViolations(page);
		});
	}
});
