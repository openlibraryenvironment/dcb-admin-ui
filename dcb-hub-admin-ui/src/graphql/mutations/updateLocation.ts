import { gql } from "graphql-request";

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
