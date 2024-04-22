import { LibraryGroupMember } from "./LibraryGroupMember";
import { Consortium } from "./Consortium";
export interface Group {
	id: number;
	code: string;
	name: string;
	type: string;
	members: LibraryGroupMember[];
	consortium: Consortium | null;
}
