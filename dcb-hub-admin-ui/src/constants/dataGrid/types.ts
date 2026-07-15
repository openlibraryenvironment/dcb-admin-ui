// Types of data grid where users cannot click through to a details page
// (the search grid instead navigates via per-cell Links to cluster/items/
// identifiers, so a whole-row click must not hijack to /searchInstances/<id>).
export const nonClickableTypes = [
	"referenceValueMappings",
	"numericRangeMappings",
	"alarms",
	"searchInstances",
	// Cluster detail tabs: informational grids with no per-row detail route.
	"ClusterExplainer",
	"Identifiers",
	"Items",
	// Contacts and functional settings have no dedicated detail page; they are
	// edited in place, so a whole-row click must not navigate anywhere.
	"contact",
	"consortiumContact",
	"consortiumFunctionalSettings",
];

// Types of data grid where users can click through to a details page,
// but where special redirection is needed to get the correct URL
export const specialRedirectionTypes = [
	"dataChangeLog",
	"audits",
	"welcomeLibraries",
	"patronRequestsLibraryActive",
	"patronRequestsLibraryOutOfSequence",
	"patronRequestsLibraryCompleted",
	"patronRequestsLibraryException",
	"patronRequestsLibraryAll",
	"patronRequestsActive",
	"patronRequestsOutOfSequence",
	"patronRequestsCompleted",
	"patronRequestsException",
	"dataChangeLog",
	"welcomeLibraries",
	"libraryLocations",
	"supplierRequestsLibrary",
	"patronRequestsGroupAll",
	"supplierRequestsGroupAll",
	"patronRequestsRecordHistory",
	// Cluster members are bib records: a row click opens that bib's detail page.
	"clusterMembers",
];

// Types of data grid where we show the actions menu to the user.
export const actionsTypes = [
	"locations",
	"referenceValueMappings",
	"numericRangeMappings",
];
