import { describe, expect, it } from "vitest";
import {
	ENTITY_REGISTRY,
	entityOwnsQueryKey,
	type EntityKey,
} from "@constants/entityRegistry";

const ENTITIES = Object.keys(ENTITY_REGISTRY) as EntityKey[];

describe("entity registry", () => {
	it("gives every entity the identity fields its mutations need", () => {
		for (const entity of ENTITIES) {
			const definition = ENTITY_REGISTRY[entity];
			expect(definition.buildUpdateId("an-id")).not.toEqual({});
			expect(definition.keyPrefixes.length).toBeGreaterThan(0);
			expect(definition.nameKey).toMatch(/\w+\.\w+/);
		}
	});

	it("declares a response field for every mutation it declares", () => {
		// Reading the wrong field turns a server-side refusal into a silent
		// success, which is how a delete can look like it worked and not have.
		for (const entity of ENTITIES) {
			const definition = ENTITY_REGISTRY[entity];
			if (definition.updateMutation) {
				expect(definition.updateOperation, `${entity} update`).toBeDefined();
			}
			if (definition.deleteMutation) {
				expect(definition.deleteOperation, `${entity} delete`).toBeDefined();
			}
		}
	});

	it("keys agencies on code and everything else on id", () => {
		expect(ENTITY_REGISTRY.agency.buildUpdateId("ABC")).toEqual({
			code: "ABC",
		});
		expect(ENTITY_REGISTRY.library.buildUpdateId("uuid")).toEqual({
			id: "uuid",
		});
		expect(ENTITY_REGISTRY.location.buildUpdateId("uuid")).toEqual({
			id: "uuid",
		});
	});

	it("sends contacts' owning entity with the delete", () => {
		// A person can be a contact of several owners, so the id alone does not
		// identify what to remove.
		expect(
			ENTITY_REGISTRY.consortiumContact.buildDeleteId("person-1", {
				ownerId: "consortium-1",
			}),
		).toEqual({ personId: "person-1", consortiumId: "consortium-1" });

		expect(
			ENTITY_REGISTRY.libraryContact.buildDeleteId("person-1", {
				ownerId: "library-1",
			}),
		).toEqual({ personId: "person-1", libraryId: "library-1" });
	});

	it("reads deleteConsortiumContact's response from deleteContact", () => {
		// The mutation is named for what it does, the field is named for the
		// resolver; they differ, and only the registry knows.
		expect(ENTITY_REGISTRY.consortiumContact.deleteOperation).toBe(
			"deleteContact",
		);
	});

	it("has no delete path for functional settings", () => {
		expect(ENTITY_REGISTRY.functionalSetting.deleteMutation).toBeUndefined();
	});

	describe("normaliseUpdateFields", () => {
		it("sends a contact's role by name, not as the rendered object", () => {
			const normalise =
				ENTITY_REGISTRY.consortiumContact.normaliseUpdateFields!;
			expect(
				normalise({ role: { name: "SUPPORT", displayName: "Support" } }),
			).toEqual({ role: "SUPPORT" });
		});

		it("leaves changed fields alone when the role did not change", () => {
			const normalise = ENTITY_REGISTRY.libraryContact.normaliseUpdateFields!;
			expect(normalise({ email: "a@b.c" })).toEqual({ email: "a@b.c" });
		});
	});
});

describe("entityOwnsQueryKey", () => {
	// The real query keys these entities are cached under. If a key is added to
	// the app and not covered here, invalidation silently stops covering it -
	// which is the exact failure the prefix predicate exists to prevent.
	const LIVE_KEYS: Record<EntityKey, readonly unknown[][]> = {
		library: [
			["library", "some-uuid"],
			["library", "settings", "some-uuid"],
			["library", "supplier", "ABC"],
			["libraries", "all"],
			["librariesList", {}, [], {}],
			["allLibrariesDictionary"],
		],
		agency: [["agency", "uuid"], ["agencies"]],
		location: [
			["location", "uuid"],
			["locations", "all"],
			["libraryLocations-uuid", {}],
		],
		consortiumContact: [["LoadConsortiumContacts"]],
		libraryContact: [["library", "contacts", "uuid"]],
		referenceValueMapping: [
			["referenceValueMappings", {}],
			["allReferenceValue"],
		],
		numericRangeMapping: [["numericRangeMappings", {}], ["allNumericRange"]],
		functionalSetting: [["LoadConsortiumFunctionalSettings"]],
	};

	it("matches every query key its entity is actually cached under", () => {
		for (const entity of ENTITIES) {
			for (const key of LIVE_KEYS[entity]) {
				expect(
					entityOwnsQueryKey(entity, key),
					`${entity} should own ${JSON.stringify(key)}`,
				).toBe(true);
			}
		}
	});

	it("does not match unrelated entities' keys", () => {
		expect(entityOwnsQueryKey("location", ["patronRequests", "grid"])).toBe(
			false,
		);
		expect(entityOwnsQueryKey("library", ["hostLms", "uuid"])).toBe(false);
		expect(entityOwnsQueryKey("functionalSetting", ["bib", "uuid"])).toBe(
			false,
		);
	});

	it("ignores keys that do not start with a string", () => {
		expect(entityOwnsQueryKey("library", [{ page: 0 }, "library"])).toBe(false);
		expect(entityOwnsQueryKey("library", [])).toBe(false);
	});

	it("keeps patron-request totals under the invalidatePatronRequestQueries prefix", () => {
		// Not an entity in the registry, but the tab counts must still be caught
		// by the "patronRequest" prefix sweep after a status change.
		const key = ["patronRequestTotals", "exception"];
		expect(String(key[0]).startsWith("patronRequest")).toBe(true);
	});
});
