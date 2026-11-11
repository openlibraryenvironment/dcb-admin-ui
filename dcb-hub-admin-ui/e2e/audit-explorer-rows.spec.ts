import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";

const REQUEST = "0b0b0000-1111-5111-9111-0b0b0b0b0b0b";

const event = (id: string, briefDescription: string) => ({
	id,
	auditDate: "2026-11-01T10:00:00Z",
	briefDescription,
	fromStatus: "CONFIRMED",
	toStatus: "ERROR",
	auditData: {},
	patronRequest: { id: REQUEST, status: "ERROR" },
});

// Grouping ran client-side over one server page: a request's events split across pages
// with partial counts, and a group row's click went to /patronRequests/audits/undefined
test("each event is its own row, linked to its request, with no grouping to offer", async ({
	page,
}) => {
	await seedAuth(page);
	await useAllFeatures(page);
	await mockGraphQL(page, {
		LoadConsortiumHeader: consortiumBasics,
		LoadAudits: {
			audits: {
				totalSize: 2,
				content: [
					event("e1e10000-1111-5111-9111-e1e1e1e1e1e1", "Read timeout one"),
					event("e2e20000-2222-5222-9222-e2e2e2e2e2e2", "Read timeout two"),
				],
			},
		},
		LoadAuditIncidence: {
			auditIncidence: { interval: "day", totalSize: 2, buckets: [] },
		},
	});

	await page.goto("/serviceInfo/auditExplorer");

	for (const description of ["Read timeout one", "Read timeout two"]) {
		await expect(
			page
				.getByRole("row")
				.filter({ hasText: description })
				.getByRole("link", { name: REQUEST })
				.first(),
		).toBeVisible();
	}
	await expect(
		page.getByRole("checkbox", { name: "Group by patron request" }),
	).toHaveCount(0);
});
