import { Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { scanForViolations } from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";
import libraryDetail from "./fixtures-data/library-detail.json";

// Adding a library is a conversation at /libraries/new/$step: which system, how DCB
// reaches it, then the library. Every answer is in the URL or on the server, so each test
// opens the question it is about by its link.

const SIERRA_CLIENT_CLASS =
	"org.olf.dcb.core.interaction.sierra.SierraLmsClient";
const LIBRARY_ID = libraryDetail.libraries.content[0].id;

const noHostLms = { hostLms: { totalSize: 0, content: [] } };
const oneSierra = {
	hostLms: {
		totalSize: 1,
		content: [
			{
				id: "3",
				code: "SIERRA1",
				name: "Sierra one",
				lmsClientClass: SIERRA_CLIENT_CLASS,
			},
		],
	},
};

// A Sierra create is followed by an update that stores its ingest source class, which
// createHostLms leaves blank before dcb-service 9.2.0
const created = {
	createHostLms: {
		hostLms: { id: "host-lms-1", code: "testcode" },
		pingStatus: "OK",
	},
};
const updated = {
	updateHostLms: {
		hostLms: { id: "host-lms-1", code: "testcode" },
		pingStatus: "OK",
		warnings: [],
	},
};

const main = (page: Page) => page.getByRole("main");

const heading = (page: Page, name: RegExp) =>
	main(page).getByRole("heading", { level: 1, name });

const fillSierraHostLms = async (page: Page) => {
	const chapter = main(page);
	await chapter.getByLabel(/host lms code/i).fill("testcode");
	await chapter.getByLabel(/host lms name/i).fill("Test LMS");
	// By role: a secret field's "Show" toggle carries the field's name in its own label
	const configField = (name: RegExp) => chapter.getByRole("textbox", { name });
	await configField(/base url/i).fill("https://sierra.example.org");
	await configField(/sierra api key/i).fill("test-key");
	await configField(/sierra api secret/i).fill("test-secret");
	await configField(/default agency code/i).fill("TESTAGENCY");
	await configField(/page size/i).fill("100");
};

const saveAndTest = (page: Page) =>
	main(page)
		.getByRole("button", { name: /save and test the connection/i })
		.click();

test.describe("New library", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
	});

	test("starts by asking which system the library uses", async ({ page }) => {
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
		});
		await page.goto("/libraries");
		await page.getByRole("button", { name: /actions/i }).click();
		await page.getByRole("menuitem", { name: /create a new library/i }).click();

		await expect(page).toHaveURL(/\/libraries\/new\/system$/);
		await expect(
			heading(page, /which system does this library use/i),
		).toBeVisible();

		await main(page).getByRole("radio", { name: "Sierra" }).check();
		await main(page).getByRole("button", { name: "Continue" }).click();

		await expect(page).toHaveURL(/\/libraries\/new\/connection\?ils=sierra$/);
	});

	test("says why it cannot go on when no system was chosen", async ({
		page,
	}) => {
		await mockGraphQL(page, { LoadConsortiumHeader: consortiumBasics });
		await page.goto("/libraries/new/system");

		await main(page).getByRole("button", { name: "Continue" }).click();

		const systems = main(page).getByRole("radiogroup");
		await expect(systems).toHaveAttribute("aria-invalid", "true");
		await expect(systems).toHaveAccessibleDescription(
			"Choose the system this library uses.",
		);
		await expect(main(page).getByRole("radio").first()).toBeFocused();
	});

	test("a link to a later question without its answers starts at the first", async ({
		page,
	}) => {
		await mockGraphQL(page, { LoadConsortiumHeader: consortiumBasics });
		await page.goto("/libraries/new/profile");

		await expect(page).toHaveURL(/\/libraries\/new\/system/);
	});

	test("offers a system DCB already reaches before asking for a new one", async ({
		page,
	}) => {
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadHostLmsSelection: oneSierra,
		});
		await page.goto("/libraries/new/connection?ils=sierra");

		await expect(
			main(page).getByRole("radio", { name: /sierra one \(SIERRA1\)/i }),
		).toBeChecked();
		await main(page).getByRole("button", { name: "Continue" }).click();

		await expect(page).toHaveURL(
			/\/libraries\/new\/profile\?ils=sierra&hostLms=SIERRA1$/,
		);
	});

	test("blocks the connection with empty required fields, and says which", async ({
		page,
	}) => {
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadHostLmsSelection: noHostLms,
		});
		await page.goto("/libraries/new/connection?ils=sierra");

		await saveAndTest(page);

		const code = main(page).getByLabel(/host lms code/i);
		await expect(code).toHaveAttribute("aria-invalid", "true");
		await expect(
			main(page).getByText("Enter the Host LMS code."),
		).toBeVisible();
		await expect(code).toBeFocused();
	});

	test("stores a Sierra's ingest source class, and saves a correction before moving on", async ({
		page,
	}) => {
		const sent: { operation: string; input: any }[] = [];
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadHostLmsSelection: noHostLms,
			CreateHostLms: (variables: any) => {
				sent.push({ operation: "create", input: variables.input });
				return created;
			},
			UpdateHostLms: (variables: any) => {
				sent.push({ operation: "update", input: variables.input });
				return updated;
			},
		});
		await page.goto("/libraries/new/connection?ils=sierra");
		await fillSierraHostLms(page);
		await saveAndTest(page);

		await expect(
			main(page).getByRole("heading", { name: "Verification" }),
		).toBeVisible();
		expect(sent.map((call) => call.operation)).toEqual(["create", "update"]);
		expect(sent[1].input).toEqual({
			id: "host-lms-1",
			ingestSourceClass: SIERRA_CLIENT_CLASS,
			changeCategory: "New Host LMS",
		});
		// Created, so the code that names it can no longer change
		await expect(main(page).getByLabel(/host lms code/i)).toBeDisabled();

		await main(page)
			.getByRole("textbox", { name: /base url/i })
			.fill("https://sierra2.example.org");
		await main(page).getByRole("button", { name: "Continue" }).click();
		await expect.poll(() => sent.length).toBe(3);
		expect(sent[2].input).toMatchObject({
			id: "host-lms-1",
			clientConfig: { "base-url": "https://sierra2.example.org" },
		});
		expect(sent[2].input).not.toHaveProperty("ingestSourceClass");

		// Nothing changed since, so nothing is written and the library is asked about next
		await main(page).getByRole("button", { name: "Continue" }).click();
		await expect(page).toHaveURL(/\/libraries\/new\/profile\?/);
		expect(sent).toHaveLength(3);
	});

	test("shows the configuration and authentication checks the server ran", async ({
		page,
	}) => {
		// Selected only behind VITE_FEATURE_HOST_LMS_PROBES
		await useAllFeatures(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadHostLmsSelection: noHostLms,
			UpdateHostLms: updated,
			CreateHostLms: {
				createHostLms: {
					...created.createHostLms,
					pingStatus: "Status: OK",
					ingestStatus: "Success: Retrieved chunk with 3 records.",
					configurationStatus: "Missing: item.fine-code-id",
					authProfileStatus: "Not checked: no agency uses this Host LMS yet",
					warnings: [],
				},
			},
		});
		await page.goto("/libraries/new/connection?ils=sierra");
		await fillSierraHostLms(page);
		await saveAndTest(page);

		await expect(
			main(page).getByText("Missing: item.fine-code-id"),
		).toBeVisible();
		await expect(
			main(page).getByText("Not checked: no agency uses this Host LMS yet"),
		).toBeVisible();
	});

	test("offers the new Host LMS's default agency on the library question", async ({
		page,
	}) => {
		let selections = 0;
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			// Empty until the create, then holding it, as the server would answer
			LoadHostLmsSelection: () =>
				selections++ === 0
					? noHostLms
					: {
							hostLms: {
								totalSize: 1,
								content: [
									{
										id: "host-lms-1",
										code: "testcode",
										name: "Test LMS",
										lmsClientClass: SIERRA_CLIENT_CLASS,
									},
								],
							},
						},
			CreateHostLms: created,
			UpdateHostLms: updated,
		});
		await page.goto("/libraries/new/connection?ils=sierra");
		await fillSierraHostLms(page);
		await saveAndTest(page);
		await expect(
			main(page).getByRole("heading", { name: "Verification" }),
		).toBeVisible();
		await main(page).getByRole("button", { name: "Continue" }).click();

		await expect(page).toHaveURL(/agency=TESTAGENCY/);
		await expect(
			main(page).getByRole("combobox", { name: /agency/i }),
		).toHaveValue("TESTAGENCY");
	});

	test("an OpenRS appliance is sent to the invitation, not a form", async ({
		page,
	}) => {
		await useAllFeatures(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadHostLmsSelection: noHostLms,
		});
		await page.goto("/libraries/new/connection?ils=orsAppliance");

		await expect(
			main(page).getByRole("link", { name: /issue an invitation/i }),
		).toBeVisible();
		expect(
			await main(page)
				.getByLabel(/host lms code/i)
				.count(),
		).toBe(0);

		await main(page)
			.getByRole("button", { name: /enter the details by hand/i })
			.click();
		await expect(main(page).getByLabel(/host lms code/i)).toBeVisible();
	});

	test.describe("the library question", () => {
		test.beforeEach(async ({ page }) => {
			await mockGraphQL(page, {
				LoadConsortiumHeader: consortiumBasics,
				LoadLibraries: libraries,
				LoadHostLmsSelection: oneSierra,
			});
		});

		const openProfile = async (page: Page) => {
			await page.goto("/libraries/new/profile?ils=sierra&hostLms=SIERRA1");
			await expect(heading(page, /tell us about the library/i)).toBeVisible();
		};

		test("leaves the service details to the library's own pages", async ({
			page,
		}) => {
			await openProfile(page);

			// Counted once, not retried: toHaveCount(0) passes as soon as any render lacks it
			for (const label of [
				/support office hours/i,
				/downtime schedule/i,
				/patron website/i,
				/discovery system/i,
			]) {
				expect(await main(page).getByLabel(label).count(), String(label)).toBe(
					0,
				);
			}
		});

		test("asks for the local holds limit with the loan cap", async ({
			page,
		}) => {
			// Behind VITE_FEATURE_LOCAL_HOLDS
			await useAllFeatures(page);
			await openProfile(page);

			await expect(
				main(page).getByRole("textbox", { name: /max local holds/i }),
			).toBeEditable();
		});

		test("fills the short and abbreviated names from the full name", async ({
			page,
		}) => {
			await openProfile(page);
			const chapter = main(page);

			await chapter.getByLabel(/full name/i).fill("Denver Public Library");
			await expect(chapter.getByLabel(/short name/i)).toHaveValue(
				"Denver Public Library",
			);
			await expect(chapter.getByLabel(/abbreviated name/i)).toHaveValue("DPL");

			await chapter.getByLabel(/abbreviated name/i).fill("DENPL");
			await chapter.getByLabel(/full name/i).fill("Denver Public Libraries");
			await expect(chapter.getByLabel(/abbreviated name/i)).toHaveValue(
				"DENPL",
			);
		});

		test("asks before a rail link discards what was typed, and stays when told to", async ({
			page,
		}) => {
			await openProfile(page);
			await main(page)
				.getByLabel(/full name/i)
				.fill("Half Typed");

			await page
				.getByRole("navigation", { name: /setup progress/i })
				.getByRole("link", { name: /system/i })
				.click();
			const confirm = page.getByRole("dialog", {
				name: /leave without saving/i,
			});
			await expect(confirm).toBeVisible();

			await confirm
				.getByRole("button", { name: /stay on this chapter/i })
				.click();
			await expect(confirm).not.toBeVisible();
			await expect(main(page).getByLabel(/full name/i)).toHaveValue(
				"Half Typed",
			);
		});

		test("leaves without asking when nothing was typed", async ({ page }) => {
			await openProfile(page);

			await page
				.getByRole("navigation", { name: /setup progress/i })
				.getByRole("link", { name: /system/i })
				.click();

			await expect(page).toHaveURL(/\/libraries\/new\/system/);
			expect(
				await page
					.getByRole("dialog", { name: /leave without saving/i })
					.count(),
			).toBe(0);
		});

		test("an empty answer moves focus to the first field it needs", async ({
			page,
		}) => {
			await openProfile(page);

			await main(page)
				.getByRole("button", { name: /add the library/i })
				.click();

			await expect(main(page).getByLabel("Full name")).toBeFocused();
		});

		test("passes axe", async ({ page }) => {
			await openProfile(page);
			await scanForViolations(page);
		});
	});

	test("adding the library moves to its own setup, where anyone with the link can finish it", async ({
		page,
	}) => {
		let createdInput: any;
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: libraries,
			LoadHostLmsSelection: oneSierra,
			CreateLibrary: (variables: any) => {
				createdInput = variables.input;
				return { createLibrary: { id: LIBRARY_ID } };
			},
			LoadLibrary: libraryDetail,
			LoadMappings: { referenceValueMappings: { totalSize: 0, content: [] } },
			LoadNumericRangeMappings: {
				numericRangeMappings: { totalSize: 0, content: [] },
			},
			LoadLocations: { locations: { totalSize: 0, content: [] } },
		});
		await page.goto("/libraries/new/profile?ils=sierra&hostLms=SIERRA1");
		const chapter = main(page);
		await chapter.getByLabel("Full name").fill("New Library");
		await chapter.getByLabel("Short name").fill("New");
		await chapter.getByLabel("Abbreviated name").fill("NEW");
		await chapter
			.getByRole("combobox", { name: /associated agency/i })
			.fill("NEWAG");
		await chapter.getByLabel("Address").fill("1 Library Street");
		await chapter.getByRole("combobox", { name: "Type" }).click();
		await page.getByRole("option", { name: "Public" }).click();
		await chapter.getByLabel(/latitude/i).fill("51.5");
		await chapter.getByLabel(/longitude/i).fill("-0.12");
		await chapter
			.getByRole("combobox", { name: /authentication profile/i })
			.click();
		await page.getByRole("option", { name: "Barcode and PIN" }).click();
		await chapter.getByRole("button", { name: /add the library/i }).click();

		await expect(page).toHaveURL(
			new RegExp(`/libraries/${LIBRARY_ID}/setup/contacts$`),
		);
		await expect(heading(page, /who should we contact/i)).toBeVisible();
		// Contacts are asked next, once there is a library to hold them
		expect(createdInput.contacts).toEqual([]);
		expect(createdInput.hostLmsCode).toBe("SIERRA1");

		await main(page)
			.getByRole("button", { name: /continue/i })
			.click();
		await expect(
			main(page).getByRole("textbox", { name: /first name/i }),
		).toBeFocused();
	});
});
