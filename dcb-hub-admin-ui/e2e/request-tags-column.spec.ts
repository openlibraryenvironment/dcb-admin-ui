import { type Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";

import { seedAuth } from "./fixtures/auth";
import { useAllFeatures, useAllFeaturesExcept } from "./fixtures/flags";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { expectPaintedScheme, scanForViolations } from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";
import locations from "./fixtures-data/locations.json";
import patronRequests from "./fixtures-data/patron-requests.json";
import {
	patronRequestDetailMocks,
	TRACKED_REQUEST,
} from "./fixtures/patron-request-detail";

const DAMAGED = {
	code: "DAMAGED",
	label: "Damaged",
	agencyCodes: ["AG1"],
	consortium: false,
};

const rows = patronRequests.patronRequests.content.map(
	(request: { id: string }) =>
		request.id === TRACKED_REQUEST.id
			? { ...request, tags: [DAMAGED] }
			: request,
);

const notes = [1, 2].map((index) => ({
	id: `note-${index}`,
	authorKind: "LIBRARY",
	agencyCode: "AG1",
	libraryName: "Riverside Library",
	body: `Library note ${index}`,
	dateCreated: new Date(Date.UTC(2026, 9, 1, 9, index)).toISOString(),
	retracted: false,
	retractedBy: null,
}));

interface Asked {
	query: string;
	allQuery: string;
}

/** The grid and the request page behind it, with every grid request recorded. */
async function mockGrid(page: Page) {
	const asked: Asked[] = [];
	page.on("request", (request) => {
		const body = request.postDataJSON?.();
		if (body?.operationName === "GetPatronRequestDashboard")
			asked.push({ query: body.query, allQuery: body.variables?.allQuery });
	});
	const page1 = { ...patronRequests.patronRequests, content: rows };
	await mockGraphQL(page, {
		LoadConsortium: consortiumBasics,
		LoadConsortiumHeader: consortiumBasics,
		LoadHostLms: { hostLms: { totalSize: 0, content: [] } },
		LoadLibraries: libraries,
		LoadLibraryDirectory: libraries,
		LoadLocationForPRGrid: locations,
		LoadPatronRequests: { patronRequests: page1 },
		LoadPatronRequestTotals: patronRequests,
		GetPatronRequestDashboard: {
			allRequests: page1,
			activeRequests: { totalSize: 1 },
			exceptionRequests: { totalSize: 1 },
			outOfSequenceRequests: { totalSize: 0 },
			finishedRequests: { totalSize: 0 },
		},
		LoadRequestTags: {
			requestTags: [
				{ code: "DAMAGED", label: "Damaged", description: null, active: true },
			],
		},
		...patronRequestDetailMocks,
		LoadPatronRequestTags: {
			patronRequests: {
				content: [{ id: TRACKED_REQUEST.id, tags: [DAMAGED] }],
			},
		},
		LoadPatronRequestNotes: {
			patronRequests: {
				content: [
					{
						id: TRACKED_REQUEST.id,
						notes: { totalSize: notes.length, content: notes },
					},
				],
			},
		},
	});
	return asked;
}

const lastAsked = async (asked: Asked[]) => {
	await expect.poll(() => asked.length).toBeGreaterThan(0);
	return asked[asked.length - 1];
};

const trackedRow = (page: Page) =>
	page
		.getByRole("row")
		.filter({ hasText: TRACKED_REQUEST.clusterRecord.title });

test.beforeEach(async ({ page }) => {
	await seedAuth(page);
});

test.describe("A request's tags and notes in the patron requests grid", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
	});

	test("its detail panel shows its tags, and links to its notes", async ({
		page,
	}) => {
		await mockGrid(page);
		await page.goto("/patronRequests/all");

		await trackedRow(page)
			.getByRole("button", { name: "Expand details" })
			.click();
		await expect(
			page.getByRole("list", { name: "Tags" }).getByText("Damaged"),
		).toBeVisible();

		await page.getByRole("link", { name: "2 notes" }).click();
		await expect(page).toHaveURL(
			new RegExp(`/patronRequests/${TRACKED_REQUEST.id}[?].*tab=notes`),
		);
		await expect(page.getByRole("tab", { name: "Notes (2)" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
	});

	test("the Tags column shows each row's tags, and filters on the server", async ({
		page,
	}) => {
		const asked = await mockGrid(page);
		await page.goto("/patronRequests/all?show=tagCode&filters=tagCode:DAMAGED");

		expect((await lastAsked(asked)).allQuery).toContain("tagCode:DAMAGED");
		await expect(
			page.getByRole("columnheader", { name: "Tags" }),
		).toBeVisible();
		await expect(trackedRow(page).getByText("Damaged")).toBeVisible();
	});

	test("note text is searched as a phrase", async ({ page }) => {
		const asked = await mockGrid(page);
		await page.goto("/patronRequests/all?filters=noteText:phrase:water damage");

		expect((await lastAsked(asked)).allQuery).toContain(
			'noteText:"water damage"',
		);
	});

	for (const scheme of ["light", "dark"] as const) {
		test.describe(scheme, () => {
			test.use({ colorScheme: scheme });

			test("the Tags column and an open detail panel have no violations", async ({
				page,
			}) => {
				await mockGrid(page);
				await page.goto("/patronRequests/all?show=tagCode");
				await trackedRow(page)
					.getByRole("button", { name: "Expand details" })
					.click();
				await expect(page.getByRole("link", { name: "2 notes" })).toBeVisible();

				await expectPaintedScheme(page, scheme);
				await scanForViolations(page);
			});
		});
	}
});

test("a dcb-service without tag and note search is asked for neither", async ({
	page,
}) => {
	await useAllFeaturesExcept(page, [
		"VITE_FEATURE_REQUEST_TAG_AND_NOTE_SEARCH",
	]);
	const asked = await mockGrid(page);
	await page.goto("/patronRequests/all?show=tagCode&filters=tagCode:DAMAGED");

	const sent = await lastAsked(asked);
	expect(sent.query).not.toMatch(/\btags\s*\{/);
	expect(sent.allQuery ?? "").not.toContain("tagCode");
	await expect(page.getByRole("columnheader", { name: "Tags" })).toHaveCount(0);
});
