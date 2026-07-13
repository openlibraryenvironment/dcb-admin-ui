import { gql } from "graphql-request";

export const getSupplierRequests = gql`
	query LoadSupplierRequests(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		supplierRequests(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			content {
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
				rawLocalItemStatus
				rawLocalStatus
				localRenewalCount
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
				patronRequest {
					id
				}
			}
			pageable {
				number
				offset
			}
			totalSize
		}
	}
`;
