import { Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { scanForViolations } from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraryDetail from "./fixtures-data/library-detail.json";

// Both real-world mapping files shipped so far map every DCB type to a single local value,
// which the mapping step can write without a spreadsheet
const LIBRARY_ID = libraryDetail.libraries.content[0].id;

// The mappings chapter of an existing library's setup, opened by its link
const reachMappingStep = async (page: Page) => {
	await page.goto(`/libraries/${LIBRARY_ID}/setup/refMappings`);
	const chapter = page.getByRole("main");
	await expect(
		chapter.getByRole("heading", {
			level: 1,
			name: /what do its patron types/i,
		}),
	).toBeVisible();
	return chapter;
};

test.describe("Library setup: map every DCB type", () => {
	let created: Record<string, unknown>[] = [];

	test.beforeEach(async ({ page }) => {
		created = [];
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibrary: libraryDetail,
			LoadMappings: { referenceValueMappings: { totalSize: 0, content: [] } },
			LoadLocations: { locations: { totalSize: 0, content: [] } },
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
	});

	test("previews and then creates one mapping per DCB type", async ({
		page,
	}) => {
		const dialog = await reachMappingStep(page);

		await dialog
			.getByLabel(/patron type for patrons from other libraries/i)
			.fill("15");
		await dialog
			.getByLabel(/item type for items borrowed from other libraries/i)
			.fill("BOOK");

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
			toContext: libraryDetail.libraries.content[0].agency.hostLms.code,
			toValue: "15",
		});
	});

	test("passes axe with the preview shown", async ({ page }) => {
		const dialog = await reachMappingStep(page);
		await dialog
			.getByLabel(/item type for items borrowed from other libraries/i)
			.fill("BOOK");
		await expect(dialog.getByRole("table")).toBeVisible();

		await scanForViolations(page);
	});
});
