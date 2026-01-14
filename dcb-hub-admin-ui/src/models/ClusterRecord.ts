import { Bib } from "./Bib";

export interface ClusterRecord {
	id: string;
	title: string;
	selectedBib: string;
	isDeleted: boolean;
	dateCreated: string;
	dateUpdated: string;
	members: [Bib];
}
