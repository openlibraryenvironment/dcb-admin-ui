import { type Page } from "@playwright/test";
import { test, expect } from "./fixtures/test";

import { seedAuth } from "./fixtures/auth";
import { useAllFeatures, useAllFeaturesExcept } from "./fixtures/flags";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import {
	expectPaintedScheme,
	scanForViolations,
	waitForDialogToSettle,
} from "./fixtures/axe";
import { MOCKS } from "./fixtures/routes";

interface Tag {
	code: string;
	label: string;
	description: string | null;
	active: boolean;
}

interface Sent {
	operationName: string;
	variables: Record<string, any>;
}

const IN_USE =
	"Tag DAMAGED is on at least one request, so it cannot be deleted; retire it instead.";

/**
 * A stand-in for dcb-service's tag list: it applies what it is sent, so the grid shows the
 * result of each action, and refuses to delete DAMAGED as a carried tag. One handler for
 * queries and mutations alike; anything else is answered from the shared MOCKS.
 */
async function mockTagService(page: Page, sent: Sent[]) {
	const tags: Tag[] = [
		{
			code: "DAMAGED",
			label: "Damaged",
			description: "The item arrived or was returned damaged",
			active: true,
		},
		{ code: "SPARE", label: "Spare", description: null, active: true },
	];

	await page.route("**/graphql", async (route) => {
		const body = route.request().postDataJSON();
		const operationName = body?.operationName as string;
		const variables = body?.variables ?? {};

		if (operationName === "LoadRequestTags") {
			await route.fulfill({ json: { data: { requestTags: tags } } });
			return;
		}

		if (operationName === "CreateRequestTag") {
			sent.push({ operationName, variables });
			const tag = { active: true, ...variables.input };
			tags.push(tag);
			await route.fulfill({ json: { data: { createRequestTag: tag } } });
			return;
		}

		if (operationName === "UpdateRequestTag") {
			sent.push({ operationName, variables });
			const tag = tags.find((each) => each.code === variables.input.code)!;
			Object.assign(tag, variables.input);
			await route.fulfill({ json: { data: { updateRequestTag: tag } } });
			return;
		}

		if (operationName === "DeleteRequestTag") {
			sent.push({ operationName, variables });
			if (variables.code === "DAMAGED") {
				await route.fulfill({
					json: {
						data: null,
						errors: [{ message: IN_USE, path: ["deleteRequestTag"] }],
					},
				});
				return;
			}
			tags.splice(
				tags.findIndex((each) => each.code === variables.code),
				1,
			);
			await route.fulfill({
				json: { data: { deleteRequestTag: { success: true, message: "" } } },
			});
			return;
		}

		const answer = (MOCKS as Record<string, unknown>)[operationName];
		if (answer !== undefined) {
			await route.fulfill({ json: { data: answer } });
			return;
		}
		await route.continue();
	});
}

test.describe("Consortium request tags", () => {
	test.beforeEach(async ({ page }) => {
		await useAllFeatures(page);
		await seedAuth(page);
	});

	test("a tag is added, edited, retired and deleted", async ({ page }) => {
		const sent: Sent[] = [];
		await mockTagService(page, sent);

		await page.goto("/consortium/requestTags");
		await expect(page.getByRole("status")).toContainText(
			"2 tags of a possible 100.",
		);

		await page.getByRole("button", { name: "Add a tag" }).click();
		const dialog = page.getByRole("dialog", { name: "Add a tag" });
		await dialog.getByRole("textbox", { name: "Label" }).fill("Wrong edition");
		await dialog.getByRole("textbox", { name: "Code" }).fill("wrong_edition");
		await dialog
			.getByRole("textbox", { name: "Description" })
			.fill("A different edition from the one requested");
		await waitForDialogToSettle(page);
		await scanForViolations(page);
		await dialog.getByRole("button", { name: "Add a tag" }).click();

		await expect(dialog).toHaveCount(0);
		await expect(page.getByRole("status")).toHaveText("Wrong edition added.");
		expect(sent.at(-1)).toEqual({
			operationName: "CreateRequestTag",
			// Upper-cased as typed, so the server's code rule is met
			variables: {
				input: {
					code: "WRONG_EDITION",
					label: "Wrong edition",
					description: "A different edition from the one requested",
				},
			},
		});

		await page.getByRole("button", { name: "Edit Wrong edition" }).click();
		const editDialog = page.getByRole("dialog", { name: "Edit Wrong edition" });
		await expect(
			editDialog.getByRole("textbox", { name: "Code" }),
		).toBeDisabled();
		await editDialog.getByRole("textbox", { name: "Description" }).fill("");
		await editDialog.getByRole("button", { name: "Save" }).click();

		await expect(editDialog).toHaveCount(0);
		expect(sent.at(-1)?.variables.input).toEqual({
			code: "WRONG_EDITION",
			label: "Wrong edition",
			// An explicit null clears the stored description; omitting it would keep it
			description: null,
		});

		await page.getByRole("button", { name: "Retire Wrong edition" }).click();
		await expect(page.getByRole("status")).toHaveText(
			"Wrong edition retired. It stays on the requests that have it.",
		);
		expect(sent.at(-1)?.variables.input).toEqual({
			code: "WRONG_EDITION",
			label: "Wrong edition",
			active: false,
		});
		await expect(
			page.getByRole("button", { name: "Restore Wrong edition" }),
		).toBeVisible();

		await page.getByRole("button", { name: "Delete Spare" }).click();
		const confirm = page.getByRole("dialog", { name: "Delete Spare?" });
		await confirm.getByRole("button", { name: "Delete" }).click();

		await expect(confirm).toHaveCount(0);
		await expect(page.getByRole("status")).toHaveText("Spare deleted.");
		await expect(
			page.getByRole("button", { name: "Delete Spare" }),
		).toHaveCount(0);
	});

	for (const scheme of ["light", "dark"] as const) {
		test.describe(scheme, () => {
			test.use({ colorScheme: scheme });

			test("deleting a tag a request carries is refused in the server's words", async ({
				page,
			}) => {
				const sent: Sent[] = [];
				await mockTagService(page, sent);

				await page.goto("/consortium/requestTags");
				await expect(
					page.getByRole("button", { name: "Delete Damaged" }),
				).toBeVisible();
				await expectPaintedScheme(page, scheme);
				await page.getByRole("button", { name: "Delete Damaged" }).click();
				const confirm = page.getByRole("dialog", { name: "Delete Damaged?" });
				await confirm.getByRole("button", { name: "Delete" }).click();

				await expect(confirm.getByRole("alert")).toHaveText(IN_USE);
				await waitForDialogToSettle(page);
				await scanForViolations(page);

				await confirm.getByRole("button", { name: "Cancel" }).click();
				await expect(
					page.getByRole("button", { name: "Delete Damaged" }),
				).toBeVisible();
			});
		});
	}

	test("a code dcb-service would refuse is named before saving", async ({
		page,
	}) => {
		const sent: Sent[] = [];
		await mockTagService(page, sent);

		await page.goto("/consortium/requestTags");
		await page.getByRole("button", { name: "Add a tag" }).click();
		const dialog = page.getByRole("dialog", { name: "Add a tag" });
		await dialog.getByRole("textbox", { name: "Label" }).fill("First copy");
		const code = dialog.getByRole("textbox", { name: "Code" });
		await code.fill("1ST_COPY");

		await expect(code).toHaveAttribute("aria-invalid", "true");
		await expect(code).toHaveAccessibleDescription(
			"Use 2 to 32 capital letters, digits or underscores, starting with a letter.",
		);
		await expect(
			dialog.getByRole("button", { name: "Add a tag" }),
		).toBeDisabled();
		expect(sent).toEqual([]);
	});
});

test.describe("Request tags on a deployment without them", () => {
	test("the tab is absent and its URL redirects", async ({ page }) => {
		await useAllFeaturesExcept(page, ["VITE_FEATURE_REQUEST_TAGS"]);
		await seedAuth(page);
		await mockGraphQL(page, MOCKS);

		await page.goto("/consortium");
		await expect(page.getByRole("tab", { name: /profile/i })).toBeVisible();
		await expect(page.getByRole("tab", { name: "Request tags" })).toHaveCount(
			0,
		);

		await page.goto("/consortium/requestTags");
		await expect(page).toHaveURL(/\/consortium$/);
	});
});
