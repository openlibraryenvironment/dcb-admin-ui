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
	// Patron-facing brand (N-1B), rendered by the discovery app rather than by this one.
	// Nullable everywhere: a consortium that has set none is complete, not unfinished.
	brandLogoUrl?: string | null;
	brandLogoAlt?: string | null;
	patronWelcome?: string | null;
	// A name from the DISCOVERY app's theme registry — unrelated to this app's themes.
	defaultThemeName?: string | null;
	contacts: [Person];
	functionalSettings: [FunctionalSetting];
}
