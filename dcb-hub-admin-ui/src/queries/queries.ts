import { gql } from "@apollo/client";

// This file holds all our GraphQL queries and mutations, so they can be reused throughout the project

// MUTATIONS - modify data

// Agencies

export const updateAgencyParticipationStatus = gql`
	mutation UpdateAgencyParticipationStatus(
		$input: UpdateAgencyParticipationInput!
	) {
		updateAgencyParticipationStatus(input: $input) {
			id
			code
			name
			isSupplyingAgency
			isBorrowingAgency
		}
	}
`;

// Libraries, Library Contacts and LibraryGroups

export const createLibraryContact = gql`
	mutation CreateLibraryContact($input: CreateLibraryContactInput!) {
		createLibraryContact(input: $input) {
			id
			person {
				firstName
				lastName
			}
			library {
				id
			}
		}
	}
`;

export const deleteLibraryContact = gql`
	mutation DeleteLibraryContact($input: DeleteLibraryContactInput!) {
		deleteLibraryContact(input: $input) {
			success
			message
		}
	}
`;

export const createLibrary = gql`
	mutation CreateLibrary($input: LibraryInput!) {
		createLibrary(input: $input) {
			id
			fullName
			type
		}
	}
`;

export const createLibraryGroup = gql`
	mutation CreateLibraryGroup($input: LibraryGroupInput!) {
		createLibraryGroup(input: $input) {
			id
			code
			name
			type
		}
	}
`;

export const addLibraryToGroup = gql`
	mutation addLibraryToGroup($input: AddLibraryToGroupCommand!) {
		addLibraryToGroup(input: $input) {
			id
			library {
				id
				agencyCode
				fullName
			}
			libraryGroup {
				id
				code
				name
				type
			}
		}
	}
`;

export const deleteLibraryQuery = gql`
	mutation DeleteLibrary($input: DeleteEntityInput!) {
		deleteLibrary(input: $input) {
			success
			message
		}
	}
`;

export const updateLibraryQuery = gql`
	mutation UpdateLibrary($input: UpdateLibraryInput!) {
		updateLibrary(input: $input) {
			id
			fullName
			shortName
			abbreviatedName
			backupDowntimeSchedule
			supportHours
			latitude
			longitude
		}
	}
`;

export const updatePerson = gql`
	mutation UpdatePerson($input: UpdatePersonInput!) {
		updatePerson(input: $input) {
			id
			email
			firstName
			lastName
			role {
				id
				name
				displayName
			}
			isPrimaryContact
		}
	}
`;

// Location mutations

export const deleteLocationQuery = gql`
	mutation DeleteLocation($input: DeleteEntityInput!) {
		deleteLocation(input: $input) {
			success
			message
		}
	}
`;

export const updateLocationQuery = gql`
	mutation UpdateLocation($input: UpdateLocationInput!) {
		updateLocation(input: $input) {
			id
			longitude
			latitude
			name
			localId
			printLabel
			isPickup
			isEnabledForPickupAnywhere
		}
	}
`;

// Reference value mapping mutations

export const updateReferenceValueMapping = gql`
	mutation UpdateReferenceValueMapping(
		$input: UpdateReferenceValueMappingInput!
	) {
		updateReferenceValueMapping(input: $input) {
			id
			toValue
		}
	}
`;

export const deleteReferenceValueMapping = gql`
	mutation DeleteReferenceValueMapping($input: DeleteEntityInput!) {
		deleteReferenceValueMapping(input: $input) {
			success
			message
		}
	}
`;

export const createReferenceValueMapping = gql`
	mutation CreateReferenceValueMapping(
		$input: CreateReferenceValueMappingInput!
	) {
		createReferenceValueMapping(input: $input) {
			id
			toValue
		}
	}
`;

// Numeric range mapping mutations

export const updateNumericRangeMapping = gql`
	mutation UpdateNumericRangeMapping($input: UpdateNumericRangeMappingInput!) {
		updateNumericRangeMapping(input: $input) {
			id
			mappedValue
		}
	}
`;

export const deleteNumericRangeMapping = gql`
	mutation DeleteNumericRangeMapping($input: DeleteEntityInput!) {
		deleteNumericRangeMapping(input: $input) {
			success
			message
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
				latitude
				longitude
			}
			pageable {
				number
				offset
			}
		}
	}
`;

export const getAgenciesForStaffRequest = gql`
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
				hostLms {
					id
					code
				}
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
				isSupplyingAgency
				isBorrowingAgency
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
					isEnabledForPickupAnywhere
					longitude
					latitude
					locationReference
					deliveryStops
					printLabel
					localId
				}
			}
		}
	}
`;

// ALARMS

export const getAlarms = gql`
	query LoadAlarms(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		alarms(
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
				created
				lastSeen
				repeatCount
				expires
				alarmDetails
			}
			pageable {
				number
				offset
			}
		}
	}
`;

// DATA CHANGE LOG

export const getDataChangeLog = gql`
	query LoadDataChangeLog(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		dataChangeLog(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			totalSize
			content {
				id
				entityId
				entityType
				actionInfo
				lastEditedBy
				timestampLogged
				reason
				changeReferenceUrl
				changeCategory
				changes
			}
			pageable {
				number
				offset
			}
		}
	}
`;
// 				// oldData
// newData
export const getDataChangeLogById = gql`
	query GetDataChangeLogById($query: String!) {
		dataChangeLog(query: $query) {
			totalSize
			content {
				id
				entityId
				entityType
				actionInfo
				lastEditedBy
				reason
				changeReferenceUrl
				changeCategory
				timestampLogged
				changes
			}
			pageable {
				number
				offset
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

export const getAuditsByPatronRequest = gql`
	query GetAuditsByPatronRequest(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		audits(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			totalSize
			content {
				id
				auditDate
				briefDescription
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
				sourceSystemId
				sourceRecordId
				processVersion
				contributesTo {
					id
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
// But leaves out the sourceRecord to be fetched on-demand ONLY
export const getBibMainDetails = gql`
	query LoadBibMainDetails($query: String!) {
		sourceBibs(query: $query) {
			content {
				id
				dateCreated
				dateUpdated
				title
				author
				canonicalMetadata
				processVersion
				metadataScore
				processVersion
				placeOfPublication
				publisher
				dateOfPublication
				edition
				isLargePrint
				clusterReason
				typeOfRecord
				metadataScore
				contributesTo {
					id
					title
				}
				sourceSystemId
				sourceRecordId
				matchPoints {
					id
					bibId
					value
				}
			}
		}
	}
`;
// Fetch source record on demand.
export const getBibSourceRecord = gql`
	query LoadBibSourceRecord($query: String!) {
		sourceBibs(query: $query) {
			content {
				sourceRecord {
					id
					hostLmsId
					remoteId
					lastFetched
					lastProcessed
					processingState
					processingInformation
					sourceRecordData
				}
			}
		}
	}
`;

// CONSORTIA

// Fetches the consortia

export const getConsortia = gql`
	query LoadConsortium($order: String!, $orderBy: String!) {
		consortia(order: $order, orderBy: $orderBy) {
			totalSize
			content {
				id
				name
				libraryGroup {
					id
				}
				dateOfLaunch
				headerImageUrl
				headerImageUploader
				headerImageUploaderEmail
				aboutImageUrl
				aboutImageUploader
				aboutImageUploaderEmail
				description
				catalogueSearchUrl
				websiteUrl
				displayName
				contacts {
					email
					id
				}
				functionalSettings {
					id
					name
					enabled
				}
			}
		}
	}
`;

export const getConsortiaFunctionalSettings = gql`
	query LoadConsortiumFS($order: String!, $orderBy: String!) {
		consortia(order: $order, orderBy: $orderBy) {
			totalSize
			content {
				id
				name
				displayName
				functionalSettings {
					id
					name
					enabled
					description
				}
			}
		}
	}
`;

export const deleteConsortiumContact = gql`
	mutation DeleteLibraryContact($input: DeleteConsortiumContactInput!) {
		deleteContact(input: $input) {
			success
			message
		}
	}
`;
export const getConsortiaContacts = gql`
	query LoadConsortiumContacts($order: String!, $orderBy: String!) {
		consortia(order: $order, orderBy: $orderBy) {
			totalSize
			content {
				id
				name
				displayName
				contacts {
					id
					firstName
					lastName
					role {
						id
						name
						description
						displayName
						keycloakRole
					}
					isPrimaryContact
					email
				}
			}
		}
	}
`;

export const getConsortiaKeyInfo = gql`
	query LoadConsortiumHeader($order: String!, $orderBy: String!) {
		consortia(order: $order, orderBy: $orderBy) {
			totalSize
			content {
				id
				name
				displayName
				headerImageUrl
				aboutImageUrl
				description
				catalogueSearchUrl
				websiteUrl
			}
		}
	}
`;

export const updateConsortiumQuery = gql`
	mutation UpdateConsortium($input: UpdateConsortiumInput!) {
		updateConsortium(input: $input) {
			id
			headerImageUrl
			headerImageUploader
			headerImageUploaderEmail
			aboutImageUrl
			aboutImageUploader
			aboutImageUploaderEmail
			description
			catalogueSearchUrl
			websiteUrl
			displayName
		}
	}
`;

export const updateFunctionalSettingQuery = gql`
	mutation UpdateFunctionalSetting($input: UpdateFunctionalSettingInput!) {
		updateFunctionalSetting(input: $input) {
			id
			name
			enabled
			description
		}
	}
`;

export const addFunctionalSettingQuery = gql`
	mutation AddFunctionalSetting($input: FunctionalSettingInput!) {
		createFunctionalSetting(input: $input) {
			id
			name
			enabled
			description
		}
	}
`;

export const createConsortiumContact = gql`
	mutation CreateConsortiumContact($input: ConsortiumContactInput!) {
		createContact(input: $input) {
			id
			person {
				firstName
				lastName
			}
			consortium {
				id
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
				clientConfig
				lmsClientClass
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
				itemSuppressionRulesetName
				suppressionRulesetName
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
				type
				isPickup
				isEnabledForPickupAnywhere
				printLabel
				localId
				deliveryStops
				lastImported
				latitude
				longitude
				agency {
					id
					name
					code
				}
				hostSystem {
					name
				}
			}
			pageable {
				number
				offset
			}
		}
	}
`;

export const checkExistingLocations = gql`
	query CheckExistingLocations($pagesize: Int!, $query: String!) {
		locations(pagesize: $pagesize, query: $query) {
			totalSize
		}
	}
`;

export const createLocation = gql`
	mutation CreateLocation($input: CreateLocationInput!) {
		createLocation(input: $input) {
			id
			name
		}
	}
`;

// This gets a location by its ID for the record / details page.
// As such it must fetch everything a Location record contains.
export const getLocationById = gql`
	query LoadLocation($query: String!) {
		locations(query: $query) {
			content {
				id
				code
				name
				type
				isPickup
				isEnabledForPickupAnywhere
				localId
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
					isEnabledForPickupAnywhere
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

// This gets very specialised location attributes to display in the patron request grid

export const getLocationForPatronRequestGrid = gql`
	query LoadLocation(
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
			content {
				id
				code
				name
			}
			pageable {
				number
				offset
			}
			totalSize
		}
	}
`;

// Libraries
// A query to load a page of Libraries for display in the data grid

export const getLibraries = gql`
	query LoadLibraries(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		libraries(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			content {
				id
				fullName
				shortName
				abbreviatedName
				agencyCode
				supportHours
				address
				type
				agency {
					id
					code
					name
					authProfile
					hostLms {
						id
						code
						clientConfig
						lmsClientClass
					}
					isSupplyingAgency
					isBorrowingAgency
				}
				membership {
					libraryGroup {
						id
						code
						name
						type
						consortium {
							id
							name
							dateOfLaunch
							functionalSettings {
								id
								name
								enabled
							}
						}
					}
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

// Query to get a selection of libraries for the libraries drop-down

export const getLibrariesSelection = gql`
	query LoadLibrariesSelection($order: String!, $orderBy: String!) {
		libraries(order: $order, orderBy: $orderBy) {
			totalSize
			content {
				id
				agencyCode
				fullName
				shortName
			}
		}
	}
`;

// A query to load a Library by its ID
export const getLibraryById = gql`
	query LoadLibrary($query: String!) {
		libraries(query: $query) {
			content {
				id
				fullName
				shortName
				abbreviatedName
				agencyCode
				supportHours
				address
				latitude
				longitude
				training
				patronWebsite
				discoverySystem
				type
				backupDowntimeSchedule
				hostLmsConfiguration
				agency {
					id
					code
					name
					authProfile
					isSupplyingAgency
					maxConsortialLoans
					isBorrowingAgency
					hostLms {
						id
						code
						name
						clientConfig
						lmsClientClass
						itemSuppressionRulesetName
						suppressionRulesetName
					}
				}
				secondHostLms {
					id
					code
					name
					clientConfig
					lmsClientClass
					itemSuppressionRulesetName
					suppressionRulesetName
				}
				membership {
					libraryGroup {
						id
						code
						name
						type
						consortium {
							id
							name
						}
					}
				}
				contacts {
					id
					firstName
					lastName
					role {
						id
						name
						description
						displayName
						keycloakRole
					}
					isPrimaryContact
					email
				}
			}
		}
	}
`;

export const getLibraryServiceInfo = gql`
	query LoadLibraryServiceInfo($query: String!) {
		libraries(query: $query) {
			content {
				id
				fullName
				patronWebsite
				discoverySystem
				backupDowntimeSchedule
				hostLmsConfiguration
				agency {
					id
					authProfile
					hostLms {
						id
						code
						name
						clientConfig
						lmsClientClass
						itemSuppressionRulesetName
						suppressionRulesetName
					}
				}
				secondHostLms {
					id
					code
					name
					clientConfig
					lmsClientClass
					itemSuppressionRulesetName
					suppressionRulesetName
				}
			}
		}
	}
`;
export const getLibraryContacts = gql`
	query LoadLibraryContacts(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		libraries(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			content {
				id
				fullName
				shortName
				contacts {
					id
					firstName
					lastName
					role {
						id
						name
						description
						displayName
						keycloakRole
					}
					isPrimaryContact
					email
				}
			}
		}
	}
`;

export const getLibraryBasicsLegacy = gql`
	query LoadLibraryBasics($query: String!) {
		libraries(query: $query) {
			content {
				id
				fullName
				shortName
				agencyCode
				agency {
					id
					code
					name
					authProfile
					isSupplyingAgency
					isBorrowingAgency
				}
			}
		}
	}
`;
export const getLibraryBasics = gql`
	query LoadLibraryBasics($query: String!) {
		libraries(query: $query) {
			content {
				id
				fullName
				shortName
				agencyCode
				agency {
					id
					code
					name
					authProfile
					isSupplyingAgency
					isBorrowingAgency
					maxConsortialLoans
				}
			}
		}
	}
`;

export const getLibraryBasicsLocation = gql`
	query LoadLibraryBasics($query: String!) {
		libraries(query: $query) {
			content {
				id
				fullName
				shortName
				agencyCode
				contacts {
					id
					firstName
					lastName
					role {
						id
						name
						description
						displayName
						keycloakRole
					}
					isPrimaryContact
					email
				}
				agency {
					id
					code
					maxConsortialLoans
					hostLms {
						id
						code
						lmsClientClass
					}
				}
				secondHostLms {
					code
					name
					id
					lmsClientClass
				}
			}
		}
	}
`;

export const getLibraryBasicsPR = gql`
	query LoadLibraryServiceInfo($query: String!) {
		libraries(query: $query) {
			content {
				id
				fullName
				agencyCode
				agency {
					id
					authProfile
					hostLms {
						id
						code
						name
					}
				}
			}
		}
	}
`;
// 'LIBRARY' GROUPS

export const getLibraryGroups = gql`
	query LoadGroups(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		libraryGroups(
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
				type
				consortium {
					name
					id
				}
			}
			pageable {
				number
				offset
			}
		}
	}
`;
// Get selection of groups for autocomplete (no pagination)

export const getGroupsSelection = gql`
	query LoadGroupsSelection($order: String!, $orderBy: String!) {
		libraryGroups(order: $order, orderBy: $orderBy) {
			totalSize
			content {
				id
				code
				name
				type
			}
		}
	}
`;

// Get a group by ID
export const getLibraryGroupById = gql`
	query LoadGroup($query: String!) {
		libraryGroups(query: $query) {
			content {
				id
				code
				name
				type
				consortium {
					id
					name
				}
				members {
					id
					library {
						id
						agencyCode
						agency {
							authProfile
							code
							id
							isBorrowingAgency
							isSupplyingAgency
							hostLms {
								lmsClientClass
								code
								id
							}
						}
						shortName
						fullName
						abbreviatedName
						longitude
						latitude
					}
				}
			}
		}
	}
`;

// patron identities
export const getPatronIdentities = gql`
	query LoadPatronIdentities($order: String!, $orderBy: String!) {
		patronIdentities(order: $order, orderBy: $orderBy) {
			totalSize
			content {
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
				previousStatus
				nextExpectedStatus
				errorMessage
				nextScheduledPoll
				outOfSequenceFlag
				elapsedTimeInCurrentStatus
				pollCountForCurrentStatus
				isManuallySelectedItem
				requesterNote
				activeWorkflow
				isExpeditedCheckout
				rawLocalRequestStatus
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
					localAgency
					canonicalItemType
					localItemBarcode
				}
				clusterRecord {
					id
					title
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

export const getPatronRequestsForExport = gql`
	query LoadPatronRequestsForExport(
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
				previousStatus
				nextExpectedStatus
				errorMessage
				outOfSequenceFlag
				elapsedTimeInCurrentStatus
				pollCountForCurrentStatus
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
					localBarcode
					canonicalPtype
				}
				suppliers {
					localAgency
					canonicalItemType
					localItemBarcode
				}
				clusterRecord {
					title
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

export const getPatronRequestTotals = gql`
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
				status
				patronHostlmsCode
				isExpeditedCheckout
				outOfSequenceFlag
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
	query LoadPatronRequestsById($query: String!) {
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
				isExpeditedCheckout
				localBibId
				rawLocalItemStatus
				rawLocalRequestStatus
				description
				nextScheduledPoll
				errorMessage
				previousStatus
				pollCountForCurrentStatus
				currentStatusTimestamp
				nextExpectedStatus
				outOfSequenceFlag
				elapsedTimeInCurrentStatus
				localItemHostlmsCode
				localItemAgencyCode
				isManuallySelectedItem
				resolutionCount
				renewalCount
				renewalStatus
				localRenewalCount
				isTooLong
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
							lastFetched
							lastProcessed
							processingState
							processingInformation
							sourceRecordData
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
					localRenewalCount
					localStatus
					localAgency
					rawLocalItemStatus
					localHoldCount
					localRenewable
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

// LEGACY - TO BE REMOVED WHEN DCB SERVICE 8.46.0 IS ON ALL ENVS
export const getLegacyPatronRequestById = gql`
	query LoadPatronRequestsByIdLegacy($query: String!) {
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
				isExpeditedCheckout
				localBibId
				rawLocalItemStatus
				rawLocalRequestStatus
				description
				nextScheduledPoll
				errorMessage
				previousStatus
				pollCountForCurrentStatus
				currentStatusTimestamp
				nextExpectedStatus
				outOfSequenceFlag
				elapsedTimeInCurrentStatus
				localItemHostlmsCode
				localItemAgencyCode
				isManuallySelectedItem
				resolutionCount
				renewalCount
				localRenewalCount
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
							lastFetched
							lastProcessed
							processingState
							processingInformation
							sourceRecordData
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
					localRenewalCount
					localStatus
					localAgency
					rawLocalItemStatus
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

export const getPatronRequestEssentials = gql`
	query LoadPatronRequestsById($query: String!) {
		patronRequests(query: $query) {
			content {
				id
				dateUpdated
				patronHostlmsCode
				bibClusterId
				status
				localRequestId
				localRequestStatus
				localItemId
				localItemStatus
				localItemType
				localBibId
				rawLocalItemStatus
				rawLocalRequestStatus
				description
				nextScheduledPoll
				errorMessage
				previousStatus
				pollCountForCurrentStatus
				currentStatusTimestamp
				nextExpectedStatus
				outOfSequenceFlag
				elapsedTimeInCurrentStatus
				localItemHostlmsCode
				localItemAgencyCode
				isManuallySelectedItem
				isExpeditedCheckout
				resolutionCount
				renewalCount
				localRenewalCount
				dateCreated
				activeWorkflow
				requesterNote
			}
		}
	}
`;

// SUPPLIER REQUESTS

export const getSupplierRequests = gql`
	query LoadSupplierRequests(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		supplierRequests(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			content {
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
				rawLocalItemStatus
				rawLocalStatus
				localRenewalCount
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
				patronRequest {
					id
					isExpeditedCheckout
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

// A query to check if referenceValueMappings exist for a Host LMS

export const checkExistingMappings = gql`
	query CheckExistingMappings($pagesize: Int!, $query: String!) {
		referenceValueMappings(pagesize: $pagesize, query: $query) {
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

// A query to check if numeric range mappings exist

export const checkExistingNumericRangeMappings = gql`
	query CheckExistingNumericRangeMappings($pagesize: Int!, $query: String!) {
		numericRangeMappings(pagesize: $pagesize, query: $query) {
			totalSize
			content {
				id
				context
				domain
				lowerBound
				upperBound
				targetContext
				mappedValue
				deleted
				lastImported
			}
		}
	}
`;
// A query to load paginated numeric range mappings

export const getNumericRangeMappings = gql`
	query LoadNumericRangeMappings(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$orderBy: String!
		$query: String!
	) {
		numericRangeMappings(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			totalSize
			content {
				id
				context
				domain
				lowerBound
				upperBound
				targetContext
				mappedValue
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

// ROLES

export const getRoles = gql`
	query LoadRoles($order: String!, $orderBy: String!, $pagesize: Int!) {
		roles(order: $order, orderBy: $orderBy, pagesize: $pagesize) {
			totalSize
			content {
				id
				name
				keycloakRole
				description
				displayName
			}
		}
	}
`;

// AGENCY GROUPS (DEPRECATED)

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

export const getClusters = gql`
	query ClusterRecords($query: String!) {
		instanceClusters(query: $query) {
			content {
				id
				title
				selectedBib
				isDeleted
				dateCreated
				dateUpdated
				members {
					id
					title
					author
					typeOfRecord
					canonicalMetadata
					clusterReason
					sourceSystemId
					sourceRecordId
					sourceRecord {
						id
						hostLmsId
						remoteId
						lastFetched
						lastProcessed
						processingState
						processingInformation
						sourceRecordData
					}
					matchPoints {
						id
						value
					}
				}
			}
		}
	}
`;
