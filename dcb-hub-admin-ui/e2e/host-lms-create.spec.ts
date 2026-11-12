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

		// The client class menu stays mounted, aria-hidden, while it grows out: scanned
		// then, axe composites its options against the page and reports their contrast
		await expect(page.locator(".MuiMenu-root")).toHaveCount(0);
		await scanForViolations(page);
	});

	test("a Host LMS created here is offered by New Library without a reload", async ({
		page,
	}) => {
		let created = false;
		const FOLIO_CLASS =
			"org.olf.dcb.core.interaction.folio.ConsortialFolioHostLmsClient";
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
			LoadHostLmsSelection: () => ({
				hostLms: created
					? {
							totalSize: 1,
							content: [
								{
									id: "host-lms-1",
									code: "FOLIO1",
									name: "Folio one",
									lmsClientClass: FOLIO_CLASS,
								},
							],
						}
					: { totalSize: 0, content: [] },
			}),
			CreateHostLms: () => {
				created = true;
				return {
					createHostLms: {
						hostLms: { id: "host-lms-1", code: "FOLIO1" },
						pingStatus: "OK",
					},
				};
			},
		});
		await page.goto("/libraries/new/connection?ils=folio");
		await expect(main(page).getByLabel(/host lms code/i)).toBeVisible();

		// In-app, so the query cache New Library filled is the one the create must refresh
		await page.evaluate(() => {
			history.pushState({}, "", "/hostlmss/new");
			dispatchEvent(new PopStateEvent("popstate"));
		});
		await fillFolio(page);
		await submit(page);
		await expect(
			main(page).getByRole("button", { name: "Go to the Host LMS" }),
		).toBeVisible();

		await page.goBack();
		await expect(
			main(page).getByRole("radio", { name: /folio one \(FOLIO1\)/i }),
		).toBeVisible();
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

	test("says a failed create went wrong, not what the exchange was", async ({
		page,
	}) => {
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
		});
		// A 500 with no errors array: graphql-request's message is then the whole exchange
		await page.route("**/graphql", (route) =>
			route.request().postDataJSON()?.operationName === "CreateHostLms"
				? route.fulfill({ status: 500, json: { message: "boom" } })
				: route.fallback(),
		);
		await page.goto("/hostlmss/new");
		await fillFolio(page);
		await submit(page);

		await expect(
			main(page)
				.getByRole("alert")
				.filter({ hasText: "Something went wrong. Please try again." }),
		).toBeVisible();
		await expect(main(page)).not.toContainText("GraphQL Error");
	});
});
