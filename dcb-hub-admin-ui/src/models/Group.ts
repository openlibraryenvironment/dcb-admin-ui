import { AgencyGroupMember } from "./AgencyGroupMember";
export interface Group {
	id: number;
	code: string;
	name: string;
	members: AgencyGroupMember[];
}
