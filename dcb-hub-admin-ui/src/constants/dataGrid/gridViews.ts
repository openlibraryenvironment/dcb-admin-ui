import type { GridSortModel } from "@mui/x-data-grid-premium";

import { defaultPatronRequestColumnVisibility } from "@columns/columnVisibility/defaultPatronRequestColumnVisibility";
import { exceptionPatronRequestColumnVisibility } from "@columns/columnVisibility/exceptionPatronRequestColumnVisibility";
import { finishedPatronRequestColumnVisibility } from "@columns/columnVisibility/finishedPatronRequestColumnVisibility";
import { bibColumnVisibility } from "@columns/columnVisibility/bibColumnVisbility";
import { defaultLibraryColumnVisibility } from "@columns/columnVisibility/defaultLibraryColumnVisibility";
import { defaultPatronRequestLibraryColumnVisibility } from "@columns/columnVisibility/defaultPatronRequestLibraryColumnVisibility";
import { defaultSupplierRequestColumnVisibility } from "@columns/columnVisibility/defaultSupplierRequestColumnVisibility";
import { defaultPatronRequestGroupVisibility } from "@columns/columnVisibility/defaultPatronRequestGroupVisibility";
import { libraryBibColumnVisibility } from "@columns/columnVisibility/libraryBibColumnVisibility";
import { defaultClusterExplanationVisibility } from "@columns/columnVisibility/defaultClusterExplanationVisibility";
import { defaultWelcomeLibraryColumnVisibility } from "@columns/columnVisibility/defaultWelcomeLibraryColumnVisibility";
import {
	MAX_DEFAULT_PAGE_SIZE,
	PAGE_SIZE_OPTIONS,
} from "@constants/pagination";
import type { GridViewSpec } from "@helpers/viewState/gridView";

// Each grid whose view is in its URL. docs/url-view-state.md, "Adding a grid".

const newestFirst: GridSortModel = [{ field: "dateCreated", sort: "desc" }];

const patronRequestView = (
	id: string,
	defaultColumnVisibility = defaultPatronRequestColumnVisibility,
): GridViewSpec => ({
	id,
	defaultSort: newestFirst,
	defaultPageSize: 20,
	pageSizeOptions: PAGE_SIZE_OPTIONS,
	defaultColumnVisibility,
	remember: true,
});

export const patronRequestsAllView = patronRequestView("patronRequestsAll");
export const patronRequestsExceptionView = patronRequestView(
	"patronRequestsException",
	{
		...defaultPatronRequestColumnVisibility,
		...exceptionPatronRequestColumnVisibility,
	},
);
export const patronRequestsOutOfSequenceView = patronRequestView(
	"patronRequestsOutOfSequence",
);
export const patronRequestsActiveView = patronRequestView(
	"patronRequestsActive",
);
export const patronRequestsCompletedView = patronRequestView(
	"patronRequestsCompleted",
	{
		...defaultPatronRequestColumnVisibility,
		...finishedPatronRequestColumnVisibility,
	},
);

/** A consortium-wide list: remembered, as a working list is. */
const listView = (
	id: string,
	defaultSort: GridSortModel,
	defaultPageSize: number,
	defaultColumnVisibility: GridViewSpec["defaultColumnVisibility"] = {},
): GridViewSpec => ({
	id,
	defaultSort,
	defaultPageSize,
	pageSizeOptions: PAGE_SIZE_OPTIONS,
	defaultColumnVisibility,
	remember: true,
});

const byName: GridSortModel = [{ field: "name", sort: "asc" }];

export const agenciesView = listView("agencies", byName, 10, {
	id: false,
	latitude: false,
	longitude: false,
});
export const hostLmssView = listView("hostlmss", byName, 10, { id: false });
export const groupsView = listView("groups", byName, 10, { id: false });
export const alarmsView = listView(
	"alarms",
	[{ field: "created", sort: "desc" }],
	20,
	{ expires: false },
);
export const dataChangeLogView = listView(
	"dataChangeLog",
	[{ field: "timestampLogged", sort: "desc" }],
	20,
	{ id: false, changes: false, changeReferenceUrl: false },
);
export const sourceBibsView = listView(
	"sourceBibs",
	[],
	25,
	bibColumnVisibility,
);
export const librariesView = listView(
	"librariesList",
	[{ field: "abbreviatedName", sort: "asc" }],
	MAX_DEFAULT_PAGE_SIZE,
	defaultLibraryColumnVisibility,
);
export const locationsView = listView(
	"locations",
	[{ field: "lastImported", sort: "desc" }],
	MAX_DEFAULT_PAGE_SIZE,
	{
		id: false,
		lastImported: false,
		localId: false,
		isEnabledForPickupAnywhere: false,
		agencyCode: false,
	},
);
export const auditExplorerView = listView(
	"auditExplorer",
	[{ field: "auditDate", sort: "desc" }],
	50,
);
export const requestErrorsView = listView(
	"errorOverview",
	[{ field: "total", sort: "desc" }],
	20,
);
/** One error category's requests: in the URL, never remembered, as one record's grids are. */
export const requestErrorRequestsView: GridViewSpec = {
	...listView(
		"errorOverviewPatronRequests",
		[{ field: "Date", sort: "desc" }],
		20,
	),
	remember: false,
};
// Holds every row client-side, so the reader's aggregates total the whole list: in the URL as agg
export const catalogMetricsByHostLmsView: GridViewSpec = {
	...listView("catalogMetricsByHostLms", byName, 20, {
		id: false,
		checkPointId: false,
		sourceSystemId: false,
	}),
	aggregation: true,
};
const lastImportedFirst: GridSortModel = [
	{ field: "lastImported", sort: "desc" },
];
export const referenceValueMappingsView = listView(
	"referenceValueMappings",
	lastImportedFirst,
	20,
	{ lastImported: false, toCategory: false },
);
export const numericRangeMappingsView = listView(
	"numericRangeMappings",
	lastImportedFirst,
	20,
	{ lastImported: false },
);

// A library's or a group's grids: each scoped to its own with scopedView (viewRoute.ts)
export const libraryPatronRequestsAllView = patronRequestView(
	"patronRequestsLibraryAll",
	defaultPatronRequestLibraryColumnVisibility,
);
export const libraryPatronRequestsActiveView = patronRequestView(
	"patronRequestsLibraryActive",
	defaultPatronRequestLibraryColumnVisibility,
);
export const libraryPatronRequestsCompletedView = patronRequestView(
	"patronRequestsLibraryCompleted",
	defaultPatronRequestLibraryColumnVisibility,
);
export const libraryPatronRequestsExceptionView = patronRequestView(
	"patronRequestsLibraryException",
	defaultPatronRequestLibraryColumnVisibility,
);
export const libraryPatronRequestsOutOfSequenceView = patronRequestView(
	"patronRequestsLibraryOutOfSequence",
	defaultPatronRequestLibraryColumnVisibility,
);
export const librarySupplierRequestsAllView = patronRequestView(
	"supplierRequestsLibraryAll",
	defaultSupplierRequestColumnVisibility,
);
export const groupPatronRequestsView = patronRequestView(
	"groupPatronRequests",
	defaultPatronRequestGroupVisibility,
);
export const groupSupplierRequestsView = patronRequestView(
	"groupSupplierRequests",
	defaultPatronRequestGroupVisibility,
);
/** Bibs are not user-sortable, so the view carries filters, page and columns only. */
export const libraryBibsView = listView(
	"libraryBibs",
	[],
	20,
	libraryBibColumnVisibility,
);
export const libraryLocationsView = listView(
	"libraryLocations",
	lastImportedFirst,
	MAX_DEFAULT_PAGE_SIZE,
	{
		id: false,
		lastImported: false,
		agencyCode: false,
		localId: false,
		isEnabledForPickupAnywhere: false,
	},
);

/**
 * A library's mappings for one Host LMS. A library with a second Host LMS shows its mappings in
 * a second grid on the same page, whose parameters carry this namespace.
 */
export const SECOND_HOST_LMS_NAMESPACE = "secondary";

export const mappingsView = (
	id: string,
	defaultColumnVisibility: GridViewSpec["defaultColumnVisibility"],
	secondHostLms = false,
): GridViewSpec => ({
	...listView(
		id,
		[{ field: "lastImported", sort: "asc" }],
		MAX_DEFAULT_PAGE_SIZE,
		defaultColumnVisibility,
	),
	namespace: secondHostLms ? SECOND_HOST_LMS_NAMESPACE : undefined,
});

/** A bare search page is a new search, so the search pager never remembers. */
export const searchResultsView: GridViewSpec = {
	...listView("sharedIndexSearch", [], 25),
	remember: false,
};

/** One record's grids: in the URL, never remembered. */
const recordView = (
	id: string,
	defaultSort: GridSortModel,
	defaultPageSize: number,
	defaultColumnVisibility: GridViewSpec["defaultColumnVisibility"] = {},
	namespace?: string,
): GridViewSpec => ({
	...listView(id, defaultSort, defaultPageSize, defaultColumnVisibility),
	namespace,
	remember: false,
});

// Holds every row client-side, so the reader's aggregates total the whole list: in the URL as agg
export const clusterExplanationView: GridViewSpec = {
	...recordView(
		"ClusterExplainer",
		[{ field: "formattedTimestamp", sort: "desc" }],
		25,
		defaultClusterExplanationVisibility,
	),
	aggregation: true,
};
export const clusterIdentifiersView = recordView(
	"ClusterIdentifiers",
	[{ field: "title", sort: "asc" }],
	25,
);
export const clusterRequestingHistoryView = recordView(
	"patronRequestsRecordHistory",
	newestFirst,
	20,
	defaultPatronRequestColumnVisibility,
);
const soonestAvailable: GridSortModel = [
	{ field: "availabilityDate", sort: "desc" },
];
export const clusterItemsView = recordView(
	"ClusterRecordItems",
	soonestAvailable,
	25,
);
/** The items the standard availability check left out: the page's second grid. */
export const NOT_SHOWN_NAMESPACE = "notShown";
export const clusterItemsNotShownView = recordView(
	"ClusterRecordItemsNotShown",
	soonestAvailable,
	25,
	{},
	NOT_SHOWN_NAMESPACE,
);
/** A request's audit log, on the request's own page: its parameters carry this namespace. */
export const AUDIT_NAMESPACE = "audit";
export const requestAuditView = recordView(
	"audit-log",
	[{ field: "auditDate", sort: "desc" }],
	25,
	{},
	AUDIT_NAMESPACE,
);
/** The libraries list on the home page. A landing page that reopened a stale filter would surprise. */
export const welcomeLibrariesView: GridViewSpec = {
	...listView(
		"welcomeLibraries",
		[{ field: "fullName", sort: "asc" }],
		MAX_DEFAULT_PAGE_SIZE,
		defaultWelcomeLibraryColumnVisibility,
	),
	remember: false,
};

// A library's mapping pages: each shows its Host LMS's mappings, and its second's
export const numericRangeAllMappingViews = {
	hostLms: mappingsView("numMappingsAllPrimary", {
		domain: false,
		lastImported: false,
	}),
	secondHostLms: mappingsView(
		"numMappingsAllSecondary",
		{ domain: false, lastImported: false },
		true,
	),
};
export const numericRangeItemTypeMappingViews = {
	hostLms: mappingsView("numMappingsItemTypePrimary", {
		domain: false,
		lastImported: false,
	}),
	secondHostLms: mappingsView(
		"numMappingsItemTypeSecondary",
		{ domain: false, lastImported: false },
		true,
	),
};
export const numericRangePatronTypeMappingViews = {
	hostLms: mappingsView("numMappingsPatronTypePrimary", {
		domain: false,
		lastImported: false,
	}),
	secondHostLms: mappingsView(
		"numMappingsPatronTypeSecondary",
		{ domain: false, lastImported: false },
		true,
	),
};
export const referenceValueAllMappingViews = {
	hostLms: mappingsView("allMappingsPrimary", {
		fromCategory: false,
		lastImported: false,
		toCategory: false,
	}),
	secondHostLms: mappingsView(
		"allMappingsLibrary",
		{ fromCategory: false, lastImported: false, toCategory: false },
		true,
	),
};
export const referenceValueItemTypeMappingViews = {
	hostLms: mappingsView("refMappingsItemTypePrimary", {
		fromCategory: false,
		lastImported: false,
		toCategory: false,
	}),
	secondHostLms: mappingsView(
		"refMappingsItemTypeSecondary",
		{ fromCategory: false, lastImported: false, toCategory: false },
		true,
	),
};
export const referenceValueLocationMappingViews = {
	hostLms: mappingsView("refMappingsLocationPrimary", {
		fromCategory: false,
		lastImported: false,
		toCategory: false,
	}),
	secondHostLms: mappingsView(
		"refMappingsLocationSecondary",
		{ fromCategory: false, lastImported: false, toCategory: false },
		true,
	),
};
export const referenceValuePatronTypeMappingViews = {
	hostLms: mappingsView("refMappingsPatronTypePrimary", {
		fromCategory: false,
		lastImported: false,
		toCategory: false,
	}),
	secondHostLms: mappingsView(
		"refMappingsPatronTypeSecondary",
		{ fromCategory: false, lastImported: false, toCategory: false },
		true,
	),
};
