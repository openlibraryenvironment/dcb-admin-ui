import { LibraryGroupMember } from "./LibraryGroupMember";
import { Consortium } from "./Consortium";
export interface Group {
	id: string;
	code: string;
	name: string;
	type: string;
	members: LibraryGroupMember[];
	consortium: Consortium | null;
}
