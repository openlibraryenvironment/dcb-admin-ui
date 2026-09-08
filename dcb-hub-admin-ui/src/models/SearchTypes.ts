export enum SearchField {
	Keyword = "keyword",
	Title = "title",
	Author = "author",
	ISSN = "issn",
	ISBN = "isbn",
	Subject = "subject",
	Language = "language",
	Publisher = "publisher",
	Format = "format",
	PublicationYear = "publicationYear",
	Library = "library",
	ClusterRecordID = "clusterRecordId",
}

export enum BooleanOperator {
	AND = "AND",
	OR = "OR",
	NOT = "NOT",
}

export interface SearchFilter {
	id: string;
	field: SearchField;
	value: string;
	operator?: BooleanOperator;
}

export interface FilterState {
	filters: SearchFilter[];
}
