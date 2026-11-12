import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";
import {
	patronRequestDetailMocks,
	TRACKED_REQUEST,
} from "./fixtures/patron-request-detail";

// The request page polls the request itself. Its history and its cluster's harvested
// records are fetched when their tabs open, and the history a page at a time.

type Sent = { operation: string; query: string; variables: any };

const AUDITS = {
	audits: {
		totalSize: 60,
		content: [
			{
				id: "a1",
				auditDate: "2026-11-01T10:00:00Z",
				briefDescription: "Request placed at the supplier",
				fromStatus: "RESOLVED",
				toStatus: "REQUEST_PLACED_AT_SUPPLYING_AGENCY",
			},
		],
	},
};

const MEMBERS = {
	patronRequests: {
		content: [
			{
				id: TRACKED_REQUEST.id,
				clusterRecord: {
					id: "cluster-1",
					members: [
						{
							id: "bib-1",
							sourceRecordId: "src-123",
							sourceSystemId: "system-1",
							sourceRecord: {
								id: "sr-1",
								hostLmsId: "h1",
								remoteId: "r-1",
								lastFetched: null,
								lastProcessed: null,
								processingState: "PROCESSED",
								processingInformation: null,
								sourceRecordData: { leader: "00000nam" },
							},
						},
					],
				},
			},
		],
	},
};

test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await seedAuth(page);
});

const open = async (
	page: import("@playwright/test").Page,
	tab?: "audit" | "bib",
) => {
	const sent: Sent[] = [];
	await mockGraphQL(page, {
		LoadConsortium: consortiumBasics,
		LoadConsortiumHeader: consortiumBasics,
		LoadHostLms: { hostLms: { totalSize: 0, content: [] } },
		LoadLibraryDirectory: libraries,
		...patronRequestDetailMocks,
		LoadPatronRequestAudits: AUDITS,
		LoadPatronRequestClusterMembers: MEMBERS,
	});
	// After mockGraphQL, so it sees each request first and passes it on
	await page.route("**/graphql", async (route) => {
		const body = route.request().postDataJSON();
		sent.push({
			operation: body?.operationName,
			query: body?.query ?? "",
			variables: body?.variables,
		});
		await route.fallback();
	});
	await page.goto(
		`/patronRequests/${TRACKED_REQUEST.id}${tab ? `?tab=${tab}` : ""}`,
	);
	return sent;
};

test("the request it polls carries no history and no harvested records", async ({
	page,
}) => {
	const sent = await open(page);
	await expect(page.locator("#page-title")).toBeVisible();

	const request = sent.find((s) => s.operation === "LoadPatronRequest");
	expect(request?.query).not.toContain("auditData");
	expect(request?.query).not.toContain("sourceRecordData");
	expect(sent.map((s) => s.operation)).not.toContain("LoadPatronRequestAudits");
	expect(sent.map((s) => s.operation)).not.toContain(
		"LoadPatronRequestClusterMembers",
	);
});

test("the History tab asks for one page of this request's history", async ({
	page,
}) => {
	const sent = await open(page, "audit");

	await expect(page.getByText("Request placed at the supplier")).toBeVisible();
	const audits = sent.filter((s) => s.operation === "LoadPatronRequestAudits");
	expect(audits[0].variables).toMatchObject({
		pageno: 0,
		pagesize: 25,
		order: "auditDate",
		orderBy: "DESC",
	});
	expect(audits[0].variables.query).toContain(
		`patronRequest:"${TRACKED_REQUEST.id}"`,
	);

	await page.getByRole("button", { name: /next page/i }).click();
	await expect
		.poll(
			() =>
				sent.filter((s) => s.operation === "LoadPatronRequestAudits").at(-1)
					?.variables.pageno,
		)
		.toBe(1);
});

test("the Bib tab fetches the cluster's harvested records when it opens", async ({
	page,
}) => {
	const sent = await open(page, "bib");

	await expect(page.getByText("src-123")).toBeVisible();
	await page.getByRole("button", { name: "Source record" }).click();
	await expect(page.getByText('"leader": "00000nam"')).toBeVisible();
	expect(
		sent.filter((s) => s.operation === "LoadPatronRequestClusterMembers"),
	).toHaveLength(1);
});
