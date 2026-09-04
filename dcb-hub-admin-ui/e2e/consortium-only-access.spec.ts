import { expect, test } from "@playwright/test";

import { ADMIN_ROLES, READ_ONLY_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";

/**
 * DCB Admin is a consortium-level tool, and this is the gate that says so.
 *
 * The bar itself is UX - dcb-service's AdminUiAccessPolicy refuses the token, and the
 * per-fetcher role checks refuse the data. What this proves is that a barred account meets
 * one clear page rather than a wall of failed queries, and that it meets that page on the
 * COLD load path, which is where the previous generation of this guard silently did
 * nothing.
 */

const LIBRARY_ADMIN_ROLES = ["LIBRARY_ADMIN"];

test.describe("Consortium-only access", () => {
	for (const [name, roles] of [
		["a library administrator", LIBRARY_ADMIN_ROLES],
		["a read-only library user", READ_ONLY_ROLES],
	] as const) {
		test(`${name} is sent to the unauthorised page, not the application`, async ({
			page,
		}) => {
			await seedAuth(page, { roles: [...roles] });
			await mockGraphQL(page, {});

			// A pasted URL, which is the cold path: react-oidc-context restores the
			// session asynchronously, so anything reading auth in beforeLoad sees
			// isAuthenticated false and takes its "not signed in yet" branch. A guard
			// that lives only there passes silently, which is why this asserts on
			// rendered content rather than on the URL.
			await page.goto("/libraries");

			// This test is about the BAR, not the wording: the account is refused the
			// application and lands on the refusal page. Which of the two messages that
			// page shows is asserted separately below - a library-only account gets the
			// "wrong application" one, which is why matching on "unauthorised" here would
			// fail for the very users this test is about.
			await expect(page).toHaveURL(/\/unauthorised$/);

			// The page must not have rendered underneath the redirect. A grid appearing
			// for one frame is a data leak with a short lifetime, not an aesthetic
			// problem.
			await expect(page.getByRole("grid")).toHaveCount(0);
		});
	}

	test("a consortium administrator is not barred", async ({ page }) => {
		// The half that fails loudly if the predicate is inverted or over-tightened.
		// A bar with no counter-case passes just as happily when it bars everybody.
		await seedAuth(page, { roles: ADMIN_ROLES });
		await mockGraphQL(page, {});

		await page.goto("/libraries");

		await expect(
			page.getByRole("heading", { name: /unauthorised|not authorised/i }),
		).toHaveCount(0);
	});

	test("somebody holding a library role as well as a consortium one is not barred", async ({
		page,
	}) => {
		// Consortium staff are people at libraries and their tokens say so. Reading the
		// rule as "holds a library role, therefore barred" would lock out exactly the
		// administrators this application exists for.
		await seedAuth(page, { roles: ["LIBRARY_ADMIN", "CONSORTIUM_ADMIN"] });
		await mockGraphQL(page, {});

		await page.goto("/libraries");

		await expect(
			page.getByRole("heading", { name: /unauthorised|not authorised/i }),
		).toHaveCount(0);
	});

	test("tells a library account it is in the wrong application", async ({
		page,
	}) => {
		// Not "you do not have access, contact your administrator". They DO have access -
		// to the other application - and their administrator has nothing to fix.
		await seedAuth(page, { roles: ["LIBRARY_ADMIN"] });
		await mockGraphQL(page, {});

		await page.goto("/libraries");

		await expect(
			page.getByRole("heading", { name: /wrong application/i }),
		).toBeVisible();
		await expect(
			page.getByText(/dcb admin for libraries/i).first(),
		).toBeVisible();

		// The generic refusal must NOT also be on screen - two explanations is worse
		// than one, and they contradict each other.
		await expect(page.getByText(/contact your system administrator/i)).toHaveCount(
			0,
		);
	});

	test("says the same to a read-only library account", async ({ page }) => {
		await seedAuth(page, { roles: READ_ONLY_ROLES });
		await mockGraphQL(page, {});

		await page.goto("/libraries");

		await expect(
			page.getByRole("heading", { name: /wrong application/i }),
		).toBeVisible();
	});

	test("never says it to somebody who holds a consortium role as well", async ({
		page,
	}) => {
		// The case worth protecting. Consortium staff are often administrators of their
		// own library too and carry both roles on one token; that is a supported
		// arrangement, and they are not barred from here at all. Landing on /unauthorised
		// deliberately - the page is reachable directly - must not tell them to leave.
		await seedAuth(page, { roles: ["LIBRARY_ADMIN", "CONSORTIUM_ADMIN"] });
		await mockGraphQL(page, {});

		await page.goto("/unauthorised");

		await expect(
			page.getByRole("heading", { name: /wrong application/i }),
		).toHaveCount(0);
		await expect(
			page.getByRole("heading", { name: /unauthorised/i }),
		).toBeVisible();
	});
});
