import { FunctionalSetting } from "./FunctionalSetting";

export interface PatronRequestAutocompleteOption {
	label: string;
	value: string;
	agencyId?: string;
	functionalSettings?: FunctionalSetting[];
	hostLmsCode?: string;
	dueDate?: string;
	agencyName?: string;
}
