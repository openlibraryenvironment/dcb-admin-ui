import  {gql} from 'graphql-request';

// This file holds all our GraphQL queries, so they can be reused throughout the project 

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

export const createGroup = gql`
  mutation CreateAgencyGroup($input: AgencyGroupInput!) {
    createAgencyGroup(input: $input) {
        id
        code
        name
    }
  }
`;

export const groupsQueryDocument = gql`
query FindGroups {
    agencyGroups {
        id
        code
        name
        members {
            id
            agency {
                id
                code
                name
            }
        }
    }
}
`;
