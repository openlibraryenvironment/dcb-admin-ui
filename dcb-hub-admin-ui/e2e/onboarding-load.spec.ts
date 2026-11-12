import { test, expect } from "./fixtures/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import consortiumBasics from "./fixtures-data/consortium-basics.json";

// What the onboarding page asks dcb-service for. It counts per library, so every query
// it makes is multiplied by the consortium's membership.

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

const LIBRARIES = {
	libraries: {
		totalSize: 2,
		content: [library("1", "ALPHA"), library("2", "BETA")],
	},
};

const none = (field: string) => ({ [field]: { totalSize: 0, content: [] } });

test.beforeEach(async ({ page }) => {
	await seedAuth(page);
});

// Median days to first request returns in dcb-service 9.4.0, as one server-side query
test("asks for no library's oldest request and reads no change log", async ({
	page,
}) => {
	await mockGraphQL(page, {
		LoadConsortiumHeader: consortiumBasics,
		LoadLibraries: LIBRARIES,
		LoadPatronRequests: none("patronRequests"),
		LoadMappings: none("referenceValueMappings"),
		LoadLocations: none("locations"),
		LoadBibs: none("sourceBibs"),
		LoadNumericRangeMappings: none("numericRangeMappings"),
	});
	// After mockGraphQL, so it sees each request first and passes it on
	const sent: { operation: string; variables: any }[] = [];
	await page.route("**/graphql", async (route) => {
		const body = route.request().postDataJSON();
		sent.push({ operation: body?.operationName, variables: body?.variables });
		await route.fallback();
	});
	await page.goto("/consortium/onboarding");

	const stats = page.getByRole("region", { name: "Consortium at a glance" });
	await expect(stats.getByText("2", { exact: true }).first()).toBeVisible();
	await expect(stats.getByText("Median days to first request")).toHaveCount(0);

	const requests = sent.filter((s) => s.operation === "LoadPatronRequests");
	expect(requests.length).toBeGreaterThan(0);
	expect(requests.filter((s) => s.variables?.orderBy === "ASC")).toEqual([]);
	expect(sent.map((s) => s.operation)).not.toContain("LoadLibraryCreations");
});
