import type { Page } from "@playwright/test";

import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import consortium from "./fixtures-data/consortium.json";
import libraries from "./fixtures-data/libraries.json";
import libraryCount from "./fixtures-data/library-count.json";

/**
 * A spreadsheet is judged against the Host LMS codes and the existing libraries. A file
 * chosen before both have arrived would be judged against empty lists - every row
 * "unknown Host LMS", every existing library a "create" - so choosing one waits for them.
 */

const hostLmsCodes = {
	hostLms: { totalSize: 1, content: [{ id: "h-1", code: "alpha-lms" }] },
};

async function openImport(page: Page) {
	await page.goto("/setup/libraries");
	await page
		.getByRole("button", { name: /import from a spreadsheet/i })
		.click();
	return page.getByRole("dialog", { name: /import libraries/i });
}

test.describe("Setup - library import waits for what it judges rows against", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadConsortium: consortium,
			LoadLibraries: libraries,
			LoadLibraryCount: libraryCount,
		});
	});

	test("a file cannot be chosen until the lookups have loaded, and says so", async ({
		page,
	}) => {
		let release: () => void = () => {};
		const held = new Promise<void>((resolve) => (release = resolve));
		await page.route("**/graphql", async (route) => {
			if (
				route.request().postDataJSON()?.operationName !== "LoadHostLmsCodes"
			) {
				await route.fallback();
				return;
			}
			await held;
			await route.fulfill({ json: { data: hostLmsCodes } });
		});

		const dialog = await openImport(page);
		const choose = dialog.getByRole("button", { name: /choose a file/i });

		await expect(choose).toBeDisabled();
		await expect(choose).toHaveAccessibleDescription(
			"Loading the Host LMS systems and libraries your file is checked against…",
		);

		release();
		await expect(choose).toBeEnabled();
	});

	test("a failed lookup is reported, and can be retried", async ({ page }) => {
		let attempts = 0;
		await page.route("**/graphql", async (route) => {
			if (
				route.request().postDataJSON()?.operationName !== "LoadHostLmsCodes"
			) {
				await route.fallback();
				return;
			}
			attempts++;
			await route.fulfill(
				attempts <= 2
					? { json: { errors: [{ message: "Temporarily unavailable" }] } }
					: { json: { data: hostLmsCodes } },
			);
		});

		const dialog = await openImport(page);
		const choose = dialog.getByRole("button", { name: /choose a file/i });

		await expect(dialog.getByRole("alert")).toContainText(
			"We could not load the Host LMS systems and libraries your file is checked against.",
		);
		await expect(choose).toBeDisabled();

		await dialog.getByRole("button", { name: /try again/i }).click();
		await expect(choose).toBeEnabled();
		await expect(dialog.getByRole("alert")).toBeHidden();
	});
});
