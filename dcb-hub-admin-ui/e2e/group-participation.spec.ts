import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL, overrideGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { MOCKS } from "./fixtures/routes";
import groupDetail from "./fixtures-data/group-detail.json";

// Enabling or disabling a whole group's participation writes only what would change

const GROUP = groupDetail.libraryGroups.content[0];
const [alpha, beta] = GROUP.members;

// alpha borrows, beta does not, and the third member has no agency at all
const MIXED = {
	libraryGroups: {
		...groupDetail.libraryGroups,
		content: [
			{
				...GROUP,
				members: [
					alpha,
					{
						...beta,
						library: {
							...beta.library,
							agency: { ...beta.library.agency, isBorrowingAgency: false },
						},
					},
					{
						...beta,
						id: "m-no-agency",
						library: {
							...beta.library,
							id: "lib-no-agency",
							agencyCode: null,
							agency: null,
						},
					},
				],
			},
		],
	},
};

test.beforeEach(async ({ page }) => {
	await useAllFeatures(page);
	await seedAuth(page);
});

const open = async (page: import("@playwright/test").Page) => {
	const sent: any[] = [];
	await mockGraphQL(page, MOCKS);
	await overrideGraphQL(page, {
		LoadGroup: MIXED,
		UpdateAgencyParticipationStatus: (variables: any) => {
			sent.push(variables.input);
			return { updateAgencyParticipationStatus: { id: "x" } };
		},
	});
	await page.goto(`/groups/${GROUP.id}/settings`);
	return sent;
};

test("a mixed group is offered both, for each kind of participation", async ({
	page,
}) => {
	await open(page);

	await expect(
		page.getByRole("button", { name: "Disable all for borrowing" }),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Enable all for borrowing" }),
	).toBeVisible();
	// Both supply, so only disabling would change anything
	await expect(
		page.getByRole("button", { name: "Disable all for supplying" }),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Enable all for supplying" }),
	).toHaveCount(0);
});

test("disabling writes only the members that take part, and counts what was written", async ({
	page,
}) => {
	const sent = await open(page);

	await page.getByRole("button", { name: "Disable all for borrowing" }).click();
	const dialog = page.getByRole("dialog");
	await dialog.getByRole("textbox", { name: /reason/i }).fill("Term break");
	await dialog.getByRole("button", { name: "Save changes" }).click();

	await expect.poll(() => sent.length).toBe(1);
	expect(sent[0]).toMatchObject({
		code: alpha.library.agencyCode,
		isBorrowingAgency: false,
		reason: "Term break",
	});
	await expect(
		page.getByText("1 library statuses updated succesfully"),
	).toBeVisible();
});
