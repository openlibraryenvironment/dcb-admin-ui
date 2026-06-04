// Types of data grid where users cannot click through to a details page
export const nonClickableTypes = [
	"referenceValueMappings",
	"numericRangeMappings",
	"alarms",
	"SharedIndexSearchGrid",
];

// Types of data grid where users can click through to a details page,
// but where special redirection is needed to get the correct URL
export const specialRedirectionTypes = ["dataChangeLog", "audits"];

// Types of data grid where we show the actions menu to the user.
export const actionsTypes = [
	"locations",
	"referenceValueMappings",
	"numericRangeMappings",
];

export const expandedFilterPanelTypes = ["patronRequests"];
