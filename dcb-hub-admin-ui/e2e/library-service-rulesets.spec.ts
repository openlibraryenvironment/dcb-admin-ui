import { test, expect } from "./fixtures/test";
import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { MOCKS } from "./fixtures/routes";
import libraryDetail from "./fixtures-data/library-detail.json";

const LIBRARY = "c23df3ab-77c0-5689-b56d-fc8a2d6a5f22";
const BIB_RULESET =
	"Bib suppression ruleset for the Alpha LMS library management system";

const withRulesets = structuredClone(libraryDetail);
Object.assign(withRulesets.libraries.content[0].agency.hostLms, {
	suppressionRulesetName: "alpha-bib-rules",
});

test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await mockGraphQL(page, { ...MOCKS, LoadLibraryServiceInfo: withRulesets });
});

const openRuleset = async (page: import("@playwright/test").Page) => {
	await page.goto(`/libraries/${LIBRARY}/service`);
	await page.getByRole("button", { name: BIB_RULESET }).click();
};

test("an administrator sees the ruleset once its section opens", async ({
	page,
}) => {
	let fetched = 0;
	await page.route("**/object-rules/alpha-bib-rules", (route) => {
		fetched++;
		return route.fulfill({
			json: { name: "alpha-bib-rules", type: "DISJUNCTIVE" },
		});
	});
	await seedAuth(page, { roles: ADMIN_ROLES });
	await page.goto(`/libraries/${LIBRARY}/service`);
	await expect(page.getByRole("button", { name: BIB_RULESET })).toBeVisible();
	expect(fetched).toBe(0);

	await page.getByRole("button", { name: BIB_RULESET }).click();

	await expect(page.getByText('"type": "DISJUNCTIVE"')).toBeVisible();
	expect(fetched).toBe(1);
});

test("a failure is said in words, not as JSON", async ({ page }) => {
	await page.route("**/object-rules/alpha-bib-rules", (route) =>
		route.fulfill({ status: 500, json: {} }),
	);
	await seedAuth(page, { roles: ADMIN_ROLES });
	await openRuleset(page);

	await expect(page.getByRole("status")).toContainText(
		"The rules for alpha-bib-rules could not be loaded.",
	);
});

// GET /object-rules/{name} is @Secured(ADMINISTRATOR), 8.71.0-9.3.0
test("a consortium administrator without ADMIN is told why, and nothing is fetched", async ({
	page,
}) => {
	let fetched = false;
	await page.route("**/object-rules/**", (route) => {
		fetched = true;
		return route.fulfill({ status: 403, json: {} });
	});
	await seedAuth(page, { roles: ["CONSORTIUM_ADMIN", "LIBRARY_ADMIN"] });
	await openRuleset(page);

	await expect(page.getByRole("status")).toContainText(
		"Only administrators can view a ruleset's rules.",
	);
	expect(fetched).toBe(false);
});
