import { test, expect, type Page } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraryDetail from "./fixtures-data/library-detail.json";
import mappings from "./fixtures-data/mappings.json";

/**
 * Editing a mapping on a LIBRARY's mappings page refreshes the grid it was edited in.
 *
 * useEntityMutation invalidates with a predicate over queryKey[0], and these fourteen
 * grids keyed on their grid id ("refMappingsItemTypePrimary-<uuid>"), which no entity
 * prefix matches - so the mutation succeeded, the success alert appeared, and the row
 * still showed its old value. docs/query-error-policy.md, "Keys and invalidation".
 */

const LIBRARY_ID = libraryDetail.libraries.content[0].id;
const ROUTE = `/libraries/${LIBRARY_ID}/referenceValueMappings/itemType`;

const MOCKS = {
	LoadConsortiumHeader: consortiumBasics,
	LoadLibrary: libraryDetail,
	LoadMappings: mappings,
	UpdateReferenceValueMapping: {
		updateReferenceValueMapping: mappings.referenceValueMappings.content[0],
	},
};

const countOperation = (page: Page, operationName: string) => {
	const seen = { count: 0 };
	page.on("request", (request) => {
		if (request.method() !== "POST" || !request.url().includes("/graphql"))
			return;
		if (
			(request.postDataJSON() as { operationName?: string } | null)
				?.operationName === operationName
		)
			seen.count += 1;
	});
	return seen;
};

test("an edited mapping refetches the grid it was edited in", async ({
	page,
}) => {
	const loads = countOperation(page, "LoadMappings");
	await seedAuth(page);
	await useAllFeatures(page);
	await mockGraphQL(page, MOCKS);
	await page.goto(ROUTE);

	const row = page.getByRole("row").filter({ hasText: "loanable-item" });
	await expect(row).toBeVisible();
	const before = loads.count;

	// buildRowEditActionsColumn is called without `showInMenu`, so these are icon
	// buttons in the row rather than items behind a menu.
	await row.getByRole("button", { name: "Edit" }).click();
	await row.getByRole("textbox").first().fill("42");
	await row.getByRole("button", { name: "Save" }).click();

	// Every edit goes through Confirmation, which requires an audit reason before its
	// confirm button enables - the change is recorded in the data change log.
	const dialog = page.getByRole("dialog");
	await dialog.getByLabel(/Reason/).fill("e2e: assert the grid refetches");
	await dialog.getByRole("button", { name: "Save changes" }).click();

	// The mutation having been accepted is NOT the assertion - it was always accepted.
	// The assertion is that the list the user is looking at was asked for again.
	await expect
		.poll(() => loads.count, { timeout: 15_000 })
		.toBeGreaterThan(before);
});
