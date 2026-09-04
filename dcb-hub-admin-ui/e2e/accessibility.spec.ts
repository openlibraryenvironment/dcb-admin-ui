import { test, expect, type Page } from "@playwright/test";

import { expectPaintedScheme, scanForViolations } from "./fixtures/axe";
import { seedAuth } from "./fixtures/auth";
import { seedTheme } from "./fixtures/theme";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import {
	legacyConsortiumMocks,
	useLegacyService,
} from "./fixtures/legacy-service-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import consortium from "./fixtures-data/consortium.json";
import libraries from "./fixtures-data/libraries.json";
import libraryCount from "./fixtures-data/library-count.json";
import libraryDetail from "./fixtures-data/library-detail.json";
import libraryUsers from "./fixtures-data/library-users.json";
import libraryUserProvisioning from "./fixtures-data/library-user-provisioning.json";

/**
 * The application-wide accessibility gate — W-1.
 *
 * <h2>Why this file exists</h2>
 *
 * WCAG 2.2 AA is the floor on every frontend surface, enforced by a failing gate and never
 * asserted in prose. dcb-admin-ui had `insights-accessibility.spec.ts`, which covers one
 * dashboard, and nothing at all for the rest of the application - so the floor was a claim
 * rather than a check on every page a user actually spends their day in.
 *
 * <h2>Three colour schemes, not two</h2>
 *
 * Light and dark come from `prefers-color-scheme`, which `useThemeStore` seeds from. HIGH
 * CONTRAST HAS NO MEDIA QUERY BEHIND IT - it is a stored preference - so emulating a colour
 * scheme cannot reach it and it would go permanently unmeasured. `seedTheme` plants the
 * preference before the app boots, which is the only way in.
 *
 * <h2>What it does not prove</h2>
 *
 * Automated rules catch roughly a third of WCAG failures. Keyboard completeness, focus
 * order, announcement and whether the words make sense are below, in
 * `setup-accessibility.spec.ts`, and beyond that still need a human.
 */

const MOCKS = {
	LoadConsortiumHeader: consortiumBasics,
	LoadConsortium: consortium,
	LoadLibraries: libraries,
	LoadLibraryCount: libraryCount,
	LoadLibraryContacts: libraryDetail,
	LoadLibraryUsers: libraryUsers,
	LibraryUserProvisioningAvailable: libraryUserProvisioning,
};

/**
 * The routes a user cannot avoid. Each names something on the page that only appears once
 * the route's own data has arrived, so the scan never runs against a skeleton - a gate that
 * measures a spinner passes for the wrong reason.
 */
const ROUTES: { path: string; ready: (page: Page) => Promise<void> }[] = [
	{
		path: "/",
		ready: async (page) => {
			await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		},
	},
	{
		path: "/libraries",
		ready: async (page) => {
			await expect(page.getByText("Alpha Test Library")).toBeVisible();
		},
	},
	{
		path: "/consortium",
		ready: async (page) => {
			await expect(page.getByRole("tab", { name: /profile/i })).toBeVisible();
		},
	},
	{
		path: "/settings",
		ready: async (page) => {
			// Named, because /settings now has three radio groups - theme, mode and
			// typeface. An unnamed getByRole is a strict-mode violation the moment a
			// second one appears, and this one only has to prove the panel has painted.
			await expect(
				page.getByRole("radiogroup", { name: /typeface/i }),
			).toBeVisible();
		},
	},
	{
		path: "/profile",
		ready: async (page) => {
			await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
		},
	},
	{
		// The accounts grid: a status chip and two text actions per row, in every scheme.
		// Chips and dense row actions are where contrast and target size fail, so this
		// route earns its place rather than being taken as covered by library pages that
		// have neither.
		path: "/libraries/c23df3ab-77c0-5689-b56d-fc8a2d6a5f22/accounts",
		ready: async (page) => {
			await expect(page.getByText("ada@alpha.example")).toBeVisible();
		},
	},
];

for (const scheme of ["light", "dark"] as const) {
	test.describe(`WCAG 2.2 AA - ${scheme} mode`, () => {
		test.use({ colorScheme: scheme });

		test.beforeEach(async ({ page }) => {
			// The widest surface the application can render: every backend-gated
			// feature on. A route behind a flag that is off is a route this gate would
			// silently stop measuring. The narrower legacy surface has its own scan at
			// the foot of this file.
			await useAllFeatures(page);
			await seedAuth(page);
			await mockGraphQL(page, MOCKS);
		});

		for (const route of ROUTES) {
			test(`${route.path} has no violations`, async ({ page }) => {
				await page.goto(route.path);
				await route.ready(page);

				// Guards the gate itself: without this a "passing" dark run could just
				// be a second light run.
				await expectPaintedScheme(page, scheme);

				await scanForViolations(page);
			});
		}
	});
}

test.describe("WCAG 2.2 AA - high contrast", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
		await seedAuth(page);
		// The only way to reach this mode: it is a stored choice, not an OS one.
		await seedTheme(page, { mode: "highContrast" });
		await mockGraphQL(page, MOCKS);
	});

	for (const route of ROUTES) {
		test(`${route.path} has no violations`, async ({ page }) => {
			await page.goto(route.path);
			await route.ready(page);
			await scanForViolations(page);
		});
	}
});

/**
 * The same floor on the narrower surface — R-19.
 *
 * DCB Admin also runs against dcb-service 8.71.0, where the branding tab, the setup
 * wizard's discovery chapter, Insights, NCIP onboarding and the accounts grid are all
 * absent. That is not the same page with something hidden: removing a tab changes the
 * tab list's roving focus order, and removing a wizard chapter renumbers the rail and
 * the announced total. Both are exactly the kind of change a diff does not show and a
 * scan does.
 */
test.describe("WCAG 2.2 AA - dcb-service 8.71.0", () => {
	// Every route above that a legacy deployment still has. /accounts is gone, and its
	// absence is asserted in legacy-service.spec.ts rather than scanned here.
	const LEGACY_ROUTES = ROUTES.filter(
		(route) => !route.path.includes("/accounts"),
	);

	for (const scheme of ["light", "dark"] as const) {
		test.describe(scheme, () => {
			test.use({ colorScheme: scheme });

			test.beforeEach(async ({ page }) => {
				await useLegacyService(page);
				await seedAuth(page);
				await mockGraphQL(page, { ...MOCKS, ...legacyConsortiumMocks });
			});

			for (const route of LEGACY_ROUTES) {
				test(`${route.path} has no violations`, async ({ page }) => {
					await page.goto(route.path);
					await route.ready(page);
					await expectPaintedScheme(page, scheme);
					await scanForViolations(page);
				});
			}

			test("the setup rail has no violations with a chapter removed", async ({
				page,
			}) => {
				// The renumbered rail, which is the surface this world actually changes.
				await page.goto("/setup/consortium");
				await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
				await scanForViolations(page);
			});
		});
	}
});
