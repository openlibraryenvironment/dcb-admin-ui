/**
 * Every grid type in the app, and the closed union DataGrid's `type` prop takes.
 *
 * Closed because `type` decides where a whole-row click goes: a new grid does not
 * compile until it is named here AND classified below - non-clickable, redirected,
 * or left to the `/<type>/<id>` default, which navigationTargets.test.ts resolves
 * against the real route tree.
 */
export const DATA_GRID_TYPES = [
	"ClusterExplainer",
	"Identifiers",
	"Items",
	"agencies",
	"alarms",
	"audits",
	"bibs",
	"catalogMetricsByHostLms",
	"clusterMembers",
	"consortiumContact",
	"consortiumDetails",
	"consortiumFunctionalSettings",
	"contact",
	"dataChangeLog",
	"environmentInfo",
	"errorCleanupRequests",
	"errorOverviewPatronRequests",
	"groups",
	"hostlmss",
	"libraries",
	"libraryLocations",
	"libraryUser",
	"locations",
	"numericRangeMappings",
	"patronRequests",
	"patronRequestsRecordHistory",
	"referenceValueMappings",
	"refusedCleanupRequests",
	"requestErrors",
	"searchInstances",
	"skippedCleanupRequests",
	"successCleanupRequests",
	"versionInfo",
	"welcomeLibraries",
] as const;

export type DataGridType = (typeof DATA_GRID_TYPES)[number];

// Types of data grid where users cannot click through to a details page
// (the search grid instead navigates via per-cell Links to cluster/items/
// identifiers, so a whole-row click must not hijack to /searchInstances/<id>).
export const nonClickableTypes: readonly DataGridType[] = [
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
	// Service Status grids describe this deployment; their rows expand, they do not route.
	"environmentInfo",
	"versionInfo",
	// Onboarding stages on the home page: every cell is an external doc link.
	"consortiumDetails",
	// Library accounts are created and edited through dialogs; there is no user page.
	"libraryUser",
	// Ingest metrics per source system. Informational, and the row id is a source
	// system id rather than a Host LMS id, so it addresses no page in this app.
	"catalogMetricsByHostLms",
	// Both error-overview grids navigate through per-cell Links - the description to
	// the drill-down, the request id and audit url to their own pages - so a
	// whole-row click has nothing left to do.
	"requestErrors",
	"errorOverviewPatronRequests",
];

/**
 * Grid types whose row click goes somewhere other than `/<type>/<id>`, and where.
 *
 * A map rather than the if/else chain this replaces: that chain ended in an `else`
 * sending every unmatched type to `/patronRequests/<id>`, so a type listed as
 * needing redirection but given no branch silently routed to patron requests. That
 * is how a library's locations grid came to open `/patronRequests/<locationId>`.
 */
export const rowClickRedirects: Partial<
	Record<DataGridType, (rowId: string) => string>
> = {
	dataChangeLog: (id) => `/serviceInfo/dataChangeLog/${id}`,
	welcomeLibraries: (id) => `/libraries/${id}`,
	audits: (id) => `/patronRequests/audits/${id}`,
	// A cluster member's id IS its source bib id (see getClusters `members`).
	clusterMembers: (id) => `/bibs/${id}`,
	// A library's locations grid lists locations; their detail page is top-level.
	libraryLocations: (id) => `/locations/${id}`,
	// A requesting-history entry and a cleanup or rollback outcome are each a row OF
	// a patron request, so each opens that request.
	patronRequestsRecordHistory: (id) => `/patronRequests/${id}`,
	successCleanupRequests: (id) => `/patronRequests/${id}`,
	errorCleanupRequests: (id) => `/patronRequests/${id}`,
	refusedCleanupRequests: (id) => `/patronRequests/${id}`,
	skippedCleanupRequests: (id) => `/patronRequests/${id}`,
};
