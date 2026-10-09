import { test, expect, type Locator, type Page } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { TRACKED_REQUEST } from "./fixtures/patron-request-detail";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import mappings from "./fixtures-data/mappings.json";
import libraryDetail from "./fixtures-data/library-detail.json";
import libraryUsers from "./fixtures-data/library-users.json";
import patronRequests from "./fixtures-data/patron-requests.json";

/**
 * A query whose data is not what the route is for must not be able to close the route.
 *
 * Each case mocks the route's PRIMARY operations only and leaves one auxiliary operation
 * to 404 against a preview with no API behind it. docs/query-error-policy.md.
 */

const empty = { totalSize: 0, content: [] };

interface DegradedCase {
	name: string;
	path: string;
	mocks: Record<string, unknown>;
	/** Left unmocked on purpose. */
	auxiliary: string;
	content: (page: Page) => Locator;
}

const CASES: DegradedCase[] = [
	{
		name: "the consortium-wide mappings grid survives its context dropdown",
		path: "/mappings/allReferenceValue",
		mocks: {
			LoadConsortiumHeader: consortiumBasics,
			LoadMappings: mappings,
		},
		auxiliary: "LoadHostLmsCodes",
		content: (page) => page.getByText("loanable-item"),
	},
	{
		name: "a patron request survives its pickup location lookup",
		path: `/patronRequests/${TRACKED_REQUEST.id}`,
		mocks: {
			LoadConsortiumHeader: consortiumBasics,
			LoadPatronRequest: {
				patronRequests: { totalSize: 1, content: [TRACKED_REQUEST] },
			},
			GetAuditsByPatronRequest: { audits: empty },
			LoadHostLms: { hostLms: empty },
			LoadPatronIdentities: { patronIdentities: empty },
			LoadLibraryBasics: { libraries: empty },
			LoadAgency: { agencies: empty },
		},
		auxiliary: "LoadLocation",
		content: (page) => page.getByRole("button", { name: "Actions" }),
	},
	{
		// Was LoadHostLms, which this page no longer fetches: the directory replaced the
		// code -> hostLms -> agency walk. The directory is the non-critical query now.
		name: "a patron request survives its library directory lookup",
		path: `/patronRequests/${TRACKED_REQUEST.id}`,
		mocks: {
			LoadConsortiumHeader: consortiumBasics,
			LoadPatronRequest: {
				patronRequests: { totalSize: 1, content: [TRACKED_REQUEST] },
			},
			GetAuditsByPatronRequest: { audits: empty },
			LoadLocation: { locations: empty },
			LoadPatronIdentities: { patronIdentities: empty },
			LoadLibraryBasics: { libraries: empty },
			LoadAgency: { agencies: empty },
		},
		auxiliary: "LoadLibraryDirectory",
		content: (page) => page.getByRole("button", { name: "Actions" }),
	},
	{
		name: "the accounts grid survives its provisioning capability probe",
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/accounts",
		mocks: {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibrary: libraryDetail,
			LoadLibraryContacts: libraryDetail,
			LoadLibraryUsers: libraryUsers,
			LoadPatronRequests: patronRequests,
		},
		auxiliary: "LibraryUserProvisioningAvailable",
		// NOT the user grid: the probe is what enables it, so a failed probe correctly
		// falls to the "not configured" state this page already has for a deployment
		// with no identity provider. The route rendering ITSELF is the assertion.
		content: (page) => page.getByText(/Account provisioning is not configured/),
	},
];

/**
 * Counts attempts per operation by OBSERVING requests rather than intercepting them.
 * mockGraphQL registers one handler over the endpoint and handlers over the same pattern
 * chain in reverse registration order, so a second page.route here would take the
 * fixture's place rather than sit beside it.
 */
const countOperations = (page: Page) => {
	const attempts = new Map<string, number>();
	page.on("request", (request) => {
		if (request.method() !== "POST" || !request.url().includes("/graphql"))
			return;
		const operationName = (
			request.postDataJSON() as { operationName?: string } | null
		)?.operationName;
		if (operationName)
			attempts.set(operationName, (attempts.get(operationName) ?? 0) + 1);
	});
	return attempts;
};

for (const testCase of CASES) {
	test(testCase.name, async ({ page }) => {
		const attempts = countOperations(page);
		await seedAuth(page);
		await useAllFeatures(page);
		await mockGraphQL(page, testCase.mocks);
		await page.goto(testCase.path);

		await expect(testCase.content(page)).toBeVisible();

		// `retry: 1` on the query client, so two attempts is the operation having given
		// up. Waiting on that rather than on a duration: the crash this guards against
		// lands when the LAST attempt fails, and a fixed wait is both a banned
		// page.waitForTimeout and a race on a loaded machine.
		await expect
			.poll(() => attempts.get(testCase.auxiliary) ?? 0, { timeout: 15_000 })
			.toBeGreaterThanOrEqual(2);

		await expect(testCase.content(page)).toBeVisible();
		// The crash this guards against is total, so say so: GlobalError replaces the
		// whole route, and a case whose own marker happens to survive would not catch it.
		await expect(page.getByText("500 Server error")).toHaveCount(0);
	});
}
