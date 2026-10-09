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
import { MOCKS, ROUTES } from "./fixtures/routes";

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
		// Seven fields became editable here, and the seven that already were had no
		// accessible name at all: the visible label is a sibling Typography, so an input
		// without aria-labelledby is unnamed. Never scanned in edit mode before, which is
		// why it went unnoticed.
		label: "library profile",
		path: `/libraries/${LIBRARY_ID}`,
		open: async (page: Page) => {
			await page.getByRole("button", { name: "Actions" }).click();
			await page.getByRole("menuitem", { name: "Edit" }).click();
			await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
			await expect(
				page.getByRole("textbox", { name: "Full name" }),
			).toBeVisible();
		},
	},
	{
		label: "library service",
		path: `/libraries/${LIBRARY_ID}/service`,
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

/**
 * The V-22.6 inheritance panel, which the route table cannot reach: it is a grid of
 * provenance chips and revert buttons on a group's settings tab, and no page this file
 * already visits renders one. Its own spec scans it in one colour scheme; contrast fails
 * in exactly one of the two, so it is scanned here in both.
 */
const GROUP_ID = "99999999-1111-5111-9111-111111111111";

const SYMPOSIA_SURFACES = [
	{
		label: "group functional setting inheritance",
		path: `/groups/${GROUP_ID}/settings`,
		open: async (page: Page) => {
			await expect(
				page.getByRole("heading", { level: 2, name: /functional settings/i }),
			).toBeVisible();
		},
	},
	{
		// V-22.2's select, on the library profile's edit mode. Scanning that page reported
		// seven unlabelled fields until the inputs there were given accessible names; it
		// is only scannable now because they were.
		label: "library shelf classification",
		path: `/libraries/${LIBRARY_ID}`,
		open: async (page: Page) => {
			await page.getByRole("button", { name: "Actions" }).click();
			await page.getByRole("menuitem", { name: "Edit" }).click();
			await expect(
				page.getByRole("combobox", { name: "Shelf classification" }),
			).toBeVisible();
		},
	},
] as const;

for (const scheme of ["light", "dark"] as const) {
	for (const surface of [...ADMIN_EDIT_SURFACES, ...SYMPOSIA_SURFACES]) {
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
	// Routes that do not EXIST on 8.71.0 rather than merely looking different there. The
	// accounts grid needs the provisioning API; announcements need a store this release has
	// no table for, and their route's beforeLoad redirects to /consortium when the flag is
	// off — so scanning them here would assert that a page renders which is deliberately
	// unreachable.
	const LEGACY_ROUTES = ROUTES.filter(
		(route) =>
			!route.path.includes("/accounts") &&
			!route.path.includes("/announcements") &&
			// Its beforeLoad redirects to /serviceInfo while isAuditExplorerEnabled() is
			// false, and this world seeds no flags - so there is no page here to scan.
			!route.path.includes("/auditExplorer"),
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
