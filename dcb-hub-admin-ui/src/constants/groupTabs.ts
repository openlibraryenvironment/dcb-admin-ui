// Single source of truth for the group detail page's tab bar. Each landing page
// passes its own index via `value`; the tab values are full route paths, which
// are also the hrefs - see TabLink for why these are anchors rather than buttons.
//
// Insights is last because it is the one tab that can be hidden: `value` indexes
// this UNFILTERED array while the rendered set is filtered, so a conditional tab
// anywhere but the end would move every page after it onto the wrong tab.
// Asserted in GroupTabs.test.ts.
export const TABS: ReadonlyArray<{ path: string; labelKey: string }> = [
	{ path: "", labelKey: "nav.groups.profile" },
	{ path: "/patronRequests", labelKey: "nav.groups.patronRequests" },
	{ path: "/supplierRequests", labelKey: "nav.groups.supplierRequests" },
	{ path: "/settings", labelKey: "nav.groups.settings" },
	{ path: "/insights", labelKey: "nav.groups.insights" },
];
