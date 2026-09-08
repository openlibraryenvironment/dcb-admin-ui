import { FunctionalSetting } from "./FunctionalSetting";

export interface AutocompleteOption {
	label: string;
	value: string;
	agencyId?: string;
	functionalSettings?: FunctionalSetting[];
	hostLmsCode?: string;
}
