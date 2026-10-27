import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { scanForViolations } from "./fixtures/axe";
import consortiumBasics from "./fixtures-data/consortium-basics.json";

// The figure the setup programme is measured by: how long a library takes from being
// created to taking part in its first request
const library = (id: string, code: string) => ({
	id,
	fullName: `${code} Library`,
	shortName: code,
	abbreviatedName: code,
	agencyCode: code,
	supportHours: null,
	address: "1 Street",
	type: "Public",
	latitude: 51.5,
	longitude: -0.1,
	contacts: [],
	agency: {
		id: `agency-${id}`,
		code,
		name: code,
		authProfile: "BASIC/BARCODE+PIN",
		hostLms: {
			id: `host-${id}`,
			code: `${code}-LMS`,
			clientConfig: {},
			lmsClientClass: "org.olf.dcb.core.interaction.alma.AlmaHostLmsClient",
		},
		isSupplyingAgency: true,
		isBorrowingAgency: true,
	},
	secondHostLms: null,
	membership: [],
});

const requests = (dateCreated: string | null) => ({
	patronRequests: {
		totalSize: dateCreated ? 1 : 0,
		content: dateCreated ? [{ id: "pr", dateCreated }] : [],
	},
});

test.describe("Onboarding: time to first request", () => {
	test.beforeEach(async ({ page }) => {
		await seedAuth(page);
		await mockGraphQL(page, {
			LoadConsortiumHeader: consortiumBasics,
			LoadLibraries: {
				libraries: {
					totalSize: 3,
					content: [
						library("1", "FAST"),
						library("2", "SLOW"),
						library("3", "NEW"),
					],
				},
			},
			LoadLibraryCreations: {
				dataChangeLog: {
					content: [
						{ entityId: "1", timestampLogged: "2026-01-01T00:00:00Z" },
						{ entityId: "2", timestampLogged: "2026-01-01T00:00:00Z" },
						{ entityId: "3", timestampLogged: "2026-09-01T00:00:00Z" },
					],
				},
			},
			// FAST first borrowed after 4 days and supplied after 9, SLOW supplied after 30,
			// and NEW has taken part in nothing yet
			LoadPatronRequests: (variables: any) => {
				const oldest = variables.orderBy === "ASC";
				const query: string = variables.query;
				if (query.includes("FAST-LMS"))
					return requests(
						oldest ? "2026-01-05T00:00:00Z" : "2026-02-01T00:00:00Z",
					);
				if (query.includes('"FAST"'))
					return requests(
						oldest ? "2026-01-10T00:00:00Z" : "2026-02-01T00:00:00Z",
					);
				if (query.includes('"SLOW"'))
					return requests(
						oldest ? "2026-01-31T00:00:00Z" : "2026-02-01T00:00:00Z",
					);
				return requests(null);
			},
			LoadMappings: { referenceValueMappings: { totalSize: 0, content: [] } },
			LoadLocations: { locations: { totalSize: 0, content: [] } },
			LoadBibs: { sourceBibs: { totalSize: 0, content: [] } },
			LoadNumericRangeMappings: {
				numericRangeMappings: { totalSize: 0, content: [] },
			},
		});
		await page.goto("/consortium/onboarding");
	});

	test("shows the median across the libraries that have taken part", async ({
		page,
	}) => {
		const stats = page.getByRole("region", { name: "Consortium at a glance" });

		// FAST at 4 days and SLOW at 30: the median of two is 17
		await expect(stats.getByText("Median days to first request")).toBeVisible();
		await expect(stats.getByText("17", { exact: true })).toBeVisible();
		await expect(
			stats.getByText(
				"From the library being created, across 2 libraries. 1 not yet used.",
			),
		).toBeVisible();
	});

	for (const scheme of ["light", "dark"] as const) {
		test(`passes axe, ${scheme}`, async ({ page }) => {
			await page.emulateMedia({ colorScheme: scheme });
			await expect(
				page.getByText("Median days to first request"),
			).toBeVisible();

			await scanForViolations(page);
		});
	}
});
