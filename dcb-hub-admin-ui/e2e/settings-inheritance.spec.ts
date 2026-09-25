import { test, expect, type Page } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { useAllFeatures } from "./fixtures/flags";
import { scanForViolations, expectPaintedScheme } from "./fixtures/axe";
import { seedTheme } from "./fixtures/theme";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraryDetail from "./fixtures-data/library-detail.json";
import resolvedSettings from "./fixtures-data/resolved-functional-settings.json";

/**
 * Settings inheritance on a library's settings tab — §V-22.6.
 *
 * The requirement is not "show the values". It is that every control says whether the value
 * is inherited AND from where, and offers a way back — because without those a bulk-set is a
 * one-way door: nobody can tell afterwards why a library is not following the consortium,
 * and nobody can revert what they cannot identify. So the assertions here are about the
 * PROVENANCE and the revert affordance rather than about the switches.
 */

const LIBRARY_ID = "c23df3ab-77c0-5689-b56d-fc8a2d6a5f22";

/** The four fixture rows are one of each state the display has to tell apart. */
const INHERITED_FROM_CONSORTIUM = "Own library borrowing";
const SET_AT_THIS_LIBRARY = "Pickup anywhere";
const INHERITED_FROM_GROUP = "Re-resolution";
const DECIDED_NOWHERE = "Select unavailable items";

const QUERIES: Record<string, unknown> = {
	LoadConsortiumHeader: consortiumBasics,
	LoadLibrary: libraryDetail,
	LoadLibraryBasics: libraryDetail,
	LoadResolvedFunctionalSettings: resolvedSettings,
	// The default deployment: nobody has named a settings-bearing group type, so there is
	// no group level and the copy must not describe one.
	LoadSettingsBearingGroupType: { settingsBearingGroupType: null },
};

interface Sent {
	operationName: string;
	variables: any;
}

/**
 * ONE route handler for the whole spec, queries and mutations together.
 *
 * Deliberately not `mockGraphQL` plus a second `page.route` for the mutation. Layering the
 * two and calling `route.fallback()` looked right and silently stopped the fixture handler
 * being reached, so the panel sat on its skeleton and the failure read as a missing control
 * rather than as an unanswered query. One handler, one place to look.
 */
async function mockDcbService(
	page: Page,
	sent: Sent[],
	overrides: Record<string, unknown> = {},
) {
	const answers = { ...QUERIES, ...overrides };

	await page.route("**/graphql", async (route) => {
		const body = route.request().postDataJSON();
		const operationName = body?.operationName as string;

		if (operationName in answers) {
			await route.fulfill({ json: { data: answers[operationName] } });
			return;
		}

		if (operationName === "SetFunctionalSettingAtScopes") {
			sent.push({ operationName, variables: body.variables });
			await route.fulfill({
				json: {
					data: {
						setFunctionalSettingAtScopes: {
							name: body.variables.input.name,
							scopeType: "LIBRARY",
							changed: 1,
							scopeIds: [LIBRARY_ID],
						},
					},
				},
			});
			return;
		}

		if (operationName === "RevertFunctionalSettingToInherited") {
			sent.push({ operationName, variables: body.variables });
			await route.fulfill({
				json: {
					data: {
						revertFunctionalSettingToInherited: {
							name: body.variables.input.name,
							scopeType: "LIBRARY",
							changed: 1,
							scopeIds: [LIBRARY_ID],
						},
					},
				},
			});
			return;
		}

		await route.continue();
	});
}

async function openSettingsTab(page: Page) {
	await page.goto(`/libraries/${LIBRARY_ID}/settings`);
	await expect(
		page.getByRole("heading", { level: 2, name: "Functional settings" }),
	).toBeVisible();
}

function rowFor(page: Page, setting: string) {
	return page
		.getByRole("row")
		.filter({ has: page.getByText(setting, { exact: true }) });
}

/**
 * MUI 9's Switch puts `role="switch"` on its checkbox input, so the accessible role is
 * `switch` and not `checkbox` — worth stating, because the wrong one here fails as "control
 * not found" and reads like a rendering bug rather than a locator one.
 */
function switchIn(page: Page, setting: string) {
	return rowFor(page, setting).getByRole("switch", {
		name: `${setting} enabled`,
	});
}

function revertIn(page: Page, setting: string) {
	return rowFor(page, setting).getByRole("button", {
		name: "Revert to inherited",
	});
}

test.describe("Settings inheritance", () => {
	let sent: Sent[];

	test.beforeEach(async ({ page }) => {
		sent = [];
		await useAllFeatures(page);
		await seedAuth(page);
		await mockDcbService(page, sent);
	});

	test("says where each value came from, by name", async ({ page }) => {
		await openSettingsTab(page);

		// The NAME, not only the level. "Inherited" alone tells an administrator that
		// something above them decided this and not which something, which is the question
		// they have to answer before they can go and change it.
		await expect(rowFor(page, INHERITED_FROM_CONSORTIUM)).toContainText(
			"Inherited from MOBIUS",
		);
		await expect(rowFor(page, INHERITED_FROM_GROUP)).toContainText(
			"Inherited from North East",
		);
		await expect(rowFor(page, SET_AT_THIS_LIBRARY)).toContainText(
			"Set for this library",
		);
	});

	test("distinguishes a setting nobody has decided from one switched off above", async ({
		page,
	}) => {
		await openSettingsTab(page);

		// Both read as off. They are not the same thing: one is a decision an administrator
		// can go and look at, the other is one still to be taken.
		await expect(rowFor(page, DECIDED_NOWHERE)).toContainText("Not set anywhere");
		await expect(rowFor(page, DECIDED_NOWHERE)).not.toContainText("Inherited from");
	});

	test("offers the revert only where there is an override to remove", async ({
		page,
	}) => {
		await openSettingsTab(page);

		await expect(revertIn(page, SET_AT_THIS_LIBRARY)).toBeEnabled();

		// A revert on an inherited value would correctly report no change, which reads as a
		// broken button; on an undecided one it would suggest a level to fall back to that
		// does not exist.
		await expect(revertIn(page, INHERITED_FROM_CONSORTIUM)).toBeDisabled();
		await expect(revertIn(page, DECIDED_NOWHERE)).toBeDisabled();
	});

	test("writes an explicit override at this library, and only this library", async ({
		page,
	}) => {
		await openSettingsTab(page);

		await switchIn(page, INHERITED_FROM_CONSORTIUM).click();

		await expect.poll(() => sent.length).toBe(1);

		// LIBRARY scope, exactly one id, and a reason: the write must not widen, and N-4
		// needs the change log to say who and why.
		const { input } = sent[0].variables;
		expect(input.scopeType).toBe("LIBRARY");
		expect(input.scopeIds).toEqual([LIBRARY_ID]);
		expect(input.name).toBe("OWN_LIBRARY_BORROWING");
		expect(input.enabled).toBe(false);
		expect(input.reason).toContain("Alpha Test Library");
	});

	test("announces the change to assistive technology, not only visually", async ({
		page,
	}) => {
		await openSettingsTab(page);

		await switchIn(page, INHERITED_FROM_CONSORTIUM).click();

		// A state that changes only on screen does not exist for a screen-reader user. The
		// switch announces its own state; "now Disabled for this library" is the part that
		// is not in the control.
		await expect(
			page.getByText("Own library borrowing is now Disabled"),
		).toBeAttached();
	});

	test("describes the chain this deployment actually has", async ({ page }) => {
		await openSettingsTab(page);

		// No settings-bearing group type is configured, so there is no group level. Telling
		// an administrator a value might be coming from a group would describe a level that
		// does not exist on their deployment.
		await expect(page.getByText("or its group")).toHaveCount(0);
	});

	test("is keyboard-complete: the revert is reachable and operable by keyboard", async ({
		page,
	}) => {
		await openSettingsTab(page);

		const revert = revertIn(page, SET_AT_THIS_LIBRARY);

		await revert.focus();
		await expect(revert).toBeFocused();
		await page.keyboard.press("Enter");

		await expect
			.poll(() => sent.filter((s) => s.operationName.startsWith("Revert")).length)
			.toBe(1);
	});
});

test.describe("Settings inheritance where a group level exists", () => {
	test("names the group level in the explanation", async ({ page }) => {
		await useAllFeatures(page);
		await seedAuth(page);
		await mockDcbService(page, [], {
			LoadSettingsBearingGroupType: { settingsBearingGroupType: "REGION" },
		});

		await openSettingsTab(page);

		await expect(page.getByText("or its group")).toBeVisible();
	});
});

test.describe("Settings inheritance accessibility", () => {
	for (const scheme of ["light", "dark"] as const) {
		test(`has no axe violations in ${scheme}`, async ({ page }) => {
			await useAllFeatures(page);
			await seedAuth(page);
			await seedTheme(page, { mode: scheme });
			await mockDcbService(page, []);

			await openSettingsTab(page);
			await expectPaintedScheme(page, scheme);
			await scanForViolations(page);
		});
	}
});
