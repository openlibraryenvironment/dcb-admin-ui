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
    agencyGroups(pagesize: 100) {
        totalSize
        content {
            id
            code
            name
            members {
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