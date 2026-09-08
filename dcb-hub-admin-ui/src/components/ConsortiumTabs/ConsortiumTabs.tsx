import { useTranslation } from "react-i18next";
import { Tabs } from "@mui/material";

import { TabLink } from "@components/TabLink/TabLink";
import { isConsortiumBrandingEnabled } from "@helpers/featureFlags";

/**
 * The Consortium tab bar, in one place - W-12.
 *
 * It was copy-pasted into four route files, each with its own hardcoded path list AND its
 * own hardcoded active index, so adding a tab meant getting five indices right in five
 * files. Selection is by PATH now, and each tab is a real link - see docs/accessibility.md
 * for what that does and does not buy.
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
	{ path: "/consortium/environment", labelKey: "nav.consortium.environment" },
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
	| "environment"
	| "onboarding"
	| "contacts"
	| "branding"
	| "setup";

const PATH_BY_ID: Record<ConsortiumTabId, string> = {
	profile: "/consortium",
	functionalSettings: "/consortium/functionalSettings",
	environment: "/consortium/environment",
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

	return (
		// NO `onChange`. Each tab is an anchor and the router handles its own click, so an
		// onChange calling router.navigate as well would run a second navigation for every
		// selection.
		<Tabs
			value={PATH_BY_ID[current]}
			variant="scrollable"
			aria-label={t("nav.consortium.name")}
			sx={{ mb: 3 }}
		>
			{visibleTabs().map((tab) => (
				<TabLink
					key={tab.path}
					value={tab.path}
					to={tab.path}
					label={t(tab.labelKey)}
				/>
			))}
		</Tabs>
	);
}
