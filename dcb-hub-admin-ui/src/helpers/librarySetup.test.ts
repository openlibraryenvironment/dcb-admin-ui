import { describe, expect, it } from "vitest";
import {
	evaluateLibrarySetup,
	evaluateLibraryTraffic,
	missingProfileFields,
	requiresNumericRangeMappings,
	REQUIRED_PROFILE_FIELDS,
} from "@helpers/librarySetup";

const completeProfile = {
	id: "lib-1",
	fullName: "Test Library",
	shortName: "Test",
	abbreviatedName: "TL",
	address: "1 Test Street",
	type: "Public",
	agencyCode: "TEST",
	latitude: 51.5,
	longitude: -0.1,
	contacts: [{ id: "c1" }],
	membership: [{ libraryGroup: { id: "g1" } }],
	agency: {
		hostLms: { code: "TEST", id: "h1", lmsClientClass: "FolioLmsClient" },
	},
};

const completeCounts = {
	itemTypeMappingCount: 3,
	patronTypeMappingCount: 2,
	locationMappingCount: 1,
	pickupLocationCount: 4,
	numericRangeMappingCount: null,
};

describe("requiresNumericRangeMappings", () => {
	it("is true for Sierra and Polaris", () => {
		expect(
			requiresNumericRangeMappings({
				agency: { hostLms: { lmsClientClass: "SierraLmsClient" } },
			}),
		).toBe(true);
		expect(
			requiresNumericRangeMappings({
				agency: { hostLms: { lmsClientClass: "PolarisLmsClient" } },
			}),
		).toBe(true);
	});

	it("is false for other ILSes, so the step is not held against them", () => {
		expect(
			requiresNumericRangeMappings({
				agency: { hostLms: { lmsClientClass: "FolioLmsClient" } },
			}),
		).toBe(false);
	});

	it("is false when there is no Host LMS yet", () => {
		expect(requiresNumericRangeMappings({})).toBe(false);
		expect(requiresNumericRangeMappings(undefined)).toBe(false);
	});
});

describe("missingProfileFields", () => {
	it("finds nothing wrong with a complete profile", () => {
		expect(missingProfileFields(completeProfile)).toEqual([]);
	});

	it("treats an empty string as missing, not as an answer", () => {
		// LibraryInput declares these String!, so "" passes GraphQL's non-null
		// check. That is exactly how libraries were created without them.
		expect(missingProfileFields({ ...completeProfile, address: "" })).toEqual([
			"address",
		]);
		expect(missingProfileFields({ ...completeProfile, type: "   " })).toEqual([
			"type",
		]);
	});

	it("treats null and undefined coordinates as missing", () => {
		expect(
			missingProfileFields({ ...completeProfile, latitude: null }),
		).toEqual(["latitude"]);
		expect(
			missingProfileFields({ ...completeProfile, longitude: undefined }),
		).toEqual(["longitude"]);
	});

	it("accepts zero as a coordinate", () => {
		// The equator and the prime meridian are real places; a falsy check would
		// call them missing.
		expect(
			missingProfileFields({ ...completeProfile, latitude: 0, longitude: 0 }),
		).toEqual([]);
	});

	it("reports every missing field, not just the first", () => {
		expect(missingProfileFields({ id: "bare" })).toEqual([
			...REQUIRED_PROFILE_FIELDS,
		]);
	});
});

describe("evaluateLibrarySetup", () => {
	it("reports a fully configured library as complete", () => {
		const setup = evaluateLibrarySetup(completeProfile, completeCounts);
		expect(setup.isComplete).toBe(true);
		expect(setup.firstIncompleteStep).toBeUndefined();
	});

	it("sends the user to the profile when fields are missing", () => {
		const setup = evaluateLibrarySetup(
			{ ...completeProfile, address: "" },
			completeCounts,
		);
		expect(setup.isComplete).toBe(false);
		expect(setup.firstIncompleteStep).toBe("profile");
		expect(setup.missingProfileFields).toEqual(["address"]);
	});

	it("sends the user to the earliest outstanding step, not the last", () => {
		const setup = evaluateLibrarySetup(completeProfile, {
			...completeCounts,
			locationMappingCount: 0,
			pickupLocationCount: 0,
		});
		expect(setup.firstIncompleteStep).toBe("refMappings");
	});

	it("counts group membership", () => {
		const setup = evaluateLibrarySetup(
			{ ...completeProfile, membership: [] },
			completeCounts,
		);
		expect(setup.firstIncompleteStep).toBe("group");
	});

	it("needs all three mapping categories, not just one", () => {
		// One category is enough to route nothing; a request needs item type,
		// patron type and location together.
		const setup = evaluateLibrarySetup(completeProfile, {
			...completeCounts,
			patronTypeMappingCount: 0,
		});
		expect(
			setup.steps.find((step) => step.id === "refMappings")?.complete,
		).toBe(false);
	});

	it("requires a PICKUP location, not merely a location", () => {
		const setup = evaluateLibrarySetup(completeProfile, {
			...completeCounts,
			pickupLocationCount: 0,
		});
		expect(setup.firstIncompleteStep).toBe("locations");
	});

	describe("numeric range mappings", () => {
		const sierra = {
			...completeProfile,
			agency: {
				hostLms: { code: "S", id: "h", lmsClientClass: "SierraLmsClient" },
			},
		};

		it("are not held against an ILS that does not use them", () => {
			const setup = evaluateLibrarySetup(completeProfile, {
				...completeCounts,
				numericRangeMappingCount: null,
			});
			expect(setup.isComplete).toBe(true);
			expect(
				setup.steps.find((step) => step.id === "numMappings")?.applicable,
			).toBe(false);
		});

		it("are required for Sierra", () => {
			const setup = evaluateLibrarySetup(sierra, {
				...completeCounts,
				numericRangeMappingCount: 0,
			});
			expect(setup.isComplete).toBe(false);
			expect(setup.firstIncompleteStep).toBe("numMappings");
		});

		it("are satisfied for Sierra once some exist", () => {
			const setup = evaluateLibrarySetup(sierra, {
				...completeCounts,
				numericRangeMappingCount: 5,
			});
			expect(setup.isComplete).toBe(true);
		});
	});

	it("treats a library with no counts at all as unconfigured", () => {
		// The banner must not claim a library is finished just because the counts
		// have not loaded.
		const setup = evaluateLibrarySetup(completeProfile);
		expect(setup.isComplete).toBe(false);
		expect(setup.firstIncompleteStep).toBe("refMappings");
	});

	it("always returns a step for every stage, applicable or not", () => {
		const setup = evaluateLibrarySetup(completeProfile, completeCounts);
		expect(setup.steps.map((step) => step.id)).toEqual([
			"profile",
			"contacts",
			"group",
			"refMappings",
			"numMappings",
			"locations",
		]);
	});
});

describe("evaluateLibraryTraffic", () => {
	const complete = evaluateLibrarySetup(completeProfile, completeCounts);
	const incomplete = evaluateLibrarySetup(completeProfile, {
		...completeCounts,
		pickupLocationCount: 0,
	});

	it("reports borrowing and supplying separately", () => {
		expect(
			evaluateLibraryTraffic({
				patronRequestCount: 3,
				supplierRequestCount: 0,
			}),
		).toMatchObject({ hasBorrowed: true, hasSupplied: false });
		expect(
			evaluateLibraryTraffic({
				patronRequestCount: 0,
				supplierRequestCount: 7,
			}),
		).toMatchObject({ hasBorrowed: false, hasSupplied: true });
	});

	it("counts either direction as traffic", () => {
		expect(
			evaluateLibraryTraffic({ supplierRequestCount: 1 }).hasAnyTraffic,
		).toBe(true);
		expect(evaluateLibraryTraffic({}).hasAnyTraffic).toBe(false);
	});

	it("calls a configured library with no requests dormant", () => {
		// The signal staff actually want: set up correctly, and still unused.
		expect(evaluateLibraryTraffic({}, complete).isDormant).toBe(true);
	});

	it("does not call an unconfigured library dormant", () => {
		// It has no traffic because it cannot have traffic. Reporting that as a
		// separate problem buries the real one.
		expect(evaluateLibraryTraffic({}, incomplete).isDormant).toBe(false);
	});

	it("is not dormant once anything has flowed through it", () => {
		expect(
			evaluateLibraryTraffic({ patronRequestCount: 1 }, complete).isDormant,
		).toBe(false);
	});

	it("is not dormant when setup state is unknown", () => {
		// Without knowing the setup is finished, "unused" is not a safe claim.
		expect(evaluateLibraryTraffic({}).isDormant).toBe(false);
	});

	it("never affects setup completeness", () => {
		// Traffic used to be folded into "is anything missing", so a correctly
		// configured but unused library was reported as misconfigured.
		expect(complete.isComplete).toBe(true);
		expect(evaluateLibraryTraffic({}, complete).hasAnyTraffic).toBe(false);
	});
});
