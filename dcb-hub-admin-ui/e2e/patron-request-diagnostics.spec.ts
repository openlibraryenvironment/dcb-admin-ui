import { type Page } from "@playwright/test";
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

const SUPPLIER = {
	id: "5a5a5a5a-1111-5111-9111-111111111111",
	localAgency: "beta",
	hostLmsCode: "beta-lms",
	isActive: true,
	localHoldCount: 4,
	localRenewable: false,
	localHoldingId: "SUP-HOLDING-9",
};

const REQUEST = {
	...TRACKED_REQUEST,
	autoPollCountForCurrentStatus: 17,
	manualPollCountForCurrentStatus: 3,
	localHoldingId: "BOR-HOLDING-2",
	pickupItemBarcode: "PICKUP-BC-77",
	pickupHoldingId: "PICKUP-HOLDING-5",
	suppliers: [SUPPLIER],
};

const mockRequest = (page: Page, extra: Record<string, unknown> = {}) =>
	mockGraphQL(page, {
		LoadConsortium: consortiumBasics,
		LoadConsortiumHeader: consortiumBasics,
		LoadHostLms: { hostLms: { totalSize: 0, content: [] } },
		LoadLibraryDirectory: libraries,
		...patronRequestDetailMocks,
		LoadPatronRequest: { patronRequests: { totalSize: 1, content: [REQUEST] } },
		...extra,
	});

/** The value shown under an attribute title on the open tab. */
const attribute = (page: Page, title: string) =>
	page
		.getByRole("tabpanel")
		.getByText(title, { exact: true })
		.locator("xpath=..");

test.describe("patron request tracking and holding details", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page, { roles: ["CONSORTIUM_ADMIN"] });
		await useAllFeatures(page);
		await mockRequest(page);
		await page.goto(`/patronRequests/${REQUEST.id}`);
	});

	test("splits the status checks into automatic and manual", async ({
		page,
	}) => {
		await expect(attribute(page, "Automatic checks in status")).toContainText(
			"17",
		);
		await expect(attribute(page, "Manual checks in status")).toContainText("3");
	});

	test("shows the supplier's hold queue, renewability and holding", async ({
		page,
	}) => {
		await page.getByRole("tab", { name: "Supplying" }).click();

		await expect(attribute(page, "Holds queued at supplier")).toContainText(
			"4",
		);
		await expect(attribute(page, "Renewable at supplier")).toContainText(
			"false",
		);
		await expect(attribute(page, "Supplier holding ID")).toContainText(
			"SUP-HOLDING-9",
		);
	});

	test("shows the borrowing and pickup identifiers", async ({ page }) => {
		await page.getByRole("tab", { name: "Borrowing" }).click();
		await expect(attribute(page, "Borrower holding ID")).toContainText(
			"BOR-HOLDING-2",
		);

		await page.getByRole("tab", { name: "Pickup" }).click();
		await expect(attribute(page, "Pickup item barcode")).toContainText(
			"PICKUP-BC-77",
		);
		await expect(attribute(page, "Pickup holding ID")).toContainText(
			"PICKUP-HOLDING-5",
		);
	});
});
