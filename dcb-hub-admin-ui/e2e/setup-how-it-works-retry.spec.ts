import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import consortium from "./fixtures-data/consortium.json";
import libraryCount from "./fixtures-data/library-count.json";

/**
 * "How it works" writes one setting per request. When one of them fails, the ones before
 * it are already saved, and pressing Save again must not create them a second time.
 */
test("retrying after a partly-failed save adds each setting once", async ({
	page,
}) => {
	await useAllFeatures(page);
	await seedAuth(page);

	const stored: { id: string; name: string; enabled: boolean }[] = [];
	const addCalls: string[] = [];
	let failedOnce = false;

	await mockGraphQL(page, {
		LoadConsortiumHeader: consortiumBasics,
		LoadLibraryCount: libraryCount,
	});
	await page.route("**/graphql", async (route) => {
		const body = route.request().postDataJSON();
		if (body?.operationName === "LoadConsortium") {
			const record = consortium.consortia.content[0];
			await route.fulfill({
				json: {
					data: {
						consortia: {
							...consortium.consortia,
							content: [{ ...record, functionalSettings: [...stored] }],
						},
					},
				},
			});
			return;
		}
		if (body?.operationName === "AddFunctionalSetting") {
			const { name, enabled } = body.variables.input;
			addCalls.push(name);
			// The third setting fails the first time it is sent.
			if (stored.length === 2 && !failedOnce) {
				failedOnce = true;
				await route.fulfill({
					json: { errors: [{ message: "Temporarily unavailable" }] },
				});
				return;
			}
			const saved = { id: `fs-${stored.length}`, name, enabled };
			stored.push(saved);
			await route.fulfill({ json: { data: { addFunctionalSetting: saved } } });
			return;
		}
		await route.fallback();
	});

	await page.goto("/setup/howItWorks");
	const save = page.getByRole("button", { name: /save and continue/i });

	await save.click();
	await expect(
		page
			.getByRole("alert")
			.filter({ hasText: "We could not save your settings" }),
	).toBeVisible();

	await save.click();
	await expect(page).toHaveURL(/\/setup\/contacts/);

	const timesAdded = Object.fromEntries(
		addCalls.map((name) => [name, addCalls.filter((n) => n === name).length]),
	);
	// The failed attempt counts once for the third setting; nothing else repeats.
	for (const [name, times] of Object.entries(timesAdded)) {
		expect(times, name).toBe(name === addCalls[2] ? 2 : 1);
	}
	expect(new Set(stored.map((setting) => setting.name)).size).toBe(
		stored.length,
	);
});
