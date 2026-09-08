import { gql } from "graphql-request";

// Locations
// This query is used to fetch locations from DCB. The main place this is used is for the "Locations" data grid.
// As such, we only fetch what we want to make displayable in the grid.
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
