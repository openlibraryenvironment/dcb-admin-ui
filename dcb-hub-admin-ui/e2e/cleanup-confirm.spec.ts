import { type Page, type Route } from "@playwright/test";
import { test, expect } from "./fixtures/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { scanForViolations, waitForDialogToSettle } from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";
import {
	patronRequestDetailMocks,
	TRACKED_REQUEST,
} from "./fixtures/patron-request-detail";

// Clean up finalises a request and deletes its virtual records in member systems, so a
// request's page asks before doing it. The bulk action's own cases are in cleanup.spec.ts.

const mockErroredRequest = (page: Page) =>
	mockGraphQL(page, {
		LoadConsortium: consortiumBasics,
		LoadConsortiumHeader: consortiumBasics,
		LoadHostLms: { hostLms: { totalSize: 0, content: [] } },
		LoadLibraryDirectory: libraries,
		...patronRequestDetailMocks,
		LoadPatronRequest: {
			patronRequests: {
				totalSize: 1,
				content: [{ ...TRACKED_REQUEST, status: "ERROR" }],
			},
		},
	});

/** Every POST the page makes to change the request, in order. */
const recordPosts = async (page: Page) => {
	const posts: string[] = [];
	await page.route("**/patrons/requests/**", async (route: Route) => {
		const request = route.request();
		if (request.method() !== "POST") return route.fallback();
		posts.push(new URL(request.url()).pathname);
		await route.fulfill({ status: 200, json: "ok" });
	});
	return posts;
};

const openCleanup = async (page: Page) => {
	await page.getByRole("button", { name: "Actions" }).click();
	await page.getByRole("menuitem", { name: "Force clean up" }).click();
	return page.getByRole("dialog", { name: "Clean up?" });
};

test.beforeEach(async ({ page }) => {
	await seedAuth(page);
	await useAllFeatures(page);
	await mockErroredRequest(page);
});

test("asks before cleaning up a request, and Cancel sends nothing", async ({
	page,
}) => {
	const posts = await recordPosts(page);
	await page.goto(`/patronRequests/${TRACKED_REQUEST.id}`);
	await expect(page.getByRole("button", { name: "Actions" })).toBeVisible();

	const dialog = await openCleanup(page);
	await expect(dialog).toBeVisible();
	await expect(dialog).toContainText("It cannot be undone");
	await waitForDialogToSettle(page);
	await scanForViolations(page);

	await dialog.getByRole("button", { name: "Cancel" }).click();
	await expect(dialog).toHaveCount(0);
	expect(posts).toEqual([]);

	await (
		await openCleanup(page)
	)
		.getByRole("button", { name: "Clean up", exact: true })
		.click();
	await expect
		.poll(() => posts.filter((path) => path.endsWith("/transition/cleanup")))
		.toHaveLength(1);
});
