import { gql } from "graphql-request";

export const getAgency = gql`
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
