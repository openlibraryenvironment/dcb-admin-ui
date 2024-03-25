import { Pageable } from "./Pageable";

export interface AgencyGroupPage {
	data: Data;
}

export interface Data {
	agencyGroups: AgencyGroups;
}

export interface AgencyGroups {
	totalSize: number;
	content: Content[];
	pageable: Pageable;
}

export interface Content {
	id: string;
	code: string;
	name: string;
	members: any[];
}
