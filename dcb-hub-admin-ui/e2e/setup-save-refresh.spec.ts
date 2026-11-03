import type { Page, Route } from "@playwright/test";

import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import consortium from "./fixtures-data/consortium.json";
import libraryCount from "./fixtures-data/library-count.json";

/**
 * A setup chapter that saves and moves on must not arrive on the next chapter before
 * the consortium it just wrote has been read back. The refetch is held for REFETCH_MS
 * so that a chapter which navigates without waiting for it is caught every time.
 */
const REFETCH_MS = 1500;

const record = consortium.consortia.content[0];
const withRecord = (overrides: Record<string, unknown>) => ({
	consortia: {
		...consortium.consortia,
		content: [{ ...record, ...overrides }],
	},
});
const noConsortium = { consortia: { ...consortium.consortia, content: [] } };

/**
 * Answers LoadConsortium from `current()`, slowly once `slow()` says so. Registered after
 * mockGraphQL, so it is matched first and falls back for everything else.
 */
async function serveConsortium(
	page: Page,
	current: () => unknown,
	slow: () => boolean,
) {
	await page.route("**/graphql", async (route: Route) => {
		if (route.request().postDataJSON()?.operationName !== "LoadConsortium") {
			await route.fallback();
			return;
		}
		const data = current();
		if (slow()) await new Promise((resolve) => setTimeout(resolve, REFETCH_MS));
		await route.fulfill({ json: { data } });
	});
}

/** Records whether `text` is ever rendered, however briefly. */
async function watchFor(page: Page, text: string) {
	await page.addInitScript((needle) => {
		(window as any).__seen = false;
		new MutationObserver(() => {
			if (document.body?.innerText.includes(needle))
				(window as any).__seen = true;
		}).observe(document, {
			subtree: true,
			childList: true,
			characterData: true,
		});
	}, text);
}

const railStatus = (page: Page, chapter: string) =>
	page
		.getByRole("navigation", { name: "Setup progress" })
		.locator(".MuiStep-root")
		.filter({ hasText: chapter });

test.describe("Setup - a saved chapter is read back before moving on", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
		await seedAuth(page);
	});

	test("creating the consortium never shows the next chapter as needing one", async ({
		page,
	}) => {
		let created = false;
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraryCount: libraryCount,
			LoadGroupsSelection: { libraryGroups: { totalSize: 0, content: [] } },
			CreateLibraryGroup: { createLibraryGroup: { id: "g-1" } },
			CreateConsortium: () => {
				created = true;
				return { createConsortium: { id: record.id } };
			},
		});
		await serveConsortium(
			page,
			() => (created ? consortium : noConsortium),
			() => created,
		);
		await watchFor(page, "This step needs your consortium to exist first");

		await page.goto("/setup/consortium");
		await page.getByRole("textbox", { name: /consortium name/i }).fill("e2e");
		await page.getByRole("textbox", { name: /display name/i }).fill("E2E");
		await page.getByRole("textbox", { name: /group name/i }).fill("E2E group");
		await page.getByRole("textbox", { name: /group code/i }).fill("E2E");
		await page.getByRole("button", { name: /save and continue/i }).click();

		await expect(page).toHaveURL(/\/setup\/howItWorks/);
		await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
		expect(await page.evaluate(() => (window as any).__seen)).toBe(false);
	});

	test("adding a contact shows Contacts as done on arrival at the next chapter", async ({
		page,
	}) => {
		let saved = false;
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraryCount: libraryCount,
			CreateConsortiumContact: () => {
				saved = true;
				return { createConsortiumContact: { id: "c-2" } };
			},
		});
		await serveConsortium(
			page,
			() => withRecord({ contacts: saved ? record.contacts : [] }),
			() => saved,
		);

		await page.goto("/setup/contacts");
		await expect(railStatus(page, "Contacts")).toContainText(/not started/i);
		await page.getByRole("textbox", { name: /first name/i }).fill("Ada");
		await page.getByRole("textbox", { name: /last name/i }).fill("Lovelace");
		await page
			.getByRole("textbox", { name: /email/i })
			.fill("ada@example.invalid");
		await page.getByRole("combobox", { name: /role/i }).click();
		await page.getByRole("option").first().click();
		await page.getByRole("button", { name: /save and continue/i }).click();

		await expect(page).toHaveURL(/\/setup\/discovery/);
		// Read once, at arrival. A retrying assertion would wait for the late refetch
		// and pass whether or not the chapter waited for it.
		expect(await railStatus(page, "Contacts").innerText()).toMatch(/done/i);
	});
});
