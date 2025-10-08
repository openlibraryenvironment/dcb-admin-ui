import { Person } from "../models/Person";

/**
 * Extracts the email addresses of all primary contacts from a list of people.
 * Normally this should just be one person but some libraries don't do it that way.
 *
 * @param contacts - An array of the library's contacts
 * @returns A single string containing the email addresses of all primary contacts,
 * separated by a comma and a space.
 */
export function findPrimaryContacts(contacts: Person[]): string {
	return contacts
		.filter((contact) => contact.isPrimaryContact)
		.map((contact) => contact.email)
		.join(", ");
}
