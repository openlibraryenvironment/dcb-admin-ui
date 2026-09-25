import { test, expect, type Page } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import groupDetail from "./fixtures-data/group-region-detail.json";
import resolvedSettings from "./fixtures-data/resolved-functional-settings.json";

/**
 * Settings at group scope — §V-22.6b.
 *
 * Exactly ONE library group type carries settings on a deployment. That decision is what
 * keeps the resolution chain linear, and the thing worth testing is that the UI HONOURS it:
 * a group of another type must not offer an editable panel, because a value written there
 * would resolve for no library at all and the administrator would have no way to discover
 * that it had done nothing.
 */

const GROUP_ID = "99999999-1111-5111-9111-111111111111";
const PANEL = "Functional settings";

async function mockDcbService(page: Page, groupType: string | null) {
	await page.route("**/graphql", async (route) => {
		const body = route.request().postDataJSON();

		const answers: Record<string, unknown> = {
			LoadConsortiumHeader: consortiumBasics,
			LoadGroup: groupDetail,
			LoadResolvedFunctionalSettings: resolvedSettings,
			LoadSettingsBearingGroupType: { settingsBearingGroupType: groupType },
		};

		if (body?.operationName in answers) {
			await route.fulfill({ json: { data: answers[body.operationName] } });
			return;
		}

		await route.continue();
	});
}

test.describe("Group settings inheritance", () => {
	test("a settings-bearing group edits its own settings", async ({ page }) => {
		// The fixture group is a REGION and this deployment's settings-bearing type is
		// REGION, so this group IS a level of the chain.
		await useAllFeatures(page);
		await seedAuth(page);
		await mockDcbService(page, "REGION");

		await page.goto(`/groups/${GROUP_ID}/settings`);

		await expect(page.getByRole("heading", { level: 2, name: PANEL })).toBeVisible();

		// The copy must describe THIS chain. A group inherits from the consortium and from
		// nothing else, so the library sentence — which can mention a group — would name a
		// level above this one that does not exist.
		await expect(page.getByText("applies to every library in the group")).toBeVisible();
		await expect(page.getByText("or its group")).toHaveCount(0);
	});

	test("a group of another type is told it carries no settings", async ({ page }) => {
		// This deployment carries settings on CONSORTIUM_REGION groups; the fixture group is
		// a REGION. An editable panel here would invite an administrator to configure
		// something that resolves for nobody.
		await useAllFeatures(page);
		await seedAuth(page);
		await mockDcbService(page, "CONSORTIUM_REGION");

		await page.goto(`/groups/${GROUP_ID}/settings`);

		await expect(page.getByRole("heading", { level: 2, name: PANEL })).toHaveCount(0);
		await expect(
			page.getByText("Settings are carried by CONSORTIUM_REGION groups"),
		).toBeVisible();
	});

	test("a deployment with no settings-bearing type says so", async ({ page }) => {
		await useAllFeatures(page);
		await seedAuth(page);
		await mockDcbService(page, null);

		await page.goto(`/groups/${GROUP_ID}/settings`);

		await expect(page.getByRole("heading", { level: 2, name: PANEL })).toHaveCount(0);
		await expect(
			page.getByText("No group type carries settings on this deployment"),
		).toBeVisible();
	});
});
