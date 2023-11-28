import  {gql} from 'graphql-request';

// This file holds all our GraphQL queries, so they can be reused throughout the project 


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

// A query for loading agencies. Has the same temporary page size restriction as the loadHostlms query.
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
                patronRequest {
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
                }
            }
            audit {
                id
                auditDate
                briefDescription
                fromStatus
                toStatus
                auditData
                patronRequest {
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
                    patron {
                        id
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
                        localStatus
                        localAgency
                    }
                    audit {
                        id
                        auditDate
                        briefDescription
                        fromStatus
                        toStatus
                        auditData
                    }
                }
            }
        }
    }
}`;
