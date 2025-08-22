import { SearchField } from "@models/SearchField";

// Search field prefixes for providing shared index search via dcb-locate
export const searchFieldPrefixes: Record<SearchField, string> = {
	[SearchField.Keyword]: "@keyword all",
	[SearchField.Title]: "title all",
	[SearchField.Author]: "contributors all",
	[SearchField.ISSN]: "issn=",
	[SearchField.ISBN]: "isbn=",
	[SearchField.Subject]: "subject=",
	[SearchField.Language]: "languages=",
};
