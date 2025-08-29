import { SearchField } from "./SearchField";

export interface SearchCriterion {
	id: string;
	field: SearchField;
	value: string;
	operator: "AND" | "OR" | "NOT";
}
