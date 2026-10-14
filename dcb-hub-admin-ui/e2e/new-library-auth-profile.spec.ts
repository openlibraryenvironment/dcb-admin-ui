import { Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { scanForViolations, waitForDialogToSettle } from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";

// The authentication profile is a closed vocabulary per ILS: a free-text typo made
// dcb-service answer every patron at the library as if their PIN were wrong
const hostLmsSelection = {
	hostLms: {
		totalSize: 3,
		content: [
			{
				id: "1",
				code: "KOHA1",
				name: "Koha one",
				lmsClientClass: "org.olf.dcb.core.interaction.koha.KohaHostLmsClient",
			},
			{
				id: "2",
				code: "POL1",
				name: "Polaris one",
				lmsClientClass: "org.olf.dcb.core.interaction.polaris.PolarisLmsClient",
			},
			{
				id: "3",
				code: "SIERRA1",
				name: "Sierra one",
				lmsClientClass: "org.olf.dcb.core.interaction.sierra.SierraLmsClient",
			},
		],
	},
};

const wizard = (page: Page) =>
	page
		.getByRole("dialog")
		.filter({ hasNot: page.getByText(/unsaved changes/i) });

const openProfileStepFor = async (page: Page, hostLmsName: RegExp) => {
	await page.getByRole("button", { name: /actions/i }).click();
	await page.getByRole("menuitem", { name: /create a new library/i }).click();
	await page.getByRole("radio", { name: /use existing system/i }).check();
	await page.getByRole("button", { name: /continue/i }).click();

	const dialog = wizard(page);
	await dialog.getByRole("combobox", { name: /host lms/i }).click();
	await page.getByRole("option", { name: hostLmsName }).click();
	await dialog.getByRole("button", { name: /next/i }).click();

	await expect(dialog.locator(".MuiStepLabel-label.Mui-active")).toHaveText(
		/profile/i,
	);

	return dialog;
};

test.describe("New Library wizard: authentication profile", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
			LoadHostLmsSelection: hostLmsSelection,
		});
		await page.goto("/libraries");
		await expect(page.getByText("Alpha Test Library")).toBeVisible();
	});

	test("offers the four profiles Sierra accepts, barcode and PIN first", async ({
		page,
	}) => {
		const dialog = await openProfileStepFor(page, /SIERRA1/);

		const profile = dialog.getByRole("combobox", {
			name: /authentication profile/i,
		});
		await expect(profile).toHaveText("Barcode and PIN");

		await profile.click();
		await expect(page.getByRole("option")).toHaveText([
			"Barcode and PIN",
			"Barcode and name",
			"Unique ID and PIN",
			"Unique ID and name",
		]);
	});

	test("offers only the two profiles Polaris accepts", async ({ page }) => {
		const dialog = await openProfileStepFor(page, /POL1/);

		await dialog
			.getByRole("combobox", { name: /authentication profile/i })
			.click();
		await expect(page.getByRole("option")).toHaveText([
			"Barcode and PIN",
			"Barcode and password",
		]);
	});

	test("asks nothing for Koha, which ignores the profile", async ({ page }) => {
		const dialog = await openProfileStepFor(page, /KOHA1/);
		await expect(dialog.getByLabel(/full name/i)).toBeVisible();

		// Counted once, not retried: toHaveCount(0) passes as soon as any render lacks it
		expect(await dialog.getByLabel(/authentication profile/i).count()).toBe(0);
	});

	test("the profile select passes axe", async ({ page }) => {
		await openProfileStepFor(page, /SIERRA1/);

		await waitForDialogToSettle(page);
		await scanForViolations(page);
	});
});
