import type { GraphQLClient } from "graphql-request";
import type { GridFilterModel } from "@mui/x-data-grid-premium";

import { getAgencies } from "@queries/getAgencies";
import { getAlarms } from "@queries/getAlarms";
import { getAudits } from "@queries/getAudits";
import { getBibs } from "@queries/getBibs";
import { getDataChangeLog } from "@queries/getDataChangeLog";
import { getHostLms } from "@queries/getHostLms";
import { getLibraries } from "@queries/getLibraries";
import { getLibraryGroups } from "@queries/getLibraryGroups";
import { getLocations } from "@queries/getLocations";
import { getMappings } from "@queries/getMappings";
import { getNumericRangeMappings } from "@queries/getNumericRangeMappings";
import {
	agenciesView,
	alarmsView,
	auditExplorerView,
	dataChangeLogView,
	groupsView,
	hostLmssView,
	librariesView,
	locationsView,
	numericRangeMappingsView,
	referenceValueMappingsView,
	sourceBibsView,
} from "@constants/dataGrid/gridViews";
import { serverGridQuery, type GridQueryModels } from "./serverGrid";

// Each list's page query, for its route's loader and its grid alike. Here rather than in the
// route file: a binding a route's options and its component share is split into a chunk of its
// own, with its own preload list (docs/url-view-state.md, "Adding a grid").

type Client = GraphQLClient;

export const agenciesQuery = (gqlClient: Client, models: GridQueryModels) =>
	serverGridQuery(gqlClient, {
		root: "agencies",
		gridId: agenciesView.id,
		document: getAgencies,
		defaultOrder: "name",
		defaultPageSize: agenciesView.defaultPageSize,
		...models,
	});

export const hostLmssQuery = (gqlClient: Client, models: GridQueryModels) =>
	serverGridQuery(gqlClient, {
		root: "hostlmss",
		gridId: hostLmssView.id,
		// Called here, not at module load: the flag that adds lastPing is read at call time
		document: getHostLms(),
		defaultOrder: "name",
		defaultPageSize: hostLmssView.defaultPageSize,
		...models,
	});

export const groupsQuery = (gqlClient: Client, models: GridQueryModels) =>
	serverGridQuery(gqlClient, {
		root: "groups",
		gridId: groupsView.id,
		document: getLibraryGroups,
		defaultOrder: "name",
		defaultPageSize: groupsView.defaultPageSize,
		...models,
	});

export const sourceBibsQuery = (gqlClient: Client, models: GridQueryModels) =>
	serverGridQuery(gqlClient, {
		root: "sourceBibs",
		gridId: sourceBibsView.id,
		document: getBibs,
		defaultOrder: "dateCreated",
		defaultPageSize: sourceBibsView.defaultPageSize,
		...models,
	});

export const librariesQuery = (gqlClient: Client, models: GridQueryModels) =>
	serverGridQuery(gqlClient, {
		root: "librariesList",
		gridId: librariesView.id,
		document: getLibraries,
		defaultOrder: "abbreviatedName",
		defaultPageSize: librariesView.defaultPageSize,
		...models,
	});

export const locationsQuery = (gqlClient: Client, models: GridQueryModels) =>
	serverGridQuery(gqlClient, {
		root: "locations",
		gridId: locationsView.id,
		document: getLocations,
		defaultOrder: "lastImported",
		defaultPageSize: locationsView.defaultPageSize,
		...models,
	});

/** `baseQuery` narrows to one Host LMS's alarms, from a link that names it. */
export const alarmsQuery = (
	gqlClient: Client,
	models: GridQueryModels,
	baseQuery = "",
) =>
	serverGridQuery(gqlClient, {
		root: "alarms",
		gridId: alarmsView.id,
		document: getAlarms,
		defaultOrder: "created",
		defaultPageSize: alarmsView.defaultPageSize,
		baseQuery,
		...models,
	});

export const dataChangeLogQuery = (
	gqlClient: Client,
	models: GridQueryModels,
) =>
	serverGridQuery(gqlClient, {
		root: "dataChangeLog",
		gridId: dataChangeLogView.id,
		document: getDataChangeLog,
		defaultOrder: "timestampLogged",
		defaultPageSize: dataChangeLogView.defaultPageSize,
		...models,
	});

export const NUMERIC_RANGE_MAPPINGS_BASE_QUERY =
	"(domain: * AND NOT deleted:true)";

// The mapping lists' roots are their grid ids, which match the mapping entities' key prefixes
// and which the pages' own imports invalidate
export const numericRangeMappingsQuery = (
	gqlClient: Client,
	models: GridQueryModels,
) =>
	serverGridQuery(gqlClient, {
		root: numericRangeMappingsView.id,
		gridId: numericRangeMappingsView.id,
		document: getNumericRangeMappings,
		baseQuery: NUMERIC_RANGE_MAPPINGS_BASE_QUERY,
		defaultOrder: "lastImported",
		defaultPageSize: numericRangeMappingsView.defaultPageSize,
		...models,
	});

export const REFERENCE_VALUE_MAPPINGS_BASE_QUERY =
	"(fromContext: * AND NOT deleted:true)";

export const referenceValueMappingsQuery = (
	gqlClient: Client,
	models: GridQueryModels,
) =>
	serverGridQuery(gqlClient, {
		root: referenceValueMappingsView.id,
		gridId: referenceValueMappingsView.id,
		document: getMappings,
		baseQuery: REFERENCE_VALUE_MAPPINGS_BASE_QUERY,
		defaultOrder: "lastImported",
		defaultPageSize: referenceValueMappingsView.defaultPageSize,
		...models,
	});

export const AUDIT_SEARCH_MAX = 256;

/** The audit explorer's description search, which is not one of the grid's filters: it has its own box. */
export const auditSearchTerm = (search: Record<string, unknown>) =>
	typeof search.search === "string" && search.search.trim() !== ""
		? search.search.trim().slice(0, AUDIT_SEARCH_MAX)
		: undefined;

/** The grid's filters and the page's description search, as the server is asked. */
export const withAuditDescription = (
	filterModel: GridFilterModel,
	term: string | undefined,
): GridFilterModel =>
	term
		? {
				...filterModel,
				items: [
					...filterModel.items,
					{
						id: "audit-description-search",
						field: "briefDescription",
						operator: "contains",
						value: term,
					},
				],
			}
		: filterModel;

export const auditsQuery = (
	gqlClient: Client,
	models: GridQueryModels,
	term: string | undefined,
) =>
	serverGridQuery(gqlClient, {
		root: "auditExplorer",
		gridId: auditExplorerView.id,
		document: getAudits,
		defaultOrder: "auditDate",
		defaultPageSize: auditExplorerView.defaultPageSize,
		quickFilterFields: ["briefDescription"],
		...models,
		filterModel: withAuditDescription(models.filterModel, term),
	});
