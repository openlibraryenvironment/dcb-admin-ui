import {gql} from '@apollo/client'

// This file holds all our GraphQL queries, so they can be reused throughout the project 
// As we switch to using Apollo GraphQL as part of the server-side pagination work, all queries
// will be switched to having the necessary variables and will use the apollo/client gql import.

// A query for adding an agency to a group. 
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

// A query for creating a new group.
export const createGroup = gql`
  mutation CreateAgencyGroup($input: AgencyGroupInput!) {
    createAgencyGroup(input: $input) {
        id
        code
        name
    }
  }
`;

// A query for loading bib records.

export const searchBibs = gql`
query LoadBibs($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!) {
    sourceBibs(pageno: $pageno, pagesize: $pagesize, order: $order, query: $query) {
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
        sourceRecord {
            id
            hostLmsId
            remoteId
            json
        }
      }
      pageable {
        number
        offset
    }
    }
}  
`;

// A query to load locations with server-side pagination and querying enabled.
export const getLocations = gql`
  query LoadLocations($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!, $orderBy: String!) {
    locations(pageno: $pageno, pagesize: $pagesize, order: $order, query: $query, orderBy: $orderBy) {
        totalSize
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
        pageable {
            number
            offset
        }
    }
  }
`;

// A query to load agencies.
export const getAgencies = gql`
  query LoadAgencies($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!, $orderBy: String!) {
    agencies(pageno: $pageno, pagesize: $pagesize, order: $order, query: $query, orderBy: $orderBy) {
        totalSize
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
        pageable {
            number
            offset
        }
    }
}`;


export const getHostLms = gql`
query LoadHostLms($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!, $orderBy: String!) {
    hostLms(pageno: $pageno, pagesize: $pagesize, order: $order, query: $query, orderBy: $orderBy) {
        totalSize
        content {
            id
            code
            name
            lmsClientClass
            clientConfig
        }
        pageable {
            number
            offset
        }
    }
}
`;

// A GraphQL query to load Host LMS for the autocomplete on mappings upload - no pagination
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
// A GraphQL query to load all reference value mappings, with pagination, filtering etc.

export const getMappings = gql`
query LoadMappings($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!, $orderBy: String!) {
    referenceValueMappings(pageno: $pageno, pagesize: $pagesize, order: $order, query: $query, orderBy: $orderBy) {
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
}`;
// To ensure that no deleted mappings are loaded when we do this
// for CirculationStatus mappings
// query: "fromCategory: CirculationStatus && deleted: false"

export const getCirculationStatusMappings = gql`
query LoadCirculationStatusMappings($pageno: Int!, $pagesize: Int!, $order: String!, $orderBy: String!, $query: String!) {
    referenceValueMappings(pageno: $pageno, pagesize: $pagesize, order: $order, query: $query, orderBy: $orderBy) {
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
}`;



// A query to load patron requests.
// Slim it down once we've decided what we need - if this mega query is needed for diagnostics 
// we can have a 'just the essentials' query for other use cases
// This query supports server-side pagination, as well as 'order' and 'query' props being passed in for searching and sorting.

export const getPatronRequests = gql`
query LoadPatronRequests($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!, $orderBy: String!) {
    patronRequests(pageno: $pageno, pagesize: $pagesize, order: $order, query: $query, orderBy: $orderBy) {
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
        pageable {
            number
            offset
        }
        totalSize
    }
}`;




// A query for loading groups and their members.
export const groupsQueryDocument = gql`
query LoadGroups($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!, $orderBy: String!) {
    agencyGroups(pageno: $pageno, pagesize: $pagesize, order: $order, query: $query, orderBy: $orderBy) {
        totalSize
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
        pageable {
            number
            offset
        }
    }
}`;


