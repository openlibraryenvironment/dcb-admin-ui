import { Consortium } from "@models/Consortium";
import { LibraryGroupMember } from "@models/LibraryGroupMember";

export function findConsortium(
	members: LibraryGroupMember[],
): Consortium | null {
	const member = members?.find(
		(member) => member?.libraryGroup?.type === "CONSORTIUM",
	);

	// If a library group of type 'Consortium' is found, return its consortium object
	return member ? member?.libraryGroup?.consortium : null;
}
