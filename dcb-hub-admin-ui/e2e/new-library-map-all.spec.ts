import { Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { scanForViolations } from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";

// Both real-world mapping files shipped so far map every DCB type to a single local value,
// which the mapping step can write without a spreadsheet
const wizard = (page: Page) =>
	page
		.getByRole("dialog")
		.filter({ hasNot: page.getByText(/unsaved changes/i) });

const reachMappingStep = async (page: Page) => {
	await page.getByRole("button", { name: /actions/i }).click();
	await page.getByRole("menuitem", { name: /create a new library/i }).click();
	await page.getByRole("radio", { name: /use existing system/i }).check();
	await page.getByRole("button", { name: /continue/i }).click();

	const dialog = wizard(page);
	await dialog.getByRole("combobox", { name: /host lms/i }).click();
	await page.getByRole("option", { name: /SIERRA1/ }).click();
	await dialog.getByRole("button", { name: /next/i }).click();

	await dialog.getByLabel("Full name").fill("Map All Library");
	await dialog.getByLabel("Short name").fill("Map All");
	await dialog.getByLabel("Abbreviated name").fill("MAL");
	await dialog
		.getByRole("combobox", { name: /associated agency/i })
		.fill("MAPALL");
	await dialog.getByLabel("Address").fill("1 Library Street");
	await dialog.getByLabel("Type").fill("Public");
	await dialog.getByLabel(/latitude/i).fill("51.5");
	await dialog.getByLabel(/longitude/i).fill("-0.12");
	await dialog.getByLabel(/authentication profile/i).fill("BASIC/BARCODE+PIN");
	await dialog.getByRole("button", { name: /next/i }).click();

	await dialog.getByLabel("First name").fill("Ada");
	await dialog.getByLabel("Last name").fill("Lovelace");
	await dialog.getByLabel("Email").fill("ada@example.org");
	await dialog.getByRole("combobox", { name: "Role" }).click();
	await page.getByRole("option").first().click();
	await dialog.getByRole("button", { name: /next/i }).click();

	await expect(dialog.locator(".MuiStepLabel-label.Mui-active")).toHaveText(
		/group/i,
	);
	await dialog.getByRole("button", { name: /next/i }).click();

	return dialog;
};

test.describe("New Library wizard: map every DCB type", () => {
	let created: Record<string, unknown>[] = [];

	test.beforeEach(async ({ page }) => {
		created = [];
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
			CreateLibrary: { createLibrary: { id: "new-library-id" } },
			CreateReferenceValueMapping: (variables: any) => {
				created.push(variables.input);
				return {
					createReferenceValueMapping: {
						id: String(created.length),
						toValue: "x",
					},
				};
			},
		});
		await page.goto("/libraries");
		await expect(page.getByText("Alpha Test Library")).toBeVisible();
	});

	test("previews and then creates one mapping per DCB type", async ({
		page,
	}) => {
		const dialog = await reachMappingStep(page);

		await dialog.getByLabel(/your patron type/i).fill("15");
		await dialog.getByLabel(/your item type/i).fill("BOOK");

		await expect(dialog.getByRole("table")).toContainText(
			"14 mappings will be created",
		);
		await expect(dialog.getByRole("row")).toHaveCount(15);

		await dialog.getByRole("button", { name: "Create 14 mappings" }).click();

		await expect(dialog.getByText("14 mappings created.")).toBeVisible();
		expect(created).toHaveLength(14);
		expect(created[0]).toMatchObject({
			fromContext: "DCB",
			fromCategory: "patronType",
			fromValue: "ADULT",
			toContext: "SIERRA1",
			toValue: "15",
		});
	});

	test("passes axe with the preview shown", async ({ page }) => {
		const dialog = await reachMappingStep(page);
		await dialog.getByLabel(/your item type/i).fill("BOOK");
		await expect(dialog.getByRole("table")).toBeVisible();

		await scanForViolations(page);
	});
});
