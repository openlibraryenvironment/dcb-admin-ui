import { type Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";

import { seedAuth } from "./fixtures/auth";
import { useAllFeatures } from "./fixtures/flags";
import {
	expectPaintedScheme,
	scanForViolations,
	waitForDialogToSettle,
} from "./fixtures/axe";
import { seedTheme } from "./fixtures/theme";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import groupDetail from "./fixtures-data/group-region-detail.json";

/** A group's notices reach the patrons of its member libraries; a consortium administrator publishes them. */

const GROUP_ID = "99999999-1111-5111-9111-111111111111";

interface Sent {
	operationName: string;
	variables: any;
}

async function mockDcbService(page: Page, sent: Sent[]) {
	await page.route("**/graphql", async (route) => {
		const body = route.request().postDataJSON();
		const operationName = body?.operationName as string;

		const answers: Record<string, unknown> = {
			LoadConsortiumHeader: consortiumBasics,
			LoadGroup: groupDetail,
			LoadAnnouncements: { announcements: [] },
		};

		if (operationName in answers) {
			await route.fulfill({ json: { data: answers[operationName] } });
			return;
		}

		if (operationName === "CreateAnnouncement") {
			sent.push({ operationName, variables: body.variables });
			await route.fulfill({
				json: {
					data: { createAnnouncement: { id: "an-1", ...body.variables.input } },
				},
			});
			return;
		}

		await route.continue();
	});
}

test.describe("Group announcements", () => {
	test("a consortium administrator publishes a notice at the group's scope", async ({
		page,
	}) => {
		const sent: Sent[] = [];
		await useAllFeatures(page);
		await seedAuth(page);
		await mockDcbService(page, sent);

		await page.goto(`/groups/${GROUP_ID}`);
		await page.getByRole("tab", { name: "Announcements" }).click();
		await expect(page).toHaveURL(
			new RegExp(`/groups/${GROUP_ID}/announcements$`),
		);

		await page
			.getByRole("textbox", { name: "Headline" })
			.fill("The northern van is delayed");
		await page
			.getByRole("textbox", { name: "What you want to say" })
			.fill("A day late this week.");
		await page.getByRole("button", { name: "Publish to this group" }).click();

		// The confirmation names the reach: the group and how many libraries are in it
		const dialog = page.getByRole("dialog");
		await expect(dialog).toContainText("the 1 libraries in North East");
		await dialog.getByRole("button", { name: "Yes, publish it" }).click();

		await expect.poll(() => sent.length).toBe(1);
		expect(sent[0].variables.input.scopeType).toBe("LIBRARY_GROUP");
		expect(sent[0].variables.input.scopeId).toBe(GROUP_ID);
	});
});

test.describe("Group announcements accessibility", () => {
	for (const scheme of ["light", "dark"] as const) {
		test(`has no axe violations in ${scheme}, including the confirmation`, async ({
			page,
		}) => {
			await useAllFeatures(page);
			await seedAuth(page);
			await seedTheme(page, { mode: scheme });
			await mockDcbService(page, []);

			await page.goto(`/groups/${GROUP_ID}/announcements`);
			await expect(
				page.getByRole("button", { name: "Publish to this group" }),
			).toBeVisible();
			await expectPaintedScheme(page, scheme);
			await scanForViolations(page);

			await page.getByRole("textbox", { name: "Headline" }).fill("Headline");
			await page
				.getByRole("textbox", { name: "What you want to say" })
				.fill("Body");
			await page.getByRole("button", { name: "Publish to this group" }).click();
			await waitForDialogToSettle(page);
			await scanForViolations(page);
		});
	}
});
