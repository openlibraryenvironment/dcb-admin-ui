import { FunctionalSetting } from "./FunctionalSetting";
import { Group } from "./Group";
import { Person } from "./Person";

export interface Consortium {
	id: string;
	name: string;
	libraryGroup: Group;
	dateOfLaunch: string;
	description: string;
	catalogueSearchUrl: string;
	websiteUrl: string;
	// V-11.1. Where a patron reports that discovery itself is wrong — a different
	// destination from websiteUrl, which answers opening hours and joining. Nullable and
	// optional: V9_0_008 is on dcb-service main and in no release, so a deployment on the
	// 9.0.0 tag does not select it at all.
	supportUrl?: string | null;
	displayName: string;
	// The brand (N-1B). ONE set of marks for every DCB app, patron-facing and staff-facing
	// alike: V9_0_004 merged headerImageUrl into brandHeaderIconUrl and aboutImageUrl into
	// brandLogoUrl, and dropped the uploader name/email columns that sat beside them.
	// Nullable everywhere: a consortium that has set none is complete, not unfinished.
	brandLogoUrl?: string | null;
	brandLogoAlt?: string | null;
	// R-17d. A square mark for an app bar and a browser tab, and the canvas behind the
	// discovery app's landing page. Not sizes of the logo: a lockup in a 32px box is
	// unreadable, and a canvas is not a mark at all.
	brandHeaderIconUrl?: string | null;
	brandBackgroundImageUrl?: string | null;
	patronWelcome?: string | null;
	// A name from the DISCOVERY app's theme registry â€” unrelated to this app's themes.
	defaultThemeName?: string | null;
	contacts: [Person];
	functionalSettings: [FunctionalSetting];
}
