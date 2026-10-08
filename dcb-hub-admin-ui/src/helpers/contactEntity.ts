import type { EntityKey } from "@constants/entityRegistry";

/**
 * Which registry entity owns the caches a contact appears in.
 *
 * NewContact invalidated ["getConsortiaContacts"] and ["getLibraryContacts"] - the names
 * of the GraphQL documents, which nothing is cached under - so a new contact never
 * reached either grid. docs/query-error-policy.md, "Keys and invalidation".
 */
export const contactEntity = (entity: string): EntityKey =>
	entity === "Consortium" ? "consortiumContact" : "libraryContact";
