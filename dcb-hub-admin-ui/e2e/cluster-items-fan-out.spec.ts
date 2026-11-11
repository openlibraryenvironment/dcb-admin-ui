import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { CLUSTER_ID } from "./fixtures/cluster-mocks";
import { MOCKS } from "./fixtures/routes";
import availability from "./fixtures-data/cluster-availability.json";

const HELD_NOT_OFFERED = {
	...availability.itemList[0],
	id: "ee550000-5555-5555-9555-eeeeeeeeeeee",
	barcode: "HELD-ONLY-1",
	decisionLogEntries: ["Shelf location REF is not requestable"],
};

// Each call is one request per Host LMS to a system we do not own, and the tab made two on
// every visit to count the items it was not showing
test("the unfiltered fan-out waits until someone asks what is not offered", async ({
	page,
}) => {
	const asked: string[] = [];
	await page.route("**/items/availability*", (route) => {
		const filters = new URL(route.request().url()).searchParams.get("filters");
		asked.push(filters ?? "offered");
		return route.fulfill({
			json:
				filters === "none"
					? {
							...availability,
							itemList: [...availability.itemList, HELD_NOT_OFFERED],
						}
					: availability,
		});
	});
	await useAllFeatures(page);
	await mockGraphQL(page, MOCKS);
	await seedAuth(page);
	await page.goto(`/search/${CLUSTER_ID}/items`);

	const notOffered = page.getByRole("button", {
		name: "Items held but not offered for request",
	});
	await expect(notOffered).toBeVisible();
	expect(asked).toEqual(["offered"]);

	await notOffered.click();

	await expect(
		page.getByRole("button", { name: "1 item(s) unable to be shown" }),
	).toBeVisible();
	expect(asked).toEqual(["offered", "none"]);
});

// It said only "Something went wrong"
test("a library that could not be asked is named in what went wrong", async ({
	page,
}) => {
	await page.route("**/items/availability*", (route) =>
		route.fulfill({
			json: {
				...availability,
				errors: [
					{ message: "Unable to reach Host LMS beta-lms" },
					{ message: "Unable to reach Host LMS beta-lms" },
				],
			},
		}),
	);
	await useAllFeatures(page);
	await mockGraphQL(page, MOCKS);
	await seedAuth(page);
	await page.goto(`/search/${CLUSTER_ID}/items`);

	const alert = page.getByRole("alert").filter({
		hasText: "Some libraries' systems could not be asked",
	});
	await expect(alert.getByRole("listitem")).toHaveText([
		"Unable to reach Host LMS beta-lms",
	]);
});

// The grid of items not offered gave no reason; the detail panel had it as JSON
test("an item not offered says why", async ({ page }) => {
	await page.route("**/items/availability*", (route) => {
		const filters = new URL(route.request().url()).searchParams.get("filters");
		return route.fulfill({
			json:
				filters === "none"
					? {
							...availability,
							itemList: [...availability.itemList, HELD_NOT_OFFERED],
						}
					: availability,
		});
	});
	await useAllFeatures(page);
	await mockGraphQL(page, MOCKS);
	await seedAuth(page);
	await page.goto(`/search/${CLUSTER_ID}/items`);
	await page
		.getByRole("button", { name: "Items held but not offered for request" })
		.click();

	await expect(
		page.getByRole("gridcell", {
			name: "Shelf location REF is not requestable",
		}),
	).toBeVisible();
});
