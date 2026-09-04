import type { ConsortiumSetupStepId } from "@helpers/consortiumSetup";

/**
 * What each chapter is called and what it asks — W-4.
 *
 * The wording is the feature. Setup is a conversation, so every chapter is a question
 * somebody would actually ask out loud ("tell us about your consortium"), not the name of
 * the table it writes to ("consortium entity"). Kept in one place because the rail, the
 * heading, the announcement, the banner and the finish screen all name the same chapter
 * and must name it identically.
 */
export interface SetupChapterCopy {
	/** Short label, for the progress rail and the finish list. */
	labelKey: string;
	/** The question, as the page heading. */
	titleKey: string;
	/** One sentence under it saying why we are asking. */
	subtitleKey: string;
}

export const SETUP_CHAPTERS: Record<ConsortiumSetupStepId, SetupChapterCopy> = {
	appearance: {
		labelKey: "setup.chapters.appearance.label",
		titleKey: "setup.chapters.appearance.title",
		subtitleKey: "setup.chapters.appearance.subtitle",
	},
	consortium: {
		labelKey: "setup.chapters.consortium.label",
		titleKey: "setup.chapters.consortium.title",
		subtitleKey: "setup.chapters.consortium.subtitle",
	},
	howItWorks: {
		labelKey: "setup.chapters.howItWorks.label",
		titleKey: "setup.chapters.howItWorks.title",
		subtitleKey: "setup.chapters.howItWorks.subtitle",
	},
	contacts: {
		labelKey: "setup.chapters.contacts.label",
		titleKey: "setup.chapters.contacts.title",
		subtitleKey: "setup.chapters.contacts.subtitle",
	},
	discovery: {
		labelKey: "setup.chapters.discovery.label",
		titleKey: "setup.chapters.discovery.title",
		subtitleKey: "setup.chapters.discovery.subtitle",
	},
	libraries: {
		labelKey: "setup.chapters.libraries.label",
		titleKey: "setup.chapters.libraries.title",
		subtitleKey: "setup.chapters.libraries.subtitle",
	},
};
