import { type Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import mappings from "./fixtures-data/mappings.json";
import hostLms from "./fixtures-data/host-lms.json";

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
	// The route fetches these for the new-mapping form. Unmocked it 404s and the page is
	// replaced by GlobalError about two seconds in, so these three tests passed only by
	// finishing first.
	LoadHostLmsCodes: hostLms,
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

// "All" on /bibs is 20 million rows: about 20,000 offset pages with a COUNT(*) each
test("an export larger than the limit is refused after one request, and says why", async ({
	page,
}) => {
	const huge = {
		referenceValueMappings: {
			...mappings.referenceValueMappings,
			totalSize: 20_000_000,
		},
	};
	let requests = 0;
	await mockGraphQL(page, {
		...MOCKS,
		LoadMappings: () => {
			requests++;
			return huge;
		},
	});
	await page.reload();
	await expect(page.getByText("loanable-item")).toBeVisible();
	const before = requests;

	await page.getByRole("button", { name: /export/i }).click();
	await page.getByRole("menuitem", { name: "All (whole dataset)" }).click();

	await expect(
		page.getByText(
			"This export would have 20,000,000 rows, more than the 300,000 an export can hold.",
			{ exact: false },
		),
	).toBeVisible();
	expect(requests - before).toBe(1);
});
