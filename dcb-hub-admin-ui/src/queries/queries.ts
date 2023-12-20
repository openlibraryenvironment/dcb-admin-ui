import  {gql} from 'graphql-request';
import {gql as apolloGraphQL} from '@apollo/client'

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

// A query for searching for sourceBibs by their sourceRecordId

export const searchBibs = apolloGraphQL`
query searchBibs($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!) {
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

// A query to load locations with server-side pagination and querying enabled. To be implemented in DCB-488.
export const getLocations = apolloGraphQL`
  query loadLocations($pageno: Int!, $pagesize: Int!, $order: String!, $query: String!) {
    locations(pageno: $pageno, pagesize: $pagesize, order: $order, query: $query) {
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
        }
        hostSystem {
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



// A query for loading groups and their members.
export const groupsQueryDocument = gql`
query FindGroups {
    agencyGroups(pagesize: 500) {
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
}
`;

// pagesize is 100 ONLY until DCB-480 is implemented
// Means that it will only fetch up to a maximum of 100 HostLMS
// Server-side pagination needs to be implemented for this to work as intended (default page size is 10)


// A query for loading HostLMS.
export const loadHostlms = gql`
query HostLms {
    hostLms(pagesize: 100) {
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

// A query for loading agencies. 
export const loadAgencies = gql`
query loadAgencies {
    agencies(pagesize: 100) {
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
        }
        pageable {
            number
            offset
        }
    }
}
`;

// A query to load locations. Has the same temporary page size restriction as the loadHostlms query.

export const loadLocations = gql`
query loadLocations {
    locations(pagesize: 100) {
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
            }
            hostSystem {
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

// A query to load patron requests. Has the same temporary page size restriction as loadHostlms.
// Slim it down once we've decided what we need - if this mega query is needed for diagnostics 
// we can have a 'just the essentials' query for other use cases

export const loadPatronRequests = gql`
query PatronRequests {
    patronRequests(pagesize: 100) {
        totalSize
        content { 
            id
            dateCreated
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
            activeWorkflow
            requesterNote 
            patron {
                id
            },
            requestingIdentity { 
                id, 
                localId 
                homeIdentity
                localBarcode
                localNames
                localPtype
                canonicalPtype 
                localHomeLibraryCode
                lastValidated 
            }, 
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
            }, 
            audit { 
                id
                auditDate
                fromStatus
                toStatus
                briefDescription
            }, 
            clusterRecord { 
                id 
                title
                selectedBib
                members { 
                    id
                    title
                    canonicalMetadata
                    sourceSystemId
                    sourceRecordId
                    sourceRecord { id, json }  
                }  
            }  
        } 
    }
}`;
