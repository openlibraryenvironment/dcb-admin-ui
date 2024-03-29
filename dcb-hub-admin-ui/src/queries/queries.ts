import { gql } from "@apollo/client";

// This file holds all our GraphQL queries and mutations, so they can be reused throughout the project

// MUTATIONS - modify data

// A mutation for adding an agency to a group.
export const addAgenciesToGroup = gql`
	mutation AddAgencyToGroup($input: AddAgencyToGroupCommand!) {
		addAgencyToGroup(input: $input) {
			id
			agency {
				id
				code
				name
			}
			group {
				id
				code
				name
			}
		}
	}
`;

// A mutation for creating a new group.
export const createGroup = gql`
	mutation CreateAgencyGroup($input: AgencyGroupInput!) {
		createAgencyGroup(input: $input) {
			id
			code
			name
		}
	}
`;

// QUERIES - Fetch data.

// AGENCIES - these can be used as examples to understand our query structure

// A query to load agencies into the data grid, using server-side pagination.
// As this is for the data grid it should only fetch attributes we display in the grid
// Or attributes we wish for users to be able to filter by
// (use hidden columns if these aren't wanted for display)
export const getAgencies = gql`
	query LoadAgencies(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		agencies(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			totalSize
			content {
				id
				code
				name
			}
			pageable {
				number
				offset
			}
		}
	}
`;
// Gets an agency by its ID - used on individual record page.
// Must fetch all attributes so all relevant information can be displayed.
export const getAgencyById = gql`
	query LoadAgencies($query: String!) {
		agencies(query: $query) {
			content {
				id
				code
				name
				authProfile
				longitude
				latitude
				hostLms {
					id
					code
					name
					lmsClientClass
					clientConfig
				}
				locations {
					id
					dateCreated
					dateUpdated
					code
					name
					type
					isPickup
					longitude
					latitude
					locationReference
					deliveryStops
					printLabel
				}
			}
		}
	}
`;

// AUDITS

export const getAuditById = gql`
	query GetAuditById($query: String!) {
		audits(query: $query) {
			content {
				id
				auditDate
				briefDescription
				fromStatus
				toStatus
				auditData
				patronRequest {
					id
				}
			}
		}
	}
`;
// BIB RECORDS

// Gets bibs for the data grid
export const getBibs = gql`
	query LoadBibs(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
	) {
		sourceBibs(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
		) {
			totalSize
			content {
				id
				dateCreated
				dateUpdated
				title
				author
				canonicalMetadata
				sourceSystemId
				sourceRecordId
				contributesTo {
					id
					title
				}
			}
			pageable {
				number
				offset
			}
		}
	}
`;

// Gets a bib record by its ID for the individual record page
export const getBibById = gql`
	query LoadBibs($query: String!) {
		sourceBibs(query: $query) {
			content {
				id
				dateCreated
				dateUpdated
				title
				author
				canonicalMetadata
				sourceSystemId
				sourceRecordId
				contributesTo {
					id
					title
				}
				sourceRecord {
					id
					hostLmsId
					remoteId
					json
				}
			}
		}
	}
`;

// GROUPS

// A query for loading a page of groups. We only fetch what's displayed in the Data Grid.
// As we fetch other attributes like members when the user clicks on an individual record.
export const getGroups = gql`
	query LoadGroups(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		agencyGroups(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			totalSize
			content {
				id
				code
				name
			}
			pageable {
				number
				offset
			}
		}
	}
`;

// A query for fetching a group by ID, so that it can be displayed on its individual record page.
export const getGroupById = gql`
	query LoadGroups($query: String!) {
		agencyGroups(query: $query) {
			content {
				id
				code
				name
				members {
					id
					agency {
						id
						code
						name
						authProfile
						longitude
						latitude
						hostLms {
							id
							code
							name
							lmsClientClass
							clientConfig
						}
					}
				}
			}
		}
	}
`;

// HOST LMS
// Fetches a page of Host LMS for the data grid - same principles apply
export const getHostLms = gql`
	query LoadHostLms(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		hostLms(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			totalSize
			content {
				id
				code
				name
			}
			pageable {
				number
				offset
			}
		}
	}
`;

// Fetches a Host LMS by its ID for its individual record page.
export const getHostLmsById = gql`
	query LoadHostLms($query: String!) {
		hostLms(query: $query) {
			content {
				id
				code
				name
				lmsClientClass
				clientConfig
			}
		}
	}
`;

// Specialised query for loading Host LMS into the mappings upload selector.
// Does not use pagination as MUI Autocomplete doesn't support it.
export const getHostLmsSelection = gql`
	query LoadHostLms($order: String!, $orderBy: String!) {
		hostLms(order: $order, orderBy: $orderBy) {
			totalSize
			content {
				id
				code
				name
				lmsClientClass
				clientConfig
			}
		}
	}
`;

// LOCATIONS
// Fetches locations for data grid page - only loads what's displayed / we want users to be able to filter by
export const getLocations = gql`
	query LoadLocations(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		locations(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			totalSize
			content {
				id
				code
				name
			}
			pageable {
				number
				offset
			}
		}
	}
`;

// This gets a location by its ID for the record / details page.
// As such it must fetch everything a Location record contains.
export const getLocationById = gql`
	query LoadLocations($query: String!) {
		locations(query: $query) {
			content {
				id
				code
				name
				type
				isPickup
				longitude
				latitude
				agency {
					id
					code
					name
					authProfile
					longitude
					latitude
				}
				parentLocation {
					id
					code
					name
					type
					isPickup
					longitude
					latitude
					dateCreated
					dateUpdated
					hostSystem {
						id
						code
						name
						lmsClientClass
						clientConfig
					}
				}
				hostSystem {
					id
					code
					name
					lmsClientClass
					clientConfig
				}
				printLabel
				deliveryStops
				locationReference
				dateCreated
				dateUpdated
			}
		}
	}
`;

// PATRON REQUESTS
// A query to load a page of PatronRequests for display in the data grid.

export const getPatronRequests = gql`
	query LoadPatronRequests(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		patronRequests(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			content {
				id
				dateCreated
				dateUpdated
				patronHostlmsCode
				pickupLocationCode
				description
				status
				patron {
					id
				}
				requestingIdentity {
					id
					localId
					localBarcode
				}
				suppliers {
					localAgency
				}
			}
			pageable {
				number
				offset
			}
			totalSize
		}
	}
`;

export const getPatronRequestById = gql`
	query LoadPatronRequests($query: String!) {
		patronRequests(query: $query) {
			content {
				id
				dateUpdated
				patronHostlmsCode
				bibClusterId
				pickupLocationCode
				pickupPatronId
				pickupItemId
				pickupItemType
				pickupItemStatus
				pickupRequestId
				pickupRequestStatus
				status
				localRequestId
				localRequestStatus
				localItemId
				localItemStatus
				localItemType
				localBibId
				description
				errorMessage
				patron {
					id
				}
				requestingIdentity {
					id
					localId
					homeIdentity
					localBarcode
					localNames
					localPtype
					canonicalPtype
					localHomeLibraryCode
					lastValidated
				}
				audit {
					id
					auditDate
					briefDescription
					fromStatus
					toStatus
					auditData
				}
				clusterRecord {
					id
					title
					selectedBib
					isDeleted
					dateCreated
					dateUpdated
					members {
						id
						dateCreated
						dateUpdated
						title
						author
						placeOfPublication
						publisher
						dateOfPublication
						edition
						isLargePrint
						clusterReason
						typeOfRecord
						canonicalMetadata
						metadataScore
						processVersion
						sourceSystemId
						sourceRecordId
						sourceRecord {
							id
							hostLmsId
							remoteId
							json
						}
					}
				}
				dateCreated
				activeWorkflow
				requesterNote
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
					localStatus
					localAgency
					virtualPatron {
						id
						localId
						homeIdentity
						localBarcode
						localNames
						localPtype
						canonicalPtype
						localHomeLibraryCode
						lastValidated
					}
				}
			}
		}
	}
`;

// MAPPINGS
// A GraphQL query to load all reference value mappings, with pagination, filtering etc.

export const getMappings = gql`
	query LoadMappings(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		referenceValueMappings(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			totalSize
			content {
				id
				fromCategory
				fromContext
				fromValue
				toCategory
				toContext
				toValue
				reciprocal
				label
				lastImported
				deleted
			}
			pageable {
				number
				offset
			}
		}
	}
`;

// A query to load a page of Circulation Status Mappings

export const getCirculationStatusMappings = gql`
	query LoadCirculationStatusMappings(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$orderBy: String!
		$query: String!
	) {
		referenceValueMappings(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			totalSize
			content {
				id
				fromCategory
				fromContext
				fromValue
				toCategory
				toContext
				toValue
				reciprocal
				label
				lastImported
				deleted
			}
			pageable {
				number
				offset
			}
		}
	}
`;
