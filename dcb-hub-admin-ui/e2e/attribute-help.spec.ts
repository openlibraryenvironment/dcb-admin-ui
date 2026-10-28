import { test, expect } from "./fixtures/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import {
	expectPaintedScheme,
	scanForViolations,
	waitForDialogToSettle,
} from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";
import {
	patronRequestDetailMocks,
	TRACKED_REQUEST,
} from "./fixtures/patron-request-detail";

test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await seedAuth(page);
	await mockGraphQL(page, {
		LoadConsortium: consortiumBasics,
		LoadConsortiumHeader: consortiumBasics,
		LoadHostLms: { hostLms: { totalSize: 0, content: [] } },
		LoadLibraryDirectory: libraries,
		...patronRequestDetailMocks,
	});
});

test("explains the current status from the keyboard, and gives focus back", async ({
	page,
}) => {
	await page.goto(`/patronRequests/${TRACKED_REQUEST.id}`);

	const trigger = page.getByRole("button", { name: "About Current status" });
	await trigger.focus();
	await page.keyboard.press("Enter");

	const dialog = page.getByRole("dialog", {
		name: "Current status: Pickup transit",
	});
	await expect(dialog).toContainText("the item, or its hold, is in transit");
	await expect(dialog).toContainText(
		"The item is still on its way to the pickup library.",
	);

	await page.keyboard.press("Escape");
	await expect(dialog).toBeHidden();
	await expect(trigger).toBeFocused();
});

test.describe("at 320 CSS px", () => {
	test.use({ viewport: { width: 320, height: 640 } });

	test("the open explanation stays on the screen (WCAG 1.4.10)", async ({
		page,
	}) => {
		await page.goto(`/patronRequests/${TRACKED_REQUEST.id}`);
		await page.getByRole("button", { name: "About Current status" }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await waitForDialogToSettle(page);

		const box = await page.getByRole("dialog").boundingBox();
		expect(box!.x).toBeGreaterThanOrEqual(0);
		expect(box!.x + box!.width).toBeLessThanOrEqual(320);
	});
});

for (const scheme of ["light", "dark"] as const) {
	test.describe(`${scheme} mode`, () => {
		test.use({ colorScheme: scheme });

		test("the open explanation has no violations", async ({ page }) => {
			await page.goto(`/patronRequests/${TRACKED_REQUEST.id}`);
			await page.getByRole("button", { name: "About Current status" }).click();
			await expect(page.getByRole("dialog")).toBeVisible();
			await waitForDialogToSettle(page);

			await expectPaintedScheme(page, scheme);
			await scanForViolations(page);
		});
	});
}
