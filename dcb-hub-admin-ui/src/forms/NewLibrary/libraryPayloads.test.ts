import { describe, it, expect } from "vitest";

import {
	buildAgencyUpdateInput,
	buildContactInput,
	buildLibraryInput,
	buildLibraryUpdateInput,
	formValuesFromLibrary,
	newContactsOf,
	shouldCreateHostLms,
	shouldCreateLibrary,
	shouldJoinGroup,
} from "./libraryPayloads";
import type { NewLibraryFormValues } from "@schemas/newLibrarySchema";

/**
 * What the New Library wizard sends, and when it is allowed to send it.
 *
 * Both halves have failed in production. The wizard sent the create-shaped
 * payload at `updateLibrary` - a smaller, different input type - so every
 * profile save on the "finish setup" path was rejected outright; and every
 * step that wrote to the server was gated on the step id alone, so pressing
 * Back and then Next created a second Host LMS or a second library and dead-
 * ended the wizard on a step that could never succeed again.
 *
 * Neither was visible from the component: the mutations go through
 * `gqlClient.request<any>`, so the field-name mismatch could not be typed and
 * the re-runs looked like ordinary navigation.
 */

const values = (
	overrides: Partial<NewLibraryFormValues> = {},
): NewLibraryFormValues => ({
	hostLmsCode: "TEST-LMS",
	hostLmsName: "Test LMS",
	lmsClientClass: "org.olf.dcb.core.interaction.sierra.SierraLmsClient",
	isCreatingHostLms: false,
	clientConfigMode: "guided",
	clientConfigFields: {},
	clientConfig: "",
	suppressionRulesetName: "",
	itemSuppressionRulesetName: "",
	agencyCode: "TEST-AGENCY",
	fullName: "Test Library",
	shortName: "Test",
	abbreviatedName: "TL",
	address: "1 Test Street",
	type: "Public",
	latitude: "53.4808",
	longitude: "-2.2426",
	isBorrowingAgency: true,
	isSupplyingAgency: true,
	maxConsortialLoans: "",
	supportHours: "9-5",
	patronWebsite: "https://example.org",
	authProfile: "BASIC/BARCODE+PIN",
	hostLmsConfiguration: "",
	discoverySystem: "",
	backupDowntimeSchedule: "",
	reason: "Adding a new library",
	changeReferenceUrl: "https://example.org/ticket/1",
	libraryId: "",
	contacts: [
		{
			firstName: " Ada ",
			lastName: " Lovelace ",
			email: " ada@example.org ",
			role: "OPERATIONS",
			isPrimaryContact: true,
		},
	],
	groupId: "",
	...overrides,
});

/**
 * Every field `UpdateLibraryInput` declares, from the generated schema types.
 * Anything the builder emits outside this list is a field the server has never
 * heard of, and GraphQL rejects the whole mutation rather than ignoring it.
 */
const UPDATE_LIBRARY_INPUT_FIELDS = [
	"abbreviatedName",
	"address",
	"backupDowntimeSchedule",
	"changeCategory",
	"changeReferenceUrl",
	"discoverySystem",
	"fullName",
	"id",
	"latitude",
	"longitude",
	"patronWebsite",
	"principalLabel",
	"reason",
	"secretLabel",
	"shortName",
	"supportHours",
	"targetLoanToBorrowRatio",
	"type",
];

const UPDATE_AGENCY_INPUT_FIELDS = [
	"changeCategory",
	"changeReferenceUrl",
	"code",
	"isBorrowingAgency",
	"isSupplyingAgency",
	"latitude",
	"longitude",
	"maxConsortialLoans",
	"reason",
];

describe("buildLibraryUpdateInput", () => {
	it("emits nothing UpdateLibraryInput does not declare", () => {
		const input = buildLibraryUpdateInput(values(), "library-1");

		expect(
			Object.keys(input).filter(
				(field) => !UPDATE_LIBRARY_INPUT_FIELDS.includes(field),
			),
		).toEqual([]);
	});

	it("omits the agency-owned and unchangeable fields the create shape carries", () => {
		const input = buildLibraryUpdateInput(values(), "library-1") as Record<
			string,
			unknown
		>;

		// The exact six that made every "finish setup" profile save fail.
		expect(input).not.toHaveProperty("agencyCode");
		expect(input).not.toHaveProperty("isBorrowingAgency");
		expect(input).not.toHaveProperty("isSupplyingAgency");
		expect(input).not.toHaveProperty("maxConsortialLoans");
		expect(input).not.toHaveProperty("hostLmsConfiguration");
		expect(input).not.toHaveProperty("authProfile");
		// And contacts, which updateLibrary has never accepted.
		expect(input).not.toHaveProperty("contacts");
	});

	it("carries the identity edits and the audit trail", () => {
		const input = buildLibraryUpdateInput(
			values({ fullName: "Renamed Library", reason: "Fixing the name" }),
			"library-1",
		);

		expect(input.id).toBe("library-1");
		expect(input.fullName).toBe("Renamed Library");
		expect(input.reason).toBe("Fixing the name");
		expect(input.changeReferenceUrl).toBe("https://example.org/ticket/1");
	});

	it("converts the coordinate text into the Floats the schema wants", () => {
		const input = buildLibraryUpdateInput(values(), "library-1");

		expect(input.latitude).toBe(53.4808);
		expect(input.longitude).toBe(-2.2426);
	});
});

describe("buildAgencyUpdateInput", () => {
	it("emits nothing UpdateAgencyInput does not declare", () => {
		expect(
			Object.keys(buildAgencyUpdateInput(values())).filter(
				(field) => !UPDATE_AGENCY_INPUT_FIELDS.includes(field),
			),
		).toEqual([]);
	});

	it("is keyed on the agency code, not an id", () => {
		expect(buildAgencyUpdateInput(values()).code).toBe("TEST-AGENCY");
	});

	it("carries the participation flags the library update cannot", () => {
		const input = buildAgencyUpdateInput(
			values({ isBorrowingAgency: false, isSupplyingAgency: true }),
		);

		expect(input.isBorrowingAgency).toBe(false);
		expect(input.isSupplyingAgency).toBe(true);
	});

	it("sends no loan cap as null, never as zero", () => {
		// A 0 would stop the library borrowing anything at all, which is the
		// opposite of "no cap".
		expect(buildAgencyUpdateInput(values()).maxConsortialLoans).toBeNull();
		expect(
			buildAgencyUpdateInput(values({ maxConsortialLoans: "   " }))
				.maxConsortialLoans,
		).toBeNull();
	});

	it("sends a stated loan cap as a number", () => {
		expect(
			buildAgencyUpdateInput(values({ maxConsortialLoans: "3" }))
				.maxConsortialLoans,
		).toBe(3);
	});
});

describe("buildLibraryInput", () => {
	it("keeps the agency fields, which the create input does declare", () => {
		const input = buildLibraryInput(values());

		expect(input.agencyCode).toBe("TEST-AGENCY");
		expect(input.isBorrowingAgency).toBe(true);
		expect(input.authProfile).toBe("BASIC/BARCODE+PIN");
		expect(input.hostLmsCode).toBe("TEST-LMS");
	});

	it("trims the contacts it sends inline", () => {
		expect(buildLibraryInput(values()).contacts).toEqual([
			{
				firstName: "Ada",
				lastName: "Lovelace",
				email: "ada@example.org",
				role: "OPERATIONS",
				isPrimaryContact: true,
			},
		]);
	});

	it("sends no loan cap as null here too", () => {
		expect(buildLibraryInput(values()).maxConsortialLoans).toBeNull();
	});
});

describe("buildContactInput", () => {
	it("supplies the library it attaches to and the mandatory change category", () => {
		const formData = values();
		const input = buildContactInput(
			formData.contacts[0],
			formData,
			"library-1",
		);

		expect(input.libraryId).toBe("library-1");
		// Optional on every other input type, required on this one.
		expect(input.changeCategory).toBeTruthy();
		expect(input.reason).toBe("Adding a new library");
	});

	it("trims the typed name and email", () => {
		const formData = values();
		const input = buildContactInput(
			formData.contacts[0],
			formData,
			"library-1",
		);

		expect(input.firstName).toBe("Ada");
		expect(input.email).toBe("ada@example.org");
	});
});

describe("newContactsOf", () => {
	it("selects only the contacts that are not stored yet", () => {
		const stored = { ...values().contacts[0], id: "contact-1" };
		const typed = { ...values().contacts[0], firstName: "Grace" };

		expect(newContactsOf([stored, typed])).toEqual([typed]);
	});

	it("selects nothing once every contact has come back with an id", () => {
		// What stops Back-then-Next creating a second copy of each of them.
		const saved = values().contacts.map((contact) => ({
			...contact,
			id: "contact-1",
		}));

		expect(newContactsOf(saved)).toEqual([]);
	});
});

describe("the write guards", () => {
	describe("shouldCreateHostLms", () => {
		it("creates when nothing has been created yet", () => {
			expect(shouldCreateHostLms("TEST-LMS", null)).toBe(true);
		});

		it("does not create a second time for the same code", () => {
			// Previously a duplicate-code failure with no way forward.
			expect(
				shouldCreateHostLms("TEST-LMS", { hostLms: { code: "TEST-LMS" } }),
			).toBe(false);
		});

		it("creates again when the user goes back and corrects the code", () => {
			// A different code is a different system, so this one is legitimate.
			expect(
				shouldCreateHostLms("TEST-LMS-2", { hostLms: { code: "TEST-LMS" } }),
			).toBe(true);
		});
	});

	describe("shouldCreateLibrary", () => {
		it("creates while there is no library", () => {
			expect(shouldCreateLibrary("")).toBe(true);
			expect(shouldCreateLibrary(undefined)).toBe(true);
		});

		it("does not create a second library once one exists", () => {
			// The re-run collided on the agency code and stranded the wizard.
			expect(shouldCreateLibrary("library-1")).toBe(false);
		});
	});

	describe("shouldJoinGroup", () => {
		it("does nothing when no group was chosen", () => {
			expect(shouldJoinGroup("", [])).toBe(false);
			expect(shouldJoinGroup(undefined, [])).toBe(false);
		});

		it("joins a group this run has not joined", () => {
			expect(shouldJoinGroup("group-1", ["group-2"])).toBe(true);
		});

		it("does not add the same membership twice", () => {
			expect(shouldJoinGroup("group-1", ["group-1"])).toBe(false);
		});
	});
});

describe("formValuesFromLibrary", () => {
	const library = {
		id: "library-1",
		agencyCode: "TEST-AGENCY",
		fullName: "Test Library",
		latitude: 53.4808,
		longitude: null,
		agency: {
			hostLms: { code: "TEST-LMS", name: "Test LMS", lmsClientClass: "Sierra" },
			maxConsortialLoans: 4,
		},
		contacts: [
			{
				id: "contact-1",
				firstName: "Ada",
				lastName: "Lovelace",
				email: "ada@example.org",
				role: { name: "OPERATIONS" },
				isPrimaryContact: true,
			},
		],
	};

	it("carries the stored contact ids through, so they are not created again", () => {
		const contacts = formValuesFromLibrary(library).contacts as any[];

		expect(contacts[0].id).toBe("contact-1");
		expect(newContactsOf(contacts)).toEqual([]);
	});

	it("reads the role out of the role object the query returns", () => {
		const contacts = formValuesFromLibrary(library).contacts as any[];

		expect(contacts[0].role).toBe("OPERATIONS");
	});

	it("gives a library with no contacts a blank one to fill in", () => {
		const contacts = formValuesFromLibrary({
			...library,
			contacts: [],
		}).contacts as any[];

		expect(contacts).toHaveLength(1);
		// Blank, so it counts as outstanding work rather than a stored contact.
		expect(contacts[0].firstName).toBe("");
		expect(newContactsOf(contacts)).toHaveLength(1);
	});

	it("turns absent values into empty strings, so the fields read as missing", () => {
		const prefilled = formValuesFromLibrary(library);

		expect(prefilled.latitude).toBe("53.4808");
		// Null is not 0 here - the field is unanswered, and must show as such.
		expect(prefilled.longitude).toBe("");
		expect(prefilled.shortName).toBe("");
	});

	it("treats an unanswered participation flag as taking part", () => {
		// Only an explicit false is "switched off"; null means nobody has said,
		// and the library is being finished in order to take part.
		expect(formValuesFromLibrary(library).isBorrowingAgency).toBe(true);
		expect(
			formValuesFromLibrary({
				...library,
				agency: { ...library.agency, isSupplyingAgency: false },
			}).isSupplyingAgency,
		).toBe(false);
	});
});
