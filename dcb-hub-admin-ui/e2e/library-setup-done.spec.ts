import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraryDetail from "./fixtures-data/library-detail.json";

const LIBRARY = libraryDetail.libraries.content[0];
const SET_UP = {
	...LIBRARY,
	latitude: 51.5,
	longitude: -0.1,
	contacts: [
		{
			id: "c0c0c0c0-1111-5111-9111-111111111111",
			firstName: "Grace",
			lastName: "Hopper",
			email: "grace@example.invalid",
			role: { name: "IMPLEMENTATION_CONTACT" },
			isPrimaryContact: true,
		},
	],
	membership: [
		{ id: "m1", libraryGroup: { id: "g1", code: "ALL", name: "Everyone" } },
	],
};
const one = (field: string) => ({ [field]: { totalSize: 1, content: [] } });

test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await seedAuth(page);
});

async function mockSetup(
	page: Page,
	{
		library = SET_UP,
		harvested = 0,
	}: { library?: unknown; harvested?: number } = {},
) {
	await mockGraphQL(page, {
		LoadConsortiumHeader: consortiumBasics,
		LoadLibrary: {
			libraries: {
				...libraryDetail.libraries,
				content: library ? [library] : [],
			},
		},
		LoadMappings: one("referenceValueMappings"),
		LoadNumericRangeMappings: one("numericRangeMappings"),
		LoadLocations: one("locations"),
		LoadBibs: { sourceBibs: { totalSize: harvested, content: [] } },
	});
}

test("an unknown library's setup says it could not be loaded instead of loading forever", async ({
	page,
}) => {
	await mockSetup(page, { library: null });
	await page.goto("/libraries/00000000-0000-5000-9000-000000000000/setup");

	await expect(
		page.getByText("This library could not be loaded"),
	).toBeVisible();
});

test("a failed count is reported as a failure, not as setup not started", async ({
	page,
}) => {
	await mockSetup(page);
	await page.route("**/graphql", async (route) => {
		if (route.request().postDataJSON()?.operationName === "LoadMappings") {
			await route.fulfill({
				json: { errors: [{ message: "Temporarily unavailable" }] },
			});
			return;
		}
		await route.fallback();
	});
	await page.goto(`/libraries/${LIBRARY.id}/setup/done`);

	await expect(
		page.getByText("This library could not be loaded"),
	).toBeVisible();
	await expect(page.getByText("Not started")).toHaveCount(0);
	await expect(page.getByText(/still has setup to finish/)).toHaveCount(0);
});
