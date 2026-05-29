import { gql } from "graphql-request";

export const getLocation = gql`
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
