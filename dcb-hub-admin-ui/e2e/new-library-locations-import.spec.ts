import type { Page } from "@playwright/test";

import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraryDetail from "./fixtures-data/library-detail.json";

/**
 * Importing pickup locations from the New Library wizard's Locations step.
 *
 * Reached through "Finish setup" on a library whose only outstanding work is its
 * locations, which drops the wizard straight onto that step.
 */

const LIBRARY_ID = "c23df3ab-77c0-5689-b56d-fc8a2d6a5f22";

const libraryNeedingLocations = () => {
	const data = structuredClone(libraryDetail) as any;
	Object.assign(data.libraries.content[0], {
		latitude: 51.5,
		longitude: -0.1,
		contacts: [
			{
				id: "c-1",
				firstName: "Ada",
				lastName: "Lovelace",
				email: "ada@example.invalid",
				role: { name: "LIBRARY_SERVICES_ADMINISTRATOR" },
				isPrimaryContact: true,
			},
		],
		membership: [{ id: "m-1", libraryGroup: { id: "g-1", name: "G" } }],
	});
	return data;
};

async function openLocationsImport(
	page: Page,
	{ existingLocations }: { existingLocations: number },
) {
	await seedAuth(page);
	await mockGraphQL(page, {
		LoadConsortiumHeader: consortiumBasics,
		LoadLibrary: libraryNeedingLocations(),
		LoadMappings: { referenceValueMappings: { totalSize: 5, content: [] } },
		LoadNumericRangeMappings: {
			numericRangeMappings: { totalSize: 5, content: [] },
		},
		LoadLocations: { locations: { totalSize: 0, content: [] } },
		CheckExistingLocations: (variables: { query: string }) => ({
			locations: {
				// Only answered for the library's own Host LMS.
				totalSize: variables.query.includes(
					libraryDetail.libraries.content[0].agency.hostLms.id,
				)
					? existingLocations
					: 0,
			},
		}),
	});

	await page.goto(`/libraries/${LIBRARY_ID}`);
	await page.getByRole("button", { name: /finish setup/i }).click();
	const wizard = page.getByRole("dialog").first();
	await expect(wizard.locator(".MuiStepLabel-label.Mui-active")).toHaveText(
		/locations/i,
	);
	await wizard.getByRole("button", { name: /^import$/i }).click();

	const importDialog = page
		.getByRole("dialog")
		.filter({ hasText: /select file/i });
	await expect(importDialog).toBeVisible();
	return importDialog;
}

const chooseFile = (page: Page) =>
	page.locator("#file-upload").setInputFiles({
		name: "locations.csv",
		mimeType: "text/csv",
		buffer: Buffer.from("code,name\nA,B\n"),
	});

test.describe("New Library wizard - importing locations", () => {
	test("warns before replacing the Host LMS's existing locations", async ({
		page,
	}) => {
		let uploads = 0;
		await page.route("**/locations/upload", async (route) => {
			uploads++;
			await route.fulfill({
				json: { recordsImported: 3, recordsDeleted: 4, recordsIgnored: 0 },
			});
		});

		const importDialog = await openLocationsImport(page, {
			existingLocations: 4,
		});
		await chooseFile(page);
		await importDialog.getByRole("button", { name: /^import$/i }).click();

		await expect(
			page.getByRole("dialog").filter({ hasText: /will be deleted/ }),
		).toContainText(
			"4 existing locations for alpha-lms at Alpha Test Library will be deleted and replaced with the contents of locations.csv",
		);
		expect(uploads).toBe(0);
	});

	test("sends the file once, however often Import is pressed while it uploads", async ({
		page,
	}) => {
		let uploads = 0;
		let release: () => void = () => {};
		const held = new Promise<void>((resolve) => (release = resolve));
		await page.route("**/locations/upload", async (route) => {
			uploads++;
			await held;
			await route.fulfill({
				json: { recordsImported: 3, recordsDeleted: 0, recordsIgnored: 0 },
			});
		});

		const importDialog = await openLocationsImport(page, {
			existingLocations: 0,
		});
		await chooseFile(page);
		const importButton = importDialog.getByRole("button", {
			name: /^import$/i,
		});
		await importButton.click();
		await expect(importButton).toBeDisabled();
		// Forced: a person can still press a button that has gone grey.
		await importButton.click({ force: true });
		await importButton.click({ force: true });

		release();
		await expect(page.getByText(/3 .*locations/i).first()).toBeVisible();
		expect(uploads).toBe(1);
	});
});
