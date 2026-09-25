import { test, expect, type Page } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { useAllFeatures } from "./fixtures/flags";
import { scanForViolations, waitForDialogToSettle } from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import consortium from "./fixtures-data/consortium.json";
import libraries from "./fixtures-data/libraries.json";

/**
 * Setting one functional setting across chosen libraries — §V-22.6(2).
 *
 * The two things that make this safe rather than merely convenient are asserted here: the
 * write is at LIBRARY scope and names exactly the libraries chosen, and the same dialog can
 * take the override away again. A bulk-set with no bulk revert is a one-way door, and
 * writing the consortium's value into every library instead is the thing §V-22.6a is
 * explicit is NOT the same as inheriting.
 */

const ALPHA_ID = "c23df3ab-77c0-5689-b56d-fc8a2d6a5f22";

interface Sent {
	operationName: string;
	variables: any;
}

async function mockDcbService(page: Page, sent: Sent[]) {
	await page.route("**/graphql", async (route) => {
		const body = route.request().postDataJSON();
		const operationName = body?.operationName as string;

		const queries: Record<string, unknown> = {
			LoadConsortiumHeader: consortiumBasics,
			LoadConsortiumFS: consortium,
			LoadLibraries: libraries,
		};

		if (queries[operationName]) {
			await route.fulfill({ json: { data: queries[operationName] } });
			return;
		}

		if (
			operationName === "SetFunctionalSettingAtScopes" ||
			operationName === "RevertFunctionalSettingToInherited"
		) {
			sent.push({ operationName, variables: body.variables });
			const field =
				operationName === "SetFunctionalSettingAtScopes"
					? "setFunctionalSettingAtScopes"
					: "revertFunctionalSettingToInherited";

			await route.fulfill({
				json: {
					data: {
						[field]: {
							name: body.variables.input.name,
							scopeType: "LIBRARY",
							changed: body.variables.input.scopeIds.length,
							scopeIds: body.variables.input.scopeIds,
						},
					},
				},
			});
			return;
		}

		await route.continue();
	});
}

async function openDialog(page: Page) {
	await page.goto("/consortium/functionalSettings");
	await page.getByRole("button", { name: "Set for chosen libraries" }).click();
	await expect(
		page.getByRole("dialog", { name: "Set for chosen libraries" }),
	).toBeVisible();
}

async function chooseAlpha(page: Page) {
	await page.getByRole("combobox", { name: "Libraries" }).click();
	await page.getByRole("option", { name: "Alpha Test Library" }).click();
}

test.describe("Bulk functional settings", () => {
	let sent: Sent[];

	test.beforeEach(async ({ page }) => {
		sent = [];
		await useAllFeatures(page);
		await seedAuth(page);
		await mockDcbService(page, sent);
	});

	test("will not apply until libraries and a reason are given", async ({
		page,
	}) => {
		await openDialog(page);

		// A bulk write with no reason would leave the change log unable to answer "which
		// twelve libraries, and why" — which is the question this action creates.
		await expect(page.getByRole("button", { name: /^Apply to/ })).toBeDisabled();

		await chooseAlpha(page);
		await expect(page.getByRole("button", { name: /^Apply to/ })).toBeDisabled();

		await page.getByRole("textbox", { name: "Reason for this change" }).fill("Pilot");
		await expect(page.getByRole("button", { name: /^Apply to/ })).toBeEnabled();
	});

	test("writes explicit overrides at exactly the libraries chosen", async ({
		page,
	}) => {
		await openDialog(page);
		await chooseAlpha(page);
		await page
			.getByRole("textbox", { name: "Reason for this change" })
			.fill("Pilot for the North");
		await page.getByRole("button", { name: /^Apply to/ }).click();

		await expect.poll(() => sent.length).toBe(1);

		const { input } = sent[0].variables;
		expect(sent[0].operationName).toBe("SetFunctionalSettingAtScopes");
		expect(input.scopeType).toBe("LIBRARY");
		expect(input.scopeIds).toEqual([ALPHA_ID]);
		expect(input.enabled).toBe(true);
		expect(input.reason).toBe("Pilot for the North");
	});

	test("can take the override away again from the same dialog", async ({
		page,
	}) => {
		await openDialog(page);
		await page
			.getByRole("radio", { name: "Revert them to following the consortium" })
			.check();
		await chooseAlpha(page);
		await page
			.getByRole("textbox", { name: "Reason for this change" })
			.fill("No longer piloting");
		await page.getByRole("button", { name: /^Apply to/ }).click();

		await expect.poll(() => sent.length).toBe(1);
		expect(sent[0].operationName).toBe("RevertFunctionalSettingToInherited");
		// A revert carries no `enabled`: it removes the row rather than writing the parent's
		// value into it, which §V-22.6a says are different things.
		expect(sent[0].variables.input.enabled).toBeUndefined();
	});

	test("reports what actually changed, not what was asked for", async ({
		page,
	}) => {
		await openDialog(page);
		await chooseAlpha(page);
		await page.getByRole("textbox", { name: "Reason for this change" }).fill("Pilot");
		await page.getByRole("button", { name: /^Apply to/ }).click();

		await expect(page.getByRole("status")).toContainText("Applied to 1 of the 1");
	});

	test("has no axe violations while the dialog is open", async ({ page }) => {
		await openDialog(page);
		// Before scanning, not after opening: an entering dialog is translucent, and axe
		// measures the backdrop showing through it as a contrast failure of a surface that
		// exists for a fifth of a second. See waitForDialogToSettle.
		await waitForDialogToSettle(page);
		await scanForViolations(page);
	});
});
