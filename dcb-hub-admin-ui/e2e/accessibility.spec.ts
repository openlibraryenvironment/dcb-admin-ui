import { test, expect, type Page } from "@playwright/test";

import {
	expectPaintedScheme,
	scanForLandmarks,
	scanForViolations,
} from "./fixtures/axe";
import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { seedTheme } from "./fixtures/theme";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import {
	legacyConsortiumMocks,
	useLegacyService,
} from "./fixtures/legacy-service-mocks";
import { mockLatestReleases } from "./fixtures/service-status-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import consortium from "./fixtures-data/consortium.json";
import libraries from "./fixtures-data/libraries.json";
import libraryCount from "./fixtures-data/library-count.json";
import libraryDetail from "./fixtures-data/library-detail.json";
import libraryUsers from "./fixtures-data/library-users.json";
import libraryUserProvisioning from "./fixtures-data/library-user-provisioning.json";
import hostLms from "./fixtures-data/host-lms.json";

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
	LoadLibrary: libraryDetail,
	LoadHostLms: hostLms,
};

/**
 * The routes a user cannot avoid. Each names something on the page that only appears once
 * the route's own data has arrived, so the scan never runs against a skeleton - a gate that
 * measures a spinner passes for the wrong reason.
 */
const ROUTES: {
	path: string;
	/** Route-specific mocks, registered before navigation. */
	setup?: (page: Page) => Promise<void>;
	ready: (page: Page) => Promise<void>;
}[] = [
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
		// Service Status: the environment and version grids. GitHub is mocked so the
		// Latest version column is painted, not left at "Checking…".
		path: "/serviceInfo/serviceStatus",
		setup: mockLatestReleases,
		ready: async (page) => {
			await expect(
				page.getByRole("row").filter({ hasText: "dcb-admin-ui" }),
			).toContainText("Up to date");
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
				await route.setup?.(page);
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

/**
 * The consortium form in EDIT mode, on both tabs, in both schemes.
 *
 * The route table above scans `/consortium` as it first renders, which is read mode: a
 * column of headings and their values, and not a single input. Every control on this page
 * is therefore behind a click the gate never made, and a form is precisely where accessible
 * names, error association and focus order fail.
 *
 * It was not a hypothetical gap. Six controls across these two tabs had neither `label` nor
 * `aria-labelledby` — the visible heading sat above each input without being tied to it —
 * so a screen-reader user met a row of boxes announced as "edit text". Nothing else would
 * have caught it: it type-checks, it lints, and it looks entirely normal.
 *
 * Readiness is the Save button rather than a named field, deliberately. A field could not
 * be located by name while the defect existed, which is the shape of the problem: a gate
 * that has to name a control to wait for it cannot be written before the control has a
 * name.
 */
const EDITABLE_SECTIONS = [
	{ path: "/consortium", label: "profile" },
	{ path: "/consortium/branding", label: "branding" },
] as const;

for (const scheme of ["light", "dark"] as const) {
	for (const section of EDITABLE_SECTIONS) {
		test.describe(`WCAG 2.2 AA - consortium ${section.label} form, ${scheme}`, () => {
			test.use({ colorScheme: scheme });

			test("editing has no violations", async ({ page }) => {
				await useAllFeatures(page);
				await seedAuth(page, { roles: ADMIN_ROLES });
				await mockGraphQL(page, MOCKS);

				await page.goto(section.path);
				await page.getByRole("button", { name: "Actions" }).click();
				await page.getByRole("menuitem", { name: "Edit" }).click();
				await expect(page.getByRole("button", { name: "Save" })).toBeVisible();

				await expectPaintedScheme(page, scheme);
				await scanForViolations(page);
			});
		});
	}
}

/**
 * The surfaces that only exist once an administrator presses Edit, and the one form that
 * is a route of its own.
 *
 * They are scanned separately from the route table because none of them is reachable by
 * navigation alone: the Host LMS client config is a generated set of grouped inputs, the
 * library brand is a select plus two text fields, and `/hostlmss/new` is an autocomplete
 * over every library. Grouped inputs, selects and autocompletes are where label
 * association and contrast fail, and none of them was covered by any existing route.
 */
const HOST_LMS_ID = "h1h1h1h1-1111-5111-9111-111111111111";
const LIBRARY_ID = "c23df3ab-77c0-5689-b56d-fc8a2d6a5f22";

const ADMIN_EDIT_SURFACES = [
	{
		label: "Host LMS client configuration",
		path: `/hostlmss/${HOST_LMS_ID}`,
		open: async (page: Page) => {
			await page.getByRole("button", { name: "Actions" }).click();
			await page.getByRole("menuitem", { name: "Edit" }).click();
			await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
			// The config lives on the second tab, which is the half with the generated
			// inputs - scanning the general tab would miss every one of them.
			await page.getByRole("tab", { name: /client config/i }).click();
			await expect(page.getByLabel(/base url/i)).toBeVisible();
		},
	},
	{
		label: "library branding",
		path: `/libraries/${LIBRARY_ID}/branding`,
		open: async (page: Page) => {
			await page.getByRole("button", { name: "Actions" }).click();
			await page.getByRole("menuitem", { name: "Edit" }).click();
			await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
		},
	},
	{
		label: "new Host LMS",
		path: "/hostlmss/new",
		open: async (page: Page) => {
			await expect(page.getByLabel(/^library/i)).toBeVisible();
		},
	},
] as const;

for (const scheme of ["light", "dark"] as const) {
	for (const surface of ADMIN_EDIT_SURFACES) {
		test.describe(`WCAG 2.2 AA - ${surface.label}, ${scheme}`, () => {
			test.use({ colorScheme: scheme });

			test("has no violations", async ({ page }) => {
				await useAllFeatures(page);
				await seedAuth(page, { roles: ADMIN_ROLES });
				await mockGraphQL(page, MOCKS);

				await page.goto(surface.path);
				await surface.open(page);

				await expectPaintedScheme(page, scheme);
				await scanForViolations(page);
			});
		});
	}
}

/**
 * The version grid with dcb-service's detail panel open. The route table scans the grid as
 * it first renders; the panel's attributes and release links do not exist until a row is
 * expanded.
 */
for (const scheme of ["light", "dark"] as const) {
	test.describe(`WCAG 2.2 AA - service status detail panel, ${scheme}`, () => {
		test.use({ colorScheme: scheme });

		test("the expanded version row has no violations", async ({ page }) => {
			await useAllFeatures(page);
			await seedAuth(page);
			await mockGraphQL(page, MOCKS);
			await mockLatestReleases(page);

			await page.goto("/serviceInfo/serviceStatus");
			const service = page.getByRole("row").filter({ hasText: "dcb-service" });
			await expect(service).toContainText("v9.0.0");
			await service.getByRole("button", { name: "Expand details" }).click();
			await expect(page.getByText("Closest release tag")).toBeVisible();
			// The click leaves the pointer on the toggle, whose tooltip then fades in. Scanned
			// mid-fade it fails colour-contrast on blended colours; fully shown it is 10.1:1.
			await page.mouse.move(0, 0);
			await expect(page.getByRole("tooltip")).toBeHidden();

			await expectPaintedScheme(page, scheme);
			await scanForViolations(page);
		});
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
			await route.setup?.(page);
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
					await route.setup?.(page);
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

/**
 * Landmarks and the skip link - WCAG 2.4.1, Level A.
 *
 * A separate block because it needs a different RULE SET, not a softer one: axe tags
 * `landmark-one-main` and `region` as `best-practice`, so the A+AA scans above cannot
 * report them however many routes they walk. Run once, not once per colour scheme -
 * document structure does not vary with the palette. See docs/accessibility.md.
 */
test.describe("WCAG 2.4.1 - landmarks and the skip link", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
		await seedAuth(page);
		await mockGraphQL(page, MOCKS);
	});

	for (const route of ROUTES) {
		test(`${route.path} is fully landmarked`, async ({ page }) => {
			await route.setup?.(page);
			await page.goto(route.path);
			await route.ready(page);
			await scanForLandmarks(page);
		});
	}

	// The half axe cannot check. `landmark-one-main` proves a main exists; it says nothing
	// about whether a keyboard user can REACH it, which is the entire point of 2.4.1.
	test("the skip link is the first tab stop and moves focus into main", async ({
		page,
	}) => {
		await page.goto("/libraries");
		await expect(page.getByText("Alpha Test Library")).toBeVisible();

		// Tab from the top of the document, the way a user arriving from the address bar
		// does. NOT via a click: clicking sets the sequential focus navigation starting
		// point to whatever is under the pointer, and at the top-left of this layout that
		// is the fixed header - so the first Tab would land on the header's second button
		// and the test would fail for a reason that has nothing to do with the skip link.
		await page.evaluate(() =>
			(document.activeElement as HTMLElement | null)?.blur(),
		);
		await page.keyboard.press("Tab");

		const skipLink = page.getByRole("link", { name: "Skip to main content" });
		await expect(skipLink).toBeFocused();
		// Hidden until focused, visible once it is — a skip link nobody can see while
		// tabbing is one sighted keyboard users never learn exists.
		await expect(skipLink).toBeInViewport();

		await page.keyboard.press("Enter");

		// tabIndex={-1} on <main> is what makes this true. Without it the viewport moves
		// and focus does not, so the next Tab goes straight back into the sidebar.
		await expect(page.locator("main#main-content")).toBeFocused();
	});
});
