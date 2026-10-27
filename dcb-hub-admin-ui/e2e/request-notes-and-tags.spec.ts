import { type Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";

import { seedAuth } from "./fixtures/auth";
import { useAllFeatures, useAllFeaturesExcept } from "./fixtures/flags";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import {
	expectPaintedScheme,
	scanForViolations,
	waitForDialogToSettle,
} from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";
import {
	patronRequestDetailMocks,
	TRACKED_REQUEST,
} from "./fixtures/patron-request-detail";

interface Note {
	id: string;
	authorKind: string;
	agencyCode: string | null;
	libraryName: string | null;
	body: string;
	dateCreated: string;
	retracted: boolean;
	retractedBy: string | null;
}

interface AppliedTag {
	code: string;
	label: string;
	agencyCodes: string[];
	consortium: boolean;
}

interface Sent {
	operationName: string;
	variables: Record<string, unknown>;
}

const libraryNote = (index: number): Note => ({
	id: `note-${index}`,
	authorKind: "LIBRARY",
	agencyCode: "AG1",
	libraryName: "Riverside Library",
	body: `Library note ${index}`,
	dateCreated: new Date(Date.UTC(2026, 9, 1, 9, index)).toISOString(),
	retracted: false,
	retractedBy: null,
});

/**
 * A stand-in for dcb-service's notes and tags on one request: it applies what it is sent,
 * newest note first and fifty a page, as dcb-service does. Every write is recorded.
 */
async function mockRequestService(
	page: Page,
	sent: Sent[],
	{
		notes = [libraryNote(1)],
		placedByStaff = true as boolean | null,
		notesFail = false,
	}: {
		notes?: Note[];
		placedByStaff?: boolean | null;
		notesFail?: boolean;
	} = {},
) {
	const tags: AppliedTag[] = [
		{
			code: "DAMAGED",
			label: "Damaged",
			agencyCodes: ["AG1"],
			consortium: false,
		},
	];
	const notePage = (pageno: number, pagesize: number) => ({
		totalSize: notes.length,
		content: notes.slice(pageno * pagesize, (pageno + 1) * pagesize),
	});
	const record =
		(operationName: string) => (variables: Record<string, unknown>) => {
			sent.push({ operationName, variables });
			return variables;
		};

	await mockGraphQL(page, {
		LoadConsortium: consortiumBasics,
		LoadConsortiumHeader: consortiumBasics,
		LoadHostLms: { hostLms: { totalSize: 0, content: [] } },
		LoadLibraryDirectory: libraries,
		...patronRequestDetailMocks,
		LoadPatronRequest: {
			patronRequests: {
				totalSize: 1,
				content: [{ ...TRACKED_REQUEST, placedByStaff }],
			},
		},
		LoadRequestTags: {
			requestTags: [
				{ code: "DAMAGED", label: "Damaged", description: null, active: true },
				{
					code: "CONTACTED",
					label: "Patron contacted",
					description: null,
					active: true,
				},
				{ code: "OLD", label: "Retired tag", description: null, active: false },
			],
		},
		LoadPatronRequestTags: () => ({
			patronRequests: { content: [{ id: TRACKED_REQUEST.id, tags }] },
		}),
		// Left out, it 404s against the preview, which has no API behind it
		...(notesFail
			? {}
			: {
					LoadPatronRequestNotes: (variables: {
						pageno: number;
						pagesize: number;
					}) => ({
						patronRequests: {
							content: [
								{
									id: TRACKED_REQUEST.id,
									notes: notePage(variables.pageno, variables.pagesize),
								},
							],
						},
					}),
				}),
		AddPatronRequestNote: (variables: { body: string }) => {
			record("AddPatronRequestNote")(variables);
			const note: Note = {
				id: `note-new-${notes.length}`,
				authorKind: "CONSORTIUM",
				agencyCode: null,
				libraryName: null,
				body: variables.body,
				dateCreated: new Date().toISOString(),
				retracted: false,
				retractedBy: null,
			};
			notes.unshift(note);
			return { addPatronRequestNote: { id: note.id } };
		},
		RetractPatronRequestNote: (variables: { id: string }) => {
			record("RetractPatronRequestNote")(variables);
			const note = notes.find((each) => each.id === variables.id)!;
			Object.assign(note, { retracted: true, retractedBy: "CONSORTIUM" });
			return { retractPatronRequestNote: { id: note.id, retracted: true } };
		},
		TagPatronRequest: (variables: { tagCode: string }) => {
			record("TagPatronRequest")(variables);
			const existing = tags.find((each) => each.code === variables.tagCode);
			if (existing) existing.consortium = true;
			else
				tags.push({
					code: variables.tagCode,
					label: "Patron contacted",
					agencyCodes: [],
					consortium: true,
				});
			return { tagPatronRequest: tags.map(({ code }) => ({ code })) };
		},
		UntagPatronRequest: (variables: { tagCode: string }) => {
			record("UntagPatronRequest")(variables);
			const tag = tags.find((each) => each.code === variables.tagCode)!;
			tag.consortium = false;
			if (tag.agencyCodes.length === 0) tags.splice(tags.indexOf(tag), 1);
			return { untagPatronRequest: tags.map(({ code }) => ({ code })) };
		},
	});
}

const openRequest = (page: Page) =>
	page.goto(`/patronRequests/${TRACKED_REQUEST.id}`);

test.beforeEach(async ({ page }) => {
	await seedAuth(page);
});

test.describe("Notes on a patron request", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
	});

	test("a note is added as the consortium's, then retracted", async ({
		page,
	}) => {
		const sent: Sent[] = [];
		await mockRequestService(page, sent);
		await openRequest(page);

		await page.getByRole("tab", { name: "Notes" }).click();
		await expect(page.getByRole("status")).toHaveText(
			"1 note on this request.",
		);
		await expect(page.getByText("Library note 1")).toBeVisible();

		await page
			.getByRole("textbox", { name: "Note" })
			.fill("  Patron asked for the large print copy.  ");
		await page.getByRole("button", { name: "Add note" }).click();

		await expect(page.getByRole("status")).toHaveText("Note added.");
		expect(sent.at(-1)).toEqual({
			operationName: "AddPatronRequestNote",
			// No agencyCode: dcb-service writes consortium staff notes as the consortium's
			variables: {
				patronRequestId: TRACKED_REQUEST.id,
				body: "Patron asked for the large print copy.",
			},
		});
		await expect(page.getByRole("textbox", { name: "Note" })).toHaveValue("");
		await expect(
			page.getByText("Patron asked for the large print copy."),
		).toBeVisible();

		await page
			.getByRole("button", { name: /^Retract the note by The consortium/ })
			.click();
		const dialog = page.getByRole("dialog", { name: "Retract this note?" });
		await dialog.getByRole("button", { name: "Retract" }).click();

		await expect(dialog).toHaveCount(0);
		await expect(page.getByRole("status")).toHaveText("Note retracted.");
		expect(sent.at(-1)?.operationName).toBe("RetractPatronRequestNote");
		await expect(page.getByText("Retracted by the consortium")).toBeVisible();
		await expect(
			page.getByRole("button", { name: /^Retract the note by The consortium/ }),
		).toHaveCount(0);
	});

	test("an empty note is named before anything is sent", async ({ page }) => {
		const sent: Sent[] = [];
		await mockRequestService(page, sent);
		await openRequest(page);

		await page.getByRole("tab", { name: "Notes" }).click();
		const body = page.getByRole("textbox", { name: "Note" });
		await body.fill("   ");
		await page.getByRole("button", { name: "Add note" }).click();

		await expect(body).toHaveAttribute("aria-invalid", "true");
		await expect(body).toHaveAccessibleDescription("Enter the Note.");
		expect(sent).toEqual([]);
	});

	test("notes that cannot be loaded say so, and leave the page standing", async ({
		page,
	}) => {
		await mockRequestService(page, [], { notesFail: true });
		await openRequest(page);

		await page.getByRole("tab", { name: "Notes" }).click();

		await expect(
			page.getByRole("tabpanel", { name: "Notes" }).getByRole("alert"),
		).toBeVisible();
		await expect(page.getByText("500 Server error")).toHaveCount(0);
		await expect(page.getByRole("button", { name: "Actions" })).toBeVisible();
	});

	test("older notes are fetched a page at a time", async ({ page }) => {
		const sent: Sent[] = [];
		const notes = Array.from({ length: 51 }, (_, index) =>
			libraryNote(51 - index),
		);
		const pages: number[] = [];
		page.on("request", (request) => {
			const body = request.postDataJSON?.();
			if (body?.operationName === "LoadPatronRequestNotes")
				pages.push(body.variables.pageno);
		});
		await mockRequestService(page, sent, { notes });
		await openRequest(page);

		await page.getByRole("tab", { name: "Notes" }).click();
		await expect(page.getByRole("status")).toHaveText(
			"51 notes on this request.",
		);
		await expect(
			page.getByText("Library note 2", { exact: true }),
		).toBeVisible();
		await expect(page.getByText("Library note 1", { exact: true })).toHaveCount(
			0,
		);

		await page.getByRole("button", { name: "Show older notes" }).click();

		await expect(
			page.getByText("Library note 1", { exact: true }),
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Show older notes" }),
		).toHaveCount(0);
		expect(pages).toEqual([0, 1]);
	});

	for (const scheme of ["light", "dark"] as const) {
		test.describe(scheme, () => {
			test.use({ colorScheme: scheme });

			test("the notes tab and the retract dialog have no violations", async ({
				page,
			}) => {
				const sent: Sent[] = [];
				const retracted = {
					...libraryNote(2),
					retracted: true,
					retractedBy: "LIBRARY",
				};
				await mockRequestService(page, sent, {
					notes: [retracted, libraryNote(1)],
				});
				await openRequest(page);

				await page.getByRole("tab", { name: "Notes" }).click();
				await expect(
					page.getByText("Retracted by the library that wrote it"),
				).toBeVisible();
				await expectPaintedScheme(page, scheme);
				await scanForViolations(page);

				await page
					.getByRole("button", {
						name: /^Retract the note by Riverside Library/,
					})
					.click();
				await waitForDialogToSettle(page);
				await scanForViolations(page);
			});
		});
	}
});

test.describe("Tags on a patron request", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
	});

	test("the consortium adds a tag and removes only its own", async ({
		page,
	}) => {
		const sent: Sent[] = [];
		await mockRequestService(page, sent);
		await openRequest(page);

		await expect(page.getByRole("heading", { name: "Tags" })).toBeVisible();
		await expect(page.getByText("Applied by AG1")).toBeVisible();
		// A library's application is that library's to remove
		await expect(
			page.getByRole("button", { name: "Remove the consortium's tag Damaged" }),
		).toHaveCount(0);

		await page.getByRole("combobox", { name: "Tag" }).click();
		await expect(page.getByRole("option", { name: "Retired tag" })).toHaveCount(
			0,
		);
		await page.getByRole("option", { name: "Patron contacted" }).click();
		await page.getByRole("button", { name: "Add tag" }).click();

		await expect(page.getByRole("status")).toHaveText(
			"Tag Patron contacted added.",
		);
		expect(sent.at(-1)).toEqual({
			operationName: "TagPatronRequest",
			variables: { patronRequestId: TRACKED_REQUEST.id, tagCode: "CONTACTED" },
		});
		await expect(page.getByText("Applied by the consortium")).toBeVisible();

		await page
			.getByRole("button", {
				name: "Remove the consortium's tag Patron contacted",
			})
			.click();

		await expect(page.getByRole("status")).toHaveText(
			"Tag Patron contacted removed.",
		);
		expect(sent.at(-1)).toEqual({
			operationName: "UntagPatronRequest",
			variables: { patronRequestId: TRACKED_REQUEST.id, tagCode: "CONTACTED" },
		});
		await expect(page.getByText("Applied by the consortium")).toHaveCount(0);
	});

	for (const scheme of ["light", "dark"] as const) {
		test.describe(scheme, () => {
			test.use({ colorScheme: scheme });

			test("the tags on the General tab have no violations", async ({
				page,
			}) => {
				await mockRequestService(page, []);
				await openRequest(page);

				await expect(page.getByText("Applied by AG1")).toBeVisible();
				await expectPaintedScheme(page, scheme);
				await scanForViolations(page);
			});
		});
	}
});

test.describe("Who placed a request", () => {
	for (const [placedByStaff, shown] of [
		[true, "Staff"],
		[false, "The patron"],
		[null, "Not known"],
	] as const) {
		test(`placedByStaff ${placedByStaff} reads "${shown}"`, async ({
			page,
		}) => {
			await useAllFeatures(page);
			await mockRequestService(page, [], { placedByStaff });
			await openRequest(page);

			await expect(page.getByText("Placed by", { exact: true })).toBeVisible();
			await expect(page.getByText(shown, { exact: true })).toBeVisible();
		});
	}
});

test.describe("A deployment older than dcb-service 9.2.0", () => {
	test("asks for none of it and shows none of it", async ({ page }) => {
		await useAllFeaturesExcept(page, [
			"VITE_FEATURE_REQUEST_NOTES",
			"VITE_FEATURE_REQUEST_TAGS",
			"VITE_FEATURE_PLACED_BY_STAFF",
		]);
		const documents: string[] = [];
		page.on("request", (request) => {
			const body = request.postDataJSON?.();
			if (body?.query) documents.push(body.operationName);
			if (body?.operationName === "LoadPatronRequest")
				documents.push(body.query);
		});
		await mockRequestService(page, []);
		await openRequest(page);

		await expect(page.getByRole("tab", { name: "General" })).toBeVisible();
		await expect(page.getByRole("tab", { name: "Notes" })).toHaveCount(0);
		await expect(page.getByRole("heading", { name: "Tags" })).toHaveCount(0);
		await expect(page.getByText("Placed by", { exact: true })).toHaveCount(0);
		const loaded = documents.find((each) =>
			each.includes("LoadPatronRequest("),
		);
		expect(loaded).toBeDefined();
		expect(loaded).not.toContain("placedByStaff");
		expect(documents).not.toContain("LoadPatronRequestTags");
		expect(documents).not.toContain("LoadRequestTags");
	});
});
