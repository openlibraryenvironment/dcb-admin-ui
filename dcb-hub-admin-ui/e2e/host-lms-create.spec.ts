import { Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { useAllFeatures } from "./fixtures/flags";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { scanForViolations } from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";

const HARVEST_QUESTION = "Should DCB harvest records from this system?";
const SHARED_QUESTION =
	"Does more than one participating library use this system?";

const main = (page: Page) => page.getByRole("main");

const fillFolio = async (page: Page) => {
	await main(page)
		.getByRole("combobox", { name: /^library/i })
		.click();
	await page.getByRole("option", { name: "Alpha Test Library" }).click();
	await main(page)
		.getByRole("textbox", { name: /host lms code/i })
		.fill("FOLIO1");
	await main(page).getByRole("combobox", { name: "Client class" }).click();
	await page.getByRole("option", { name: "FOLIO" }).click();

	// By role: a secret field's "Show" toggle carries the field's name in its own label
	const configField = (name: RegExp) =>
		main(page).getByRole("textbox", { name });
	await configField(/^base url/i).fill("https://edge.example.org");
	await configField(/^api key/i).fill("test-key");
	await configField(/default agency code/i).fill("alpha");
	await configField(/record syntax/i).fill("MARC21");
	await configField(/metadata prefix/i).fill("marc21_withholdings");
};

const submit = (page: Page) =>
	main(page).getByRole("button", { name: "Create Host LMS" }).click();

test.describe("New Host LMS", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		// The shared-system question is offered only with the 9.0.0 flag on
		await useAllFeatures(page);
	});

	test("asks yes or no, and an unanswered harvest question reads yes", async ({
		page,
	}) => {
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
		});
		await page.goto("/hostlmss/new");
		await main(page).getByRole("combobox", { name: "Client class" }).click();
		await page.getByRole("option", { name: "FOLIO" }).click();

		const harvest = main(page).getByRole("radiogroup", {
			name: HARVEST_QUESTION,
		});
		await expect(harvest.getByRole("radio", { name: "Yes" })).toBeChecked();
		await expect(harvest).toHaveAccessibleDescription(
			"DCB harvests bibliographic records from a system unless told not to.",
		);

		const shared = main(page).getByRole("radiogroup", {
			name: SHARED_QUESTION,
		});
		await expect(shared.getByRole("radio", { name: "No" })).toBeChecked();

		await scanForViolations(page);
	});

	test("sends a harvest answered no", async ({ page }) => {
		let sent: any;
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
			CreateHostLms: (variables: any) => {
				sent = variables.input;
				return {
					createHostLms: {
						hostLms: { id: "host-lms-1", code: "FOLIO1" },
						pingStatus: "OK",
					},
				};
			},
		});
		await page.goto("/hostlmss/new");
		await fillFolio(page);

		await main(page)
			.getByRole("radiogroup", { name: HARVEST_QUESTION })
			.getByRole("radio", { name: "No" })
			.check();
		await submit(page);

		await expect.poll(() => sent?.clientConfig?.ingest).toBe(false);
	});
});
