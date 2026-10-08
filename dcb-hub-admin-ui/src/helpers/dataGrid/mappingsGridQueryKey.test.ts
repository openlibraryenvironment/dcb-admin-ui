import { describe, expect, it } from "vitest";

import { entityOwnsQueryKey } from "@constants/entityRegistry";
import { mappingsGridQueryKey } from "./mappingsGridQueryKey";
import { contactEntity } from "../contactEntity";

/**
 * The grid ids the per-library mapping routes actually pass to MappingsGrid, which is
 * where this went wrong: none of them starts with any prefix the registry holds.
 */
const LIBRARY_GRID_IDS = {
	referenceValueMapping: [
		"allMappingsPrimary-lib",
		"allMappingsLibrary-lib",
		"refMappingsItemTypePrimary-lib",
		"refMappingsItemTypeSecondary-lib",
		"refMappingsLocationPrimary-lib",
		"refMappingsLocationSecondary-lib",
		"refMappingsPatronTypePrimary-lib",
		"refMappingsPatronTypeSecondary-lib",
	],
	numericRangeMapping: [
		"numMappingsAllPrimary-lib",
		"numMappingsAllSecondary-lib",
		"numMappingsItemTypePrimary-lib",
		"numMappingsItemTypeSecondary-lib",
		"numMappingsPatronTypePrimary-lib",
		"numMappingsPatronTypeSecondary-lib",
	],
} as const;

const variant = ["ALPHA-HOST", "fromCategory:ITEM_TYPE", {}, [], {}] as const;

describe("mappingsGridQueryKey", () => {
	it("roots the key on the entity, so edit and delete reach every library grid", () => {
		for (const [entity, gridIds] of Object.entries(LIBRARY_GRID_IDS)) {
			for (const gridId of gridIds) {
				const key = mappingsGridQueryKey(
					entity as keyof typeof LIBRARY_GRID_IDS,
					gridId,
					...variant,
				);
				expect(
					entityOwnsQueryKey(entity as keyof typeof LIBRARY_GRID_IDS, key),
					`${entity} must own ${gridId}`,
				).toBe(true);
			}
		}
	});

	it("keeps the grid id, so two grids on one page stay separate caches", () => {
		const [a, b] = LIBRARY_GRID_IDS.referenceValueMapping;
		expect(
			mappingsGridQueryKey("referenceValueMapping", a, ...variant),
		).not.toEqual(mappingsGridQueryKey("referenceValueMapping", b, ...variant));
	});

	it("is the fix: a key rooted on the grid id is owned by nothing", () => {
		// What every one of these grids used to send. useEntityMutation's predicate reads
		// queryKey[0], so the row kept its old value until the page was reloaded.
		for (const gridId of LIBRARY_GRID_IDS.referenceValueMapping) {
			expect(
				entityOwnsQueryKey("referenceValueMapping", [gridId, ...variant]),
			).toBe(false);
		}
	});

	it("does not leak across the two mapping kinds", () => {
		const key = mappingsGridQueryKey(
			"referenceValueMapping",
			"refMappingsItemTypePrimary-lib",
			...variant,
		);
		expect(entityOwnsQueryKey("numericRangeMapping", key)).toBe(false);
	});
});

describe("contactEntity", () => {
	it("picks an entity that owns the key each contacts grid actually uses", () => {
		expect(
			entityOwnsQueryKey(contactEntity("Consortium"), [
				"LoadConsortiumContacts",
			]),
		).toBe(true);
		expect(
			entityOwnsQueryKey(contactEntity("Library"), [
				"library",
				"contacts",
				"lib",
			]),
		).toBe(true);
	});

	it("is the fix: the document names it used before are owned by nothing", () => {
		expect(
			entityOwnsQueryKey(contactEntity("Consortium"), ["getConsortiaContacts"]),
		).toBe(false);
		expect(
			entityOwnsQueryKey(contactEntity("Library"), ["getLibraryContacts"]),
		).toBe(false);
	});
});
