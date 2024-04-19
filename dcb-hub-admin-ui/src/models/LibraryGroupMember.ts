import { Group } from "./Group";
import { Library } from "./Library";

export interface LibraryGroupMember {
	id: string;
	library: Library;
	libraryGroup: Group;
}
