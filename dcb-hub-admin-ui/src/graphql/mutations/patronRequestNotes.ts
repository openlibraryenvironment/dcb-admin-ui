import { gql } from "graphql-request";

// No agencyCode: dcb-service writes every consortium staff note as the consortium's
export const addPatronRequestNote = gql`
	mutation AddPatronRequestNote($patronRequestId: ID!, $body: String!) {
		addPatronRequestNote(patronRequestId: $patronRequestId, body: $body) {
			id
		}
	}
`;

export const retractPatronRequestNote = gql`
	mutation RetractPatronRequestNote($id: ID!) {
		retractPatronRequestNote(id: $id) {
			id
			retracted
		}
	}
`;
