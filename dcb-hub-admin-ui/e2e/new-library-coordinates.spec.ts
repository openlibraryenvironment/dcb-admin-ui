import { Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";

// dcb-service overwrites a new library's coordinates with its agency's when the agency has
// them, so the wizard shows those rather than asking for values it would discard
const wizard = (page: Page) =>
	page
		.getByRole("dialog")
		.filter({ hasNot: page.getByText(/unsaved changes/i) });

test.describe("New Library wizard: coordinates", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
			LoadHostLmsSelection: {
				hostLms: {
					totalSize: 1,
					content: [
						{
							id: "3",
							code: "SIERRA1",
							name: "Sierra one",
							lmsClientClass:
								"org.olf.dcb.core.interaction.sierra.SierraLmsClient",
						},
					],
				},
			},
			LoadAgencies: {
				agencies: {
					totalSize: 2,
					content: [
						{
							id: "a1",
							code: "PLACED",
							name: "Placed Agency",
							latitude: 51.5074,
							longitude: -0.1278,
						},
						{
							id: "a2",
							code: "UNPLACED",
							name: "Unplaced Agency",
							latitude: null,
							longitude: null,
						},
					],
					pageable: { number: 0, offset: 0 },
				},
			},
		});
		await page.goto("/libraries");
		await expect(page.getByText("Alpha Test Library")).toBeVisible();

		await page.getByRole("button", { name: /actions/i }).click();
		await page.getByRole("menuitem", { name: /create a new library/i }).click();
		await page.getByRole("radio", { name: /use existing system/i }).check();
		await page.getByRole("button", { name: /continue/i }).click();
		const dialog = wizard(page);
		await dialog.getByRole("combobox", { name: /host lms/i }).click();
		await page.getByRole("option", { name: /SIERRA1/ }).click();
		await dialog.getByRole("button", { name: /next/i }).click();
		await expect(dialog.locator(".MuiStepLabel-label.Mui-active")).toHaveText(
			/profile/i,
		);
	});

	test("shows an existing agency's coordinates instead of asking", async ({
		page,
	}) => {
		const dialog = wizard(page);
		await dialog.getByRole("combobox", { name: /agency/i }).click();
		await page.getByRole("option", { name: /Placed Agency/ }).click();

		const latitude = dialog.getByRole("textbox", { name: /latitude/i });
		await expect(latitude).toHaveValue("51.5074");
		await expect(latitude).toHaveAttribute("readonly", "");
		await expect(
			dialog.getByRole("textbox", { name: /longitude/i }),
		).toHaveValue("-0.1278");
		await expect(
			dialog.getByText(/taken from agency PLACED/i).first(),
		).toBeVisible();
	});

	test("still asks when the agency has no coordinates", async ({ page }) => {
		const dialog = wizard(page);
		await dialog.getByRole("combobox", { name: /agency/i }).click();
		await page.getByRole("option", { name: /Unplaced Agency/ }).click();

		const latitude = dialog.getByRole("textbox", { name: /latitude/i });
		await expect(latitude).toHaveValue("");
		await expect(latitude).not.toHaveAttribute("readonly", "");
	});
});
