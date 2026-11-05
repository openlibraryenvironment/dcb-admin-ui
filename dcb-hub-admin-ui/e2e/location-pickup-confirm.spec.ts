import { test, expect } from "./fixtures/test";
import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL, overrideGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { MOCKS } from "./fixtures/routes";
import locations from "./fixtures-data/locations.json";

const LOCATION = locations.locations.content[0];

// The confirmation's old -> new table showed "-" for both when pickup had never been set
test("enabling pickup on a location where it was never set confirms Not set -> true", async ({
	page,
}) => {
	const neverSet: Record<string, unknown> = { ...LOCATION };
	delete neverSet.isPickup;
	await useAllFeatures(page);
	await mockGraphQL(page, MOCKS);
	await overrideGraphQL(page, {
		LoadLocation: { locations: { totalSize: 1, content: [neverSet] } },
	});
	await seedAuth(page, { roles: ADMIN_ROLES });
	await page.goto(`/locations/${LOCATION.id}`);

	await page.getByRole("button", { name: "Enable pickup" }).click();

	const row = page
		.getByRole("dialog")
		.getByRole("table")
		.getByRole("row")
		.filter({ hasText: /pickup/i });
	await expect(row.getByRole("cell").nth(0)).toHaveText("Not set");
	await expect(row.getByRole("cell").nth(1)).toHaveText("true");
});
