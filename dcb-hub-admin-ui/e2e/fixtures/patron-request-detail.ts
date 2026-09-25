import patronRequests from "../fixtures-data/patron-requests.json";

/**
 * The operations the patron request DETAIL page fires, as data rather than as a handler.
 *
 * A plain object because `mockGraphQL` registers ONE route over the graphql endpoint and
 * falls through to `route.continue()` on an operation it does not know. Two registrations
 * over the same pattern therefore do not chain into each other - the later one reaches the
 * network instead - so a spec spreads these into its own single call.
 */

/**
 * PICKUP_TRANSIT, not either ERROR row: ERROR is in `untrackedStatuses`, which disables
 * "Check for updates" outright, so the errored fixtures cannot exercise it at all.
 */
export const TRACKED_REQUEST = patronRequests.patronRequests.content.find(
	(request: { status: string }) => request.status === "PICKUP_TRANSIT",
) as { id: string; status: string; clusterRecord: { title: string } };

const empty = { totalSize: 0, content: [] };

export const patronRequestDetailMocks = {
	LoadPatronRequest: {
		patronRequests: { totalSize: 1, content: [TRACKED_REQUEST] },
	},
	GetAuditsByPatronRequest: { audits: empty },
	LoadAgency: { agencies: empty },
	LoadLocation: { locations: empty },
	LoadPatronIdentities: { patronIdentities: empty },
	LoadLibraryBasics: { libraries: empty },
};
