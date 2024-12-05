import { FunctionalSetting } from "./FunctionalSetting";
import { Group } from "./Group";
import { Person } from "./Person";

export interface Consortium {
	id: string;
	name: string;
	libraryGroup: Group;
	dateOfLaunch: string;
	headerImageUrl: string;
	headerImageUploader: string;
	headerImageUploaderEmail: string;
	aboutImageUrl: string;
	aboutImageUploader: string;
	aboutImageUploaderEmail: string;
	description: string;
	catalogueSearchUrl: string;
	websiteUrl: string;
	displayName: string;
	contacts: [Person];
	functionalSettings: [FunctionalSetting];
}
