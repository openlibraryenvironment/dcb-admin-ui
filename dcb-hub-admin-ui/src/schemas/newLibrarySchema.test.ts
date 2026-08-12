import { describe, it, expect } from "vitest";

import { newLibrarySchema, resolveClientConfig } from "./newLibrarySchema";
import { HOST_LMS_CLASSES } from "@helpers/hostLmsClientConfig";

const validLibrary = () => ({
	hostLmsCode: "EXAMPLE",
	hostLmsName: "Example",
	lmsClientClass: HOST_LMS_CLASSES.sierra,
	isCreatingHostLms: false,
	clientConfigMode: "guided" as const,
	clientConfigFields: {},
	clientConfig: "",
	suppressionRulesetName: "",
	itemSuppressionRulesetName: "",
	agencyCode: "EX",
	fullName: "Example Library",
	shortName: "Example",
	abbreviatedName: "EXL",
	address: "1 Example Street",
	type: "Public",
	latitude: "53.4808",
	longitude: "-2.2426",
	isBorrowingAgency: true,
	isSupplyingAgency: true,
	maxConsortialLoans: "",
	supportHours: "",
	patronWebsite: "",
	authProfile: "BASIC/BARCODE+PIN",
	hostLmsConfiguration: "",
	discoverySystem: "",
	backupDowntimeSchedule: "",
	reason: "Adding a new library",
	changeReferenceUrl: "",
	libraryId: "",
	contacts: [
		{
			firstName: "Ada",
			lastName: "Lovelace",
			email: "ada@example.org",
			role: "TECHNICAL_CONTACT",
			isPrimaryContact: true,
		},
	],
	groupId: "",
});

const errorsFor = (values: any): Record<string, string> => {
	const result = newLibrarySchema.safeParse(values);
	if (result.success) return {};
	return Object.fromEntries(
		result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
	);
};

describe("newLibrarySchema", () => {
	it("accepts a fully populated library", () => {
		expect(newLibrarySchema.safeParse(validLibrary()).success).toBe(true);
	});

	describe("coordinates", () => {
		it("rejects text that is not a number", () => {
			// The old schema modelled these as z.number() and the input coerced
			// with Number(), so a pasted "51.5o74" arrived as NaN - which IS a
			// number, passed validation, and rendered back as the string "NaN".
			const errors = errorsFor({ ...validLibrary(), latitude: "51.5o74" });
			expect(errors.latitude).toBeDefined();
		});

		it("rejects coordinates outside the possible range", () => {
			expect(
				errorsFor({ ...validLibrary(), latitude: "91" }).latitude,
			).toBeDefined();
			expect(
				errorsFor({ ...validLibrary(), longitude: "-181" }).longitude,
			).toBeDefined();
		});

		it("accepts a negative decimal and the poles", () => {
			expect(
				newLibrarySchema.safeParse({ ...validLibrary(), latitude: "-90" })
					.success,
			).toBe(true);
			expect(
				newLibrarySchema.safeParse({ ...validLibrary(), longitude: "-0.1278" })
					.success,
			).toBe(true);
		});

		it("requires them rather than accepting a blank", () => {
			expect(
				errorsFor({ ...validLibrary(), latitude: "" }).latitude,
			).toBeDefined();
		});
	});

	describe("consortial participation", () => {
		it("accepts a blank max consortial loans as no limit", () => {
			expect(
				newLibrarySchema.safeParse({
					...validLibrary(),
					maxConsortialLoans: "",
				}).success,
			).toBe(true);
		});

		it("rejects a negative or fractional loan cap", () => {
			expect(
				errorsFor({ ...validLibrary(), maxConsortialLoans: "-1" })
					.maxConsortialLoans,
			).toBeDefined();
			expect(
				errorsFor({ ...validLibrary(), maxConsortialLoans: "2.5" })
					.maxConsortialLoans,
			).toBeDefined();
			expect(
				errorsFor({ ...validLibrary(), maxConsortialLoans: "many" })
					.maxConsortialLoans,
			).toBeDefined();
		});

		it("accepts zero and a whole number", () => {
			for (const value of ["0", "12"]) {
				expect(
					newLibrarySchema.safeParse({
						...validLibrary(),
						maxConsortialLoans: value,
					}).success,
					value,
				).toBe(true);
			}
		});

		it("requires an explicit answer on both directions", () => {
			// Null is "nobody has said", which is what every library created
			// before this field existed was left as.
			const withoutBorrowing: Record<string, unknown> = validLibrary();
			delete withoutBorrowing.isBorrowingAgency;
			expect(newLibrarySchema.safeParse(withoutBorrowing).success).toBe(false);
		});
	});

	describe("contacts", () => {
		it("requires at least one", () => {
			expect(
				errorsFor({ ...validLibrary(), contacts: [] }).contacts,
			).toBeDefined();
		});

		it("validates the email of each one", () => {
			const errors = errorsFor({
				...validLibrary(),
				contacts: [{ ...validLibrary().contacts[0], email: "not-an-email" }],
			});
			expect(errors["contacts.0.email"]).toBeDefined();
		});
	});

	describe("client config", () => {
		it("is not checked when attaching to an existing Host LMS", () => {
			const result = newLibrarySchema.safeParse({
				...validLibrary(),
				isCreatingHostLms: false,
				lmsClientClass: HOST_LMS_CLASSES.koha,
				clientConfigFields: {},
			});
			expect(result.success).toBe(true);
		});

		it("blocks creating a Host LMS of a class the catalogue does not know", () => {
			// HostLmsConfigValidator answers "Unsupported LMS Client Class" with a
			// 400 for anything it has no case for.
			const errors = errorsFor({
				...validLibrary(),
				isCreatingHostLms: true,
				lmsClientClass: "com.example.SomeOtherClient",
			});
			expect(errors.lmsClientClass).toBeDefined();
		});

		it("accepts a Koha Host LMS with its full configuration", () => {
			const result = newLibrarySchema.safeParse({
				...validLibrary(),
				isCreatingHostLms: true,
				lmsClientClass: HOST_LMS_CLASSES.koha,
				clientConfigFields: {
					"api-url": "https://koha.example.org/api/v1",
					client_id: "id",
					client_secret: "secret",
					"default-agency-code": "EX",
					"sharing-library-code": "SHARE",
					"virtual-item-library-code": "VLIB",
					"virtual-item-location-code": "VLOC",
				},
			});
			expect(result.success).toBe(true);
		});

		it("reports each missing required guided field against its own input", () => {
			const errors = errorsFor({
				...validLibrary(),
				isCreatingHostLms: true,
				clientConfigFields: { "base-url": "https://sierra.example.org" },
			});

			expect(errors["clientConfigFields.key"]).toBeDefined();
			expect(errors["clientConfigFields.page-size"]).toBeDefined();
			expect(errors["clientConfigFields.base-url"]).toBeUndefined();
		});

		it("holds the raw JSON editor to the same required keys", () => {
			const errors = errorsFor({
				...validLibrary(),
				isCreatingHostLms: true,
				clientConfigMode: "json",
				clientConfig: '{"base-url": "https://sierra.example.org"}',
			});

			expect(errors.clientConfig).toBeDefined();
		});

		it("rejects JSON that does not parse", () => {
			const errors = errorsFor({
				...validLibrary(),
				isCreatingHostLms: true,
				clientConfigMode: "json",
				clientConfig: "{not json",
			});
			expect(errors.clientConfig).toBeDefined();
		});
	});

	describe("resolveClientConfig", () => {
		it("builds from the guided fields in guided mode", () => {
			expect(
				resolveClientConfig({
					lmsClientClass: HOST_LMS_CLASSES.sierra,
					clientConfigMode: "guided",
					clientConfigFields: { "base-url": "https://sierra.example.org" },
					clientConfig: '{"base-url": "https://ignored.example.org"}',
				} as any),
			).toEqual({ "base-url": "https://sierra.example.org" });
		});

		it("uses the raw editor in json mode, unknown keys and all", () => {
			expect(
				resolveClientConfig({
					lmsClientClass: HOST_LMS_CLASSES.sierra,
					clientConfigMode: "json",
					clientConfigFields: { "base-url": "https://ignored.example.org" },
					clientConfig: '{"base-url": "https://raw.example.org", "bespoke": 1}',
				} as any),
			).toEqual({ "base-url": "https://raw.example.org", bespoke: 1 });
		});
	});
});
