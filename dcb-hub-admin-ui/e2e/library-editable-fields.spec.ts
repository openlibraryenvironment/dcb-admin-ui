import { test, expect, type Page } from "@playwright/test";

import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraryDetail from "./fixtures-data/library-detail.json";

/**
 * Every field `UpdateLibraryInput` accepts and this application intends to edit is
 * reachable from a page.
 *
 * Seven of them were not. `updateLibrary` has carried `address`, `type`,
 * `targetLoanToBorrowRatio`, `principalLabel`, `secretLabel`, `patronWebsite` and
 * `discoverySystem` since 8.71.0, and each rendered as read-only text - the wizard set
 * them once at creation and nothing could change them afterwards. That is invisible in a
 * diff and invisible on the page: a value that is simply never offered for editing looks
 * exactly like a value nobody has needed to edit.
 *
 * Asserted by ROLE and accessible name, so it is an accessibility check for free: an
 * input the axe gate would pass but a screen-reader user could not identify fails here.
 */
const LIBRARY_ID = "c23df3ab-77c0-5689-b56d-fc8a2d6a5f22";

const EMPTY_MAPPINGS = {
	referenceValueMappings: { totalSize: 0, content: [] },
};

const MOCKS = {
	LoadConsortiumHeader: consortiumBasics,
	LoadLibrary: libraryDetail,
	LoadLibraryServiceInfo: libraryDetail,
	// The profile page mounts the library's mappings grid. Unmocked it falls through
	// mockGraphQL to route.continue(), 404s against a preview with no API behind it,
	// and the global handler turns that into the 500 route - which reads as the page
	// being broken rather than the fixture being short of an operation.
	LoadMappings: EMPTY_MAPPINGS,
	LoadLocations: { locations: { totalSize: 0, content: [] } },
};

/**
 * The variables of every UpdateLibrary this page sends.
 *
 * Registered through the same one-handler-dispatches-by-operationName mechanism as
 * mockGraphQL rather than a second page.route: two handlers over `**\/graphql` chain in
 * reverse registration order, and a fallback from the outer one reaches a `route.continue`
 * that has no server behind it.
 */
const captureUpdateLibrary = async (page: Page) => {
	const seen: { input?: Record<string, unknown> }[] = [];

	await mockGraphQL(page, {
		...MOCKS,
		UpdateLibrary: (variables: any) => {
			seen.push(variables);
			return { updateLibrary: libraryDetail.libraries.content[0] };
		},
	});

	return seen;
};

const startEditing = async (page: Page) => {
	await page.getByRole("button", { name: "Actions" }).click();
	await page.getByRole("menuitem", { name: "Edit" }).click();
	await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
};

test.beforeEach(async ({ page }) => {
	await seedAuth(page, { roles: ADMIN_ROLES });
});

test.describe("Library profile - editable fields", () => {
	const PROFILE_FIELDS = [
		"Type",
		"Address",
		"Target loan to borrow ratio",
		"Principal label",
		"Secret label",
	];

	for (const name of PROFILE_FIELDS) {
		test(`${name} is editable`, async ({ page }) => {
			await mockGraphQL(page, MOCKS);
			await page.goto(`/libraries/${LIBRARY_ID}`);
			await expect(
				page.getByRole("heading", { name: "Alpha Test Library" }),
			).toBeVisible();

			await startEditing(page);

			await expect(page.getByRole("textbox", { name })).toBeEditable();
		});
	}

	test("saving sends the changed field to updateLibrary", async ({ page }) => {
		const requests = await captureUpdateLibrary(page);

		await page.goto(`/libraries/${LIBRARY_ID}`);
		await expect(
			page.getByRole("heading", { name: "Alpha Test Library" }),
		).toBeVisible();
		await startEditing(page);

		await page
			.getByRole("textbox", { name: "Principal label" })
			.fill("Library card number");
		await page.getByRole("button", { name: "Save" }).click();

		// The audit prompt stands between the form and the mutation, as it does for
		// every other edit in this application. Scoped to the dialog and awaited open
		// first: MUI remounts the field during the enter transition, so filling the
		// moment the locator resolves races the transition and the element detaches.
		const audit = page.getByRole("dialog");
		await expect(audit).toBeVisible();
		// Exactly one row: the field actually touched. An empty-but-null column used to
		// appear here as "-" to "-" and be sent with every save.
		await expect(audit.getByRole("row")).toHaveCount(2);
		await expect(audit.getByRole("textbox", { name: /reason/i })).toBeEnabled();
		await audit
			.getByRole("textbox", { name: /reason/i })
			.fill("Patron wording");
		await audit.getByRole("button", { name: "Save changes" }).click();

		await expect.poll(() => requests.length).toBeGreaterThan(0);
		expect(requests[0].input).toMatchObject({
			id: LIBRARY_ID,
			principalLabel: "Library card number",
		});
	});
});

test.describe("Library service - editable fields", () => {
	for (const name of ["Discovery system/PAC(s)", "Patron website"]) {
		test(`${name} is editable`, async ({ page }) => {
			await mockGraphQL(page, MOCKS);
			await page.goto(`/libraries/${LIBRARY_ID}/service`);
			await expect(
				page.getByRole("heading", { name: "Alpha Test Library" }),
			).toBeVisible();

			await startEditing(page);

			await expect(page.getByRole("textbox", { name })).toBeEditable();
		});
	}
});

test.describe("a background refetch while editing", () => {
	test("does not overwrite what the user is typing", async ({ page }) => {
		// The form is fed through react-hook-form's `values` prop, which re-syncs it when
		// that object CHANGES - so a poll that lands mid-edit and brings back a record
		// somebody else has moved replaces the half-typed field. hostlmss/$hostlmsId
		// guarded against exactly this and said so; this page and its service tab did not.
		let loads = 0;

		await mockGraphQL(page, {
			...MOCKS,
			LoadLibrary: () => {
				loads += 1;
				if (loads === 1) return libraryDetail;

				// An identical payload would prove nothing: `values` compares, and a
				// no-op refetch leaves the form alone. The record has to have moved.
				const moved = JSON.parse(JSON.stringify(libraryDetail));
				moved.libraries.content[0].principalLabel = "Changed by somebody else";
				return moved;
			},
		});

		// A fake clock, because the interval is two minutes. Installed before goto so the
		// app's timers are created against it.
		await page.clock.install();
		await page.goto(`/libraries/${LIBRARY_ID}`);
		await expect(
			page.getByRole("heading", { name: "Alpha Test Library" }),
		).toBeVisible();

		await startEditing(page);
		const field = page.getByRole("textbox", { name: "Principal label" });
		await field.fill("Library card number");

		await page.clock.fastForward("03:00");

		await expect(field).toHaveValue("Library card number");
		// The poll itself is what must not happen, so assert that too: a pause that only
		// discarded the answer would still cost the request.
		expect(loads).toBe(1);
	});
});
