import { Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { scanForViolations } from "./fixtures/axe";
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

// The profile question for a library on an existing system, opened by its link
const openProfileStepFor = async (page: Page, ils: string, code: string) => {
	await page.goto(`/libraries/new/profile?ils=${ils}&hostLms=${code}`);
	const main = page.getByRole("main");
	await expect(
		main.getByRole("heading", { level: 1, name: /tell us about the library/i }),
	).toBeVisible();
	return main;
};

test.describe("New library: authentication profile", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
			LoadHostLmsSelection: hostLmsSelection,
		});
	});

	test("offers the profiles Sierra accepts, barcode and PIN first", async ({
		page,
	}) => {
		const dialog = await openProfileStepFor(page, "sierra", "SIERRA1");

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
			"Sign in at the institution",
		]);
	});

	test("offers only the profiles Polaris accepts", async ({ page }) => {
		const dialog = await openProfileStepFor(page, "polaris", "POL1");

		await dialog
			.getByRole("combobox", { name: /authentication profile/i })
			.click();
		await expect(page.getByRole("option")).toHaveText([
			"Barcode and PIN",
			"Barcode and password",
			"Sign in at the institution",
		]);
	});

	test("asks nothing for Koha, which ignores the profile", async ({ page }) => {
		const dialog = await openProfileStepFor(page, "koha", "KOHA1");
		await expect(dialog.getByLabel(/full name/i)).toBeVisible();

		// Counted once, not retried: toHaveCount(0) passes as soon as any render lacks it
		expect(await dialog.getByLabel(/authentication profile/i).count()).toBe(0);
	});

	test("the profile select passes axe", async ({ page }) => {
		await openProfileStepFor(page, "sierra", "SIERRA1");

		await scanForViolations(page);
	});
});
