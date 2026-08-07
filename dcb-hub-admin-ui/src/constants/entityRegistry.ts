import { updateLibraryMutation } from "@mutations/updateLibrary";
import { updateAgencyQuery } from "@mutations/updateAgency";
import { deleteLibraryMutation } from "@mutations/deleteLibrary";
import { updateLocationQuery } from "@mutations/updateLocation";
import { deleteLocationQuery } from "@mutations/deleteLocation";
import { updatePerson } from "@mutations/updatePerson";
import { deleteConsortiumContact } from "@mutations/deleteConsortiumContact";
import { deleteLibraryContact } from "@mutations/deleteLibraryContact";
import { updateReferenceValueMapping } from "@mutations/updateReferenceValueMapping";
import { deleteReferenceValueMapping } from "@mutations/deleteReferenceValueMapping";
import { updateNumericRangeMapping } from "@mutations/updateNumericRangeMapping";
import { deleteNumericRangeMapping } from "@mutations/deleteNumericRangeMapping";
import { updateFunctionalSettingQuery } from "@mutations/updateFunctionalSetting";

/**
 * Extra identifiers a delete needs beyond the entity's own id. Contacts are
 * deleted from their owner (a person can be a contact of several), so the
 * owner's id has to travel with the request.
 */
export interface DeleteContext {
	ownerId?: string;
}

export interface EntityDefinition {
	/** GraphQL document for an update. Omit for read-only entities. */
	updateMutation?: string;
	/** GraphQL document for a delete. Omit for entities that cannot be deleted. */
	deleteMutation?: string;
	/**
	 * Field the update response is nested under. Needed because the grid has to
	 * resolve `processRowUpdate` with the persisted row, not the optimistic one.
	 */
	updateOperation?: string;
	/**
	 * Field the delete response is nested under - NOT always the mutation name.
	 * `deleteConsortiumContact` resolves to `deleteContact`, and reading the
	 * wrong field silently treats a server-side failure as a success.
	 */
	deleteOperation?: string;
	/**
	 * Builds the update input's identifying fields. Agencies are keyed on
	 * `code`, everything else on `id`; this is the only place that difference
	 * is allowed to exist.
	 */
	buildUpdateId: (id: string) => Record<string, unknown>;
	/** Builds the delete input's identifying fields. */
	buildDeleteId: (
		id: string,
		context: DeleteContext,
	) => Record<string, unknown>;
	/**
	 * Last chance to reshape changed fields before they become the update input.
	 * Grids edit what they display, which is not always what the mutation takes -
	 * a contact's role renders as an object but updates by name.
	 */
	normaliseUpdateFields?: (
		fields: Record<string, unknown>,
	) => Record<string, unknown>;
	/**
	 * Query-key roots this entity appears under. Every cached query whose first
	 * key element starts with one of these is invalidated after a successful
	 * mutation. Prefixes rather than whole keys because grids key on
	 * `${gridId}-${libraryId}` and details pages on `[entity, id]` - an
	 * enumerated list goes stale the moment someone adds a grid, which is how
	 * deletes ended up not refreshing anything at all.
	 */
	keyPrefixes: string[];
	/** i18next key for the entity noun, used in confirmation and alert text. */
	nameKey: string;
}

export type EntityKey =
	| "library"
	| "agency"
	| "location"
	| "consortiumContact"
	| "libraryContact"
	| "referenceValueMapping"
	| "numericRangeMapping"
	| "functionalSetting";

/**
 * Does a cached query belong to this entity, and so need invalidating after it
 * is mutated? Lives here rather than inside the hook so the rule can be tested
 * without rendering anything - it is the single most consequential decision in
 * the mutation path, and the previous code got it wrong by not making it at all.
 */
export const entityOwnsQueryKey = (
	entity: EntityKey,
	queryKey: readonly unknown[],
): boolean => {
	const root = queryKey[0];
	return (
		typeof root === "string" &&
		ENTITY_REGISTRY[entity].keyPrefixes.some((prefix) =>
			root.startsWith(prefix),
		)
	);
};

const byId = (id: string) => ({ id });

/**
 * The contacts grids render `role` as the role object (for its displayName) but
 * `updatePerson` takes the role's name. Both contact entities share it.
 */
const contactUpdateFields = (fields: Record<string, unknown>) =>
	"role" in fields
		? { ...fields, role: (fields.role as { name?: string })?.name }
		: fields;

export const ENTITY_REGISTRY: Record<EntityKey, EntityDefinition> = {
	library: {
		updateMutation: updateLibraryMutation,
		deleteMutation: deleteLibraryMutation,
		updateOperation: "updateLibrary",
		deleteOperation: "deleteLibrary",
		buildUpdateId: byId,
		buildDeleteId: byId,
		// "libraries" covers the consolidated dropdown cache and the main grid;
		// the rest are the legacy per-consumer keys that have not been folded in.
		keyPrefixes: [
			"library",
			"libraries",
			"allLibrariesDictionary",
			"LoadLibraries",
			"insights-scope-libraries",
		],
		nameKey: "libraries.library",
	},
	// Agencies are the one entity keyed on `code` rather than `id`. That used to
	// be a `mutationName === "updateAgency"` ternary buried in the shared save
	// helper; it lives here, as data, so the next such entity is a line not a
	// branch. Agencies are edited through their library, never deleted.
	agency: {
		updateMutation: updateAgencyQuery,
		updateOperation: "updateAgency",
		buildUpdateId: (code) => ({ code }),
		buildDeleteId: (code) => ({ code }),
		keyPrefixes: ["agency", "agencies", "library", "libraries"],
		nameKey: "agencies.agencies_one",
	},
	location: {
		updateMutation: updateLocationQuery,
		deleteMutation: deleteLocationQuery,
		updateOperation: "updateLocation",
		deleteOperation: "deleteLocation",
		buildUpdateId: byId,
		buildDeleteId: byId,
		keyPrefixes: [
			"location",
			"locations",
			"libraryLocations",
			"allLocationsDictionary",
			"LoadLocations",
		],
		nameKey: "locations.location_one",
	},
	consortiumContact: {
		updateMutation: updatePerson,
		deleteMutation: deleteConsortiumContact,
		updateOperation: "updatePerson",
		deleteOperation: "deleteContact",
		buildUpdateId: byId,
		buildDeleteId: (id, { ownerId }) => ({
			personId: id,
			consortiumId: ownerId,
		}),
		normaliseUpdateFields: contactUpdateFields,
		keyPrefixes: ["LoadConsortiumContacts", "consortium"],
		nameKey: "libraries.contacts.one",
	},
	libraryContact: {
		updateMutation: updatePerson,
		deleteMutation: deleteLibraryContact,
		updateOperation: "updatePerson",
		deleteOperation: "deleteLibraryContact",
		buildUpdateId: byId,
		buildDeleteId: (id, { ownerId }) => ({ personId: id, libraryId: ownerId }),
		normaliseUpdateFields: contactUpdateFields,
		keyPrefixes: ["library", "libraries"],
		nameKey: "libraries.contacts.one",
	},
	referenceValueMapping: {
		updateMutation: updateReferenceValueMapping,
		deleteMutation: deleteReferenceValueMapping,
		updateOperation: "updateReferenceValueMapping",
		deleteOperation: "deleteReferenceValueMapping",
		buildUpdateId: byId,
		buildDeleteId: byId,
		keyPrefixes: ["referenceValueMapping", "allReferenceValue", "mappings"],
		nameKey: "mappings.ref_value_one",
	},
	numericRangeMapping: {
		updateMutation: updateNumericRangeMapping,
		deleteMutation: deleteNumericRangeMapping,
		updateOperation: "updateNumericRangeMapping",
		deleteOperation: "deleteNumericRangeMapping",
		buildUpdateId: byId,
		buildDeleteId: byId,
		keyPrefixes: ["numericRangeMapping", "allNumericRange", "mappings"],
		nameKey: "mappings.num_range_one",
	},
	// Functional settings are created and toggled, never deleted - hence no
	// deleteMutation, which is what makes the actions column drop the button.
	functionalSetting: {
		updateMutation: updateFunctionalSettingQuery,
		updateOperation: "updateFunctionalSetting",
		buildUpdateId: byId,
		buildDeleteId: byId,
		keyPrefixes: ["LoadConsortiumFunctionalSettings", "consortium"],
		nameKey: "consortium.settings.one",
	},
};
