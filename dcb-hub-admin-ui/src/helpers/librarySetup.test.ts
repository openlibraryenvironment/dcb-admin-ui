import { describe, expect, it } from "vitest";
import {
	evaluateLibraryIngest,
	evaluateLibraryMappings,
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

describe("participation-aware traffic", () => {
	const complete = evaluateLibrarySetup(completeProfile, completeCounts);
	const withFlags = (borrowing: any, supplying: any) => ({
		...completeProfile,
		agency: {
			...completeProfile.agency,
			isBorrowingAgency: borrowing,
			isSupplyingAgency: supplying,
		},
	});

	it("does not call a borrowing-disabled library dormant for not borrowing", () => {
		// Working exactly as configured. Flagging it teaches people to ignore the
		// indicator, which costs more than the missed signal.
		const traffic = evaluateLibraryTraffic(
			{ supplierRequestCount: 5 },
			complete,
			withFlags(false, true),
		);
		expect(traffic.borrowingDisabled).toBe(true);
		expect(traffic.isDormant).toBe(false);
	});

	it("still flags a borrowing-disabled library that also never supplies", () => {
		// Supplying is enabled and silent, so there is a real question here.
		const traffic = evaluateLibraryTraffic(
			{},
			complete,
			withFlags(false, true),
		);
		expect(traffic.isDormant).toBe(true);
	});

	it("treats a library disabled in both directions as intentional", () => {
		const traffic = evaluateLibraryTraffic(
			{},
			complete,
			withFlags(false, false),
		);
		expect(traffic.isFullyDisabled).toBe(true);
		expect(traffic.isDormant).toBe(false);
	});

	it("treats an unset flag as enabled, not as disabled", () => {
		// null means nobody has said, which is not the same as "no" - silence
		// there is still worth asking about.
		const traffic = evaluateLibraryTraffic({}, complete, withFlags(null, null));
		expect(traffic.borrowingDisabled).toBe(false);
		expect(traffic.isDormant).toBe(true);
	});

	it("ignores traffic in a direction that is switched off", () => {
		// Historic requests from before borrowing was disabled must not make a
		// now-silent supplying side look healthy.
		const traffic = evaluateLibraryTraffic(
			{ patronRequestCount: 9 },
			complete,
			withFlags(false, true),
		);
		expect(traffic.isDormant).toBe(true);
	});

	describe("lastRequestAt", () => {
		it("reports the more recent of the two directions", () => {
			expect(
				evaluateLibraryTraffic({
					lastBorrowingRequestAt: "2026-01-01T00:00:00Z",
					lastSupplyingRequestAt: "2026-06-01T00:00:00Z",
				}).lastRequestAt,
			).toBe("2026-06-01T00:00:00Z");
		});

		it("copes when only one direction has ever been used", () => {
			expect(
				evaluateLibraryTraffic({
					lastBorrowingRequestAt: "2026-01-01T00:00:00Z",
				}).lastRequestAt,
			).toBe("2026-01-01T00:00:00Z");
		});

		it("is null when nothing has ever happened", () => {
			expect(evaluateLibraryTraffic({}).lastRequestAt).toBeNull();
			expect(
				evaluateLibraryTraffic({
					lastBorrowingRequestAt: null,
					lastSupplyingRequestAt: null,
				}).lastRequestAt,
			).toBeNull();
		});
	});
});

describe("evaluateLibraryIngest", () => {
	it("reports a library with bib records as ingested", () => {
		const ingest = evaluateLibraryIngest({ bibCount: 1200 }, completeProfile);
		expect(ingest).toMatchObject({
			bibCount: 1200,
			hasBibs: true,
			isIngestOutstanding: false,
		});
	});

	it("flags a supplying library with no bib records", () => {
		// However well configured, it has nothing anyone can request.
		expect(
			evaluateLibraryIngest({ bibCount: 0 }, completeProfile)
				.isIngestOutstanding,
		).toBe(true);
	});

	it("does not flag a library that is not meant to supply", () => {
		const notSupplying = {
			...completeProfile,
			agency: { ...completeProfile.agency, isSupplyingAgency: false },
		};
		expect(
			evaluateLibraryIngest({ bibCount: 0 }, notSupplying).isIngestOutstanding,
		).toBe(false);
	});

	it("flags an unset supplying flag, because nobody has ruled it out", () => {
		const unset = {
			...completeProfile,
			agency: { ...completeProfile.agency, isSupplyingAgency: null },
		};
		expect(
			evaluateLibraryIngest({ bibCount: 0 }, unset).isIngestOutstanding,
		).toBe(true);
	});

	it("treats an absent count as nothing ingested", () => {
		expect(evaluateLibraryIngest({}, completeProfile)).toMatchObject({
			bibCount: 0,
			hasBibs: false,
		});
	});
});

const sierra = {
	...completeProfile,
	agency: {
		hostLms: { code: "SIER", id: "h2", lmsClientClass: "SierraLmsClient" },
	},
};

describe("evaluateLibraryMappings", () => {
	it("is complete when every applicable category has mappings", () => {
		const mappings = evaluateLibraryMappings(completeCounts, completeProfile);

		expect(mappings.isComplete).toBe(true);
		expect(mappings.isPartial).toBe(false);
		expect(mappings.missing).toEqual([]);
	});

	it("names the missing category rather than just failing", () => {
		const mappings = evaluateLibraryMappings(
			{ ...completeCounts, locationMappingCount: 0 },
			completeProfile,
		);

		expect(mappings.isComplete).toBe(false);
		expect(mappings.missing).toEqual(["locationType"]);
	});

	it("distinguishes a half-finished job from an untouched library", () => {
		const partial = evaluateLibraryMappings(
			{ itemTypeMappingCount: 5 },
			completeProfile,
		);
		expect(partial.isPartial).toBe(true);

		const untouched = evaluateLibraryMappings({}, completeProfile);
		expect(untouched.isPartial).toBe(false);
		expect(untouched.missing).toEqual([
			"itemType",
			"patronType",
			"locationType",
		]);
	});

	it("excludes numeric ranges for an ILS that does not use them", () => {
		const mappings = evaluateLibraryMappings(completeCounts, completeProfile);
		const numericRange = mappings.categories.find(
			(category) => category.id === "numericRange",
		);

		expect(numericRange?.applicable).toBe(false);
		expect(mappings.missing).not.toContain("numericRange");
	});

	it("counts numeric ranges against Sierra and Polaris", () => {
		const mappings = evaluateLibraryMappings(
			{ ...completeCounts, numericRangeMappingCount: 0 },
			sierra,
		);

		expect(mappings.missing).toEqual(["numericRange"]);
		expect(mappings.isPartial).toBe(true);
	});
});

describe("setup steps and the mappings indicator agree", () => {
	it("reports the same categories the refMappings step is waiting on", () => {
		const setup = evaluateLibrarySetup(completeProfile, {
			...completeCounts,
			patronTypeMappingCount: 0,
		});

		expect(setup.mappings.missing).toEqual(["patronType"]);
		expect(
			setup.steps.find((step) => step.id === "refMappings")?.complete,
		).toBe(false);
	});

	it("keeps numeric ranges out of the reference value step", () => {
		const setup = evaluateLibrarySetup(sierra, {
			...completeCounts,
			numericRangeMappingCount: 0,
		});

		expect(
			setup.steps.find((step) => step.id === "refMappings")?.complete,
		).toBe(true);
		expect(
			setup.steps.find((step) => step.id === "numMappings")?.complete,
		).toBe(false);
		expect(setup.firstIncompleteStep).toBe("numMappings");
	});
});
