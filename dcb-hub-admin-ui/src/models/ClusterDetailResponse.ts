export interface Subject {
	value: string;
}

export interface Identifier {
	identifierTypeId: string;
	type: string;
	value: string;
}

export interface Contributor {
	name: string;
}

export interface Publication {
	publisher: string;
	dateOfPublication: string;
}

export interface Classification {
	classificationNumber: string;
	classificationTypeId: string;
}

export interface Note {
	instanceNoteTypeId: string;
	note: string;
	staffOnly: boolean;
	labelKey: string;
}

export interface Series {
	value: string;
	authorityId: string;
}

export interface ClusterDetailResponse {
	id: string;
	title: string;
	publicationDate: string;
	publicationYear: bigint;
	identifiers: Identifier[];
	isbns: string[];
	issns: string[];
	subjects: Subject[];
	contributors: Contributor[];
	publication: Publication[];
	sourceTypes: string[];
	physicalDescriptions: string[];
	languages: string[];
	classifications: Classification[];
	notes: Note[];
	editions: string[];
	description: string;
	series: Series[];
}
