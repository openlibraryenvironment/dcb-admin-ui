import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";
import { Tab, Tabs } from "@mui/material";

import { handleTabChange } from "@helpers/navigation/handleTabChange";
import { isConsortiumBrandingEnabled } from "@helpers/featureFlags";

/**
 * The Consortium tab bar, in one place — W-12.
 *
 * <h2>Why this component now exists</h2>
 *
 * This bar was copy-pasted into four route files (`consortium/index.tsx`,
 * `functionalSettings.tsx`, `onboarding.tsx`, `contacts.tsx`), each with its own hardcoded
 * array of destination paths AND its own hardcoded active index. Adding a fifth tab meant
 * editing the same list five times and getting five indices right; that is not a thing
 * that stays correct.
 *
 * It also fixes two defects the copies shared:
 *
 *  - **The tabs were not links.** `value` was an index and `onChange` navigated, so a tab
 *    could not be opened in a new tab, was not announced as a link, and did not appear in
 *    a screen reader's link list. Selection is by PATH now, which the group, library and
 *    patron-request tab bars already do through `handleTabChange`.
 *  - **No accessible name.** A bare `<Tabs>` announces as an unnamed tab list; with three
 *    other tab bars in this application that says nothing about which one it is.
 */
interface ConsortiumTab {
	path: string;
	labelKey: string;
	/** Absent means always shown. */
	enabled?: () => boolean;
}

const TABS: ReadonlyArray<ConsortiumTab> = [
	{ path: "/consortium", labelKey: "nav.consortium.profile" },
	{
		path: "/consortium/functionalSettings",
		labelKey: "nav.consortium.functionalSettings",
	},
	{ path: "/consortium/onboarding", labelKey: "nav.consortium.onboarding" },
	{ path: "/consortium/contacts", labelKey: "nav.consortium.contacts" },
	// Branding is its own tab rather than a block at the foot of the profile. It is five
	// fields and a theme choice, and it answers a different question - what PATRONS see -
	// from everything else on the record.
	//
	// Hidden before dcb-service 9.0.0, which has none of the columns it edits. Hiding a
	// tab is UX, not a control: the route's own beforeLoad is what stops a typed URL.
	{
		path: "/consortium/branding",
		labelKey: "nav.consortium.branding",
		enabled: isConsortiumBrandingEnabled,
	},
	// Setup stays reachable after it is finished: it is also how appearance, discovery
	// branding and functional settings are revisited, and a flow that vanishes the moment
	// it succeeds is a flow nobody can correct.
	{ path: "/setup", labelKey: "nav.consortium.setup" },
];

/**
 * Evaluated per render, not once at module scope: the flags are read from
 * window.__APP_ENV__, which application.tsx populates only after this module has been
 * imported, so a list filtered at module scope would hide every gated tab everywhere.
 */
const visibleTabs = (): ReadonlyArray<ConsortiumTab> =>
	TABS.filter((tab) => tab.enabled?.() ?? true);

export type ConsortiumTabId =
	| "profile"
	| "functionalSettings"
	| "onboarding"
	| "contacts"
	| "branding"
	| "setup";

const PATH_BY_ID: Record<ConsortiumTabId, string> = {
	profile: "/consortium",
	functionalSettings: "/consortium/functionalSettings",
	onboarding: "/consortium/onboarding",
	contacts: "/consortium/contacts",
	branding: "/consortium/branding",
	setup: "/setup",
};

interface ConsortiumTabsProps {
	/** Which page is being shown. Named, not numbered - see the note above. */
	current: ConsortiumTabId;
}

export default function ConsortiumTabs({ current }: ConsortiumTabsProps) {
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<Tabs
			value={PATH_BY_ID[current]}
			onChange={(_event, newValue) => handleTabChange({ newValue, router })}
			variant="scrollable"
			aria-label={t("nav.consortium.name")}
			sx={{ mb: 3 }}
		>
			{visibleTabs().map((tab) => (
				<Tab key={tab.path} value={tab.path} label={t(tab.labelKey)} />
			))}
		</Tabs>
	);
}
