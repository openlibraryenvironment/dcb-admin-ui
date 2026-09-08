import { gql } from "graphql-request";

/**
 * The single source of truth for the fields every patron request GRID needs -
 * the columns in getPatronRequestColumns, their valueGetters, and the row
 * detail panel (MasterDetail).
 *
 * Interpolate this into any query whose rows feed a patron request grid, rather
 * than hand-listing fields per query. Three queries (LoadPatronRequests,
 * GetPatronRequestDashboard, LoadPatronRequestsForExport) render the SAME
 * columns, so hand-maintained lists silently drift: a column added to one query
 * renders blank in the grids whose query was never updated, while the export
 * populates it (or vice versa). One fragment makes "what the grid shows" and
 * "what the export writes" equal by construction.
 *
 * Adding a grid column? Add its source field HERE and all three stay in step.
 *
 * Detail-view-only fields (e.g. nextScheduledPoll) do not belong here - they are
 * fetched by getPatronRequest for the single-request route.
 */
export const patronRequestFields = gql`
	fragment PatronRequestFields on PatronRequest {
		id
		dateCreated
		dateUpdated
		patronHostlmsCode
		pickupLocationCode
		description
		status
		previousStatus
		nextExpectedStatus
		errorMessage
		outOfSequenceFlag
		elapsedTimeInCurrentStatus
		pollCountForCurrentStatus
		renewalCount
		resolutionCount
		isManuallySelectedItem
		requesterNote
		activeWorkflow
		pickupRequestId
		pickupRequestStatus
		pickupItemId
		isExpeditedCheckout
		rawLocalRequestStatus
		rawLocalItemStatus
		localRequestId
		localRequestStatus
		localItemId
		localItemStatus
		localItemType
		patron {
			id
		}
		requestingIdentity {
			id
			localId
			localBarcode
			canonicalPtype
		}
		suppliers {
			id
			canonicalItemType
			dateCreated
			dateUpdated
			hostLmsCode
			isActive
			localItemId
			localBibId
			localItemBarcode
			localItemLocationCode
			localItemStatus
			localItemType
			localId
			localRenewalCount
			localStatus
			localAgency
			rawLocalItemStatus
			rawLocalStatus
		}
		clusterRecord {
			id
			title
		}
	}
`;
