import { SearchField } from "@models/SearchField";

// Search field prefixes for providing shared index search via dcb-locate
export const searchFieldPrefixes: Record<SearchField, string> = {
	[SearchField.Keyword]: "@keyword all",
	[SearchField.Title]: "title all",
	[SearchField.Author]: "contributors all",
	[SearchField.ISSN]: "issn=",
	[SearchField.ISBN]: "isbn=",
	[SearchField.Subject]: "subjects=",
	[SearchField.Language]: "languages=",
	[SearchField.Format]: "sourceTypes=",
	[SearchField.PublicationYear]: "publicationYear=",
	[SearchField.Publisher]: "instancePublishers=",
	[SearchField.Library]: "items.effectiveLocationId=",
};
