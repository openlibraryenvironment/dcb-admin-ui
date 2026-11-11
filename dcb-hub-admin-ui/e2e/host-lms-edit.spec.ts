import { test, expect } from "./fixtures/test";
import { ADMIN_ROLES, seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { MOCKS } from "./fixtures/routes";
import hostLms from "./fixtures-data/host-lms.json";

const HOST_LMS = hostLms.hostLms.content[0];

// A config with the same settings in another key order compared unequal as JSON text, so
// every save re-sent it, and dcb-service re-ran its probes against the LMS
test("renaming a Host LMS does not send its unchanged settings", async ({
	page,
}) => {
	const sent: Record<string, unknown>[] = [];
	const reordered = {
		...hostLms,
		hostLms: {
			...hostLms.hostLms,
			content: [
				{
					...HOST_LMS,
					clientConfig: Object.fromEntries(
						Object.entries(HOST_LMS.clientConfig).reverse(),
					),
				},
			],
		},
	};
	await useAllFeatures(page);
	await seedAuth(page, { roles: ADMIN_ROLES });
	await mockGraphQL(page, {
		...MOCKS,
		LoadHostLms: reordered,
		UpdateHostLms: (variables: { input: Record<string, unknown> }) => {
			sent.push(variables.input);
			return { updateHostLms: { ...HOST_LMS, name: "Alpha renamed" } };
		},
	});
	await page.goto(`/hostlmss/${HOST_LMS.id}`);

	await page.getByRole("button", { name: "Actions" }).click();
	await page.getByRole("menuitem", { name: "Edit" }).click();
	await page
		.getByRole("textbox", { name: "Host LMS name" })
		.fill("Alpha renamed");
	await page.getByRole("button", { name: "Save" }).click();
	// Before, ChangesSummary parsed the page's plain-text summary as JSON and the page crashed
	const audit = page.getByRole("dialog");
	await expect(audit).toContainText("Alpha renamed");
	await audit.getByRole("textbox", { name: /reason/i }).fill("Renaming");
	await audit.getByRole("button", { name: "Save changes" }).click();

	await expect.poll(() => sent.length).toBe(1);
	expect(sent[0]).toMatchObject({ name: "Alpha renamed" });
	expect(sent[0]).not.toHaveProperty("clientConfig");
});
