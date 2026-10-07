import { test, expect, type Page } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import mappings from "./fixtures-data/mappings.json";

/**
 * The mappings export, as a librarian uses it: download the file and read it.
 *
 * Asserted on the DOWNLOADED BYTES rather than the menu, because the contract this
 * keeps is what dcb-service's parser reads. The three live reports it covers, and
 * the four faults behind them: docs/mappings-export.md.
 */

const MOCKS = {
	LoadConsortiumHeader: consortiumBasics,
	LoadMappings: mappings,
};

const readDownload = async (page: Page, open: () => Promise<void>) => {
	const pending = page.waitForEvent("download");
	await open();
	const file = await pending;
	const stream = await file.createReadStream();
	const chunks: Buffer[] = [];
	for await (const chunk of stream) chunks.push(Buffer.from(chunk));
	return {
		name: file.suggestedFilename(),
		text: Buffer.concat(chunks).toString("utf8"),
	};
};

// dcb-service DCBConfigurationService.getExpectedHeaders, for "Reference value
// mappings". It compares each header with equalsIgnoreCase and throws on the first
// mismatch, so this order and these names are the whole contract.
const EXPECTED_HEADER = [
	"fromContext",
	"fromCategory",
	"fromValue",
	"toContext",
	"toCategory",
	"toValue",
];

// useAllFeatures is named like a hook, so react-hooks/rules-of-hooks rejects a
// call from a named non-component helper. Playwright's own callbacks are fine.
test.beforeEach(async ({ page }) => {
	await seedAuth(page);
	await useAllFeatures(page);
	await mockGraphQL(page, MOCKS);
	await page.goto("/mappings/allReferenceValue");
	await expect(page.getByText("loanable-item")).toBeVisible();
});

test.describe("a mappings export can be imported again", () => {
	test("the TSV header is the one dcb-service validates", async ({ page }) => {
		const { name, text } = await readDownload(page, async () => {
			await page.getByRole("button", { name: /export/i }).click();
			await page
				.getByRole("menuitem", { name: "Current page", exact: true })
				.click();
		});

		expect(name).toMatch(/\.tsv$/);
		expect(text.split("\n")[0].trim().split("\t")).toEqual(EXPECTED_HEADER);
	});

	test("a CSV is offered, and carries the same contract", async ({ page }) => {
		const { name, text } = await readDownload(page, async () => {
			await page.getByRole("button", { name: /export/i }).click();
			// The format is a visible choice now. Picking it must not close the menu,
			// so the scope item below is clicked in the same opening.
			await page
				.getByRole("menuitem", { name: /^CSV \(comma separated\)$/ })
				.click();
			await page
				.getByRole("menuitem", { name: "Current page", exact: true })
				.click();
		});

		expect(name).toMatch(/\.csv$/);
		expect(text.split("\n")[0].trim().split(",")).toEqual(EXPECTED_HEADER);
	});

	test("no row carries a column the importer refuses to read", async ({
		page,
	}) => {
		const { text } = await readDownload(page, async () => {
			await page.getByRole("button", { name: /export/i }).click();
			await page
				.getByRole("menuitem", { name: "Current page", exact: true })
				.click();
		});

		const lines = text.trim().split("\n");
		// Six columns on the header AND on every row: the importer reads line[0]
		// through line[5] and refuses a blank in any of them.
		for (const [index, line] of lines.entries()) {
			expect(line.trim().split("\t"), `line ${index + 1}`).toHaveLength(6);
		}
		// "Last imported" sat at index 5, exactly where toValue has to be.
		expect(text).not.toContain("2026-09-30");
	});
});
