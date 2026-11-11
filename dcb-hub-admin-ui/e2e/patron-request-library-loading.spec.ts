import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";
import libraries from "./fixtures-data/libraries.json";
import {
	patronRequestDetailMocks,
	TRACKED_REQUEST,
} from "./fixtures/patron-request-detail";

test("a library still loading holds its cell, so the fields after it stay put", async ({
	page,
}) => {
	await useAllFeatures(page);
	await seedAuth(page);
	await mockGraphQL(page, {
		LoadConsortium: consortiumBasics,
		LoadConsortiumHeader: consortiumBasics,
		LoadHostLms: { hostLms: { totalSize: 0, content: [] } },
		LoadLibraryDirectory: libraries,
		...patronRequestDetailMocks,
		LoadPatronRequest: {
			patronRequests: {
				totalSize: 1,
				content: [{ ...TRACKED_REQUEST, patronHostlmsCode: "alpha-lms" }],
			},
		},
	});

	let release!: () => void;
	const released = new Promise<void>((resolve) => (release = resolve));
	await page.route("**/graphql", async (route) => {
		if (route.request().postDataJSON()?.operationName !== "LoadLibraryBasics")
			return route.fallback();
		await released;
		await route.fulfill({
			json: {
				data: {
					libraries: {
						totalSize: 1,
						content: [libraries.libraries.content[0]],
					},
				},
			},
		});
	});

	await page.goto(`/patronRequests/${TRACKED_REQUEST.id}`);
	await expect(
		page.getByRole("progressbar", { name: "Loading" }).first(),
	).toBeVisible();
	const field = page.getByText("Pickup location name", { exact: true });
	const loading = await field.boundingBox();

	release();
	await expect(
		page.getByRole("link", { name: libraries.libraries.content[0].fullName }),
	).toBeVisible();
	const loaded = await field.boundingBox();

	expect(loaded).toEqual(loading);
});
