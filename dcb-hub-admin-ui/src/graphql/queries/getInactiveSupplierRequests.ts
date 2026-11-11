import { gql } from "graphql-request";

// Only what 8.71.0 copies when a supplier request is moved off: localId, localStatus,
// the raw statuses, localHoldingId and virtualPatron are always null on this type.
// No patronRequest either - its fetcher costs a query per row.
export const getInactiveSupplierRequests = gql`
	query LoadInactiveSupplierRequests(
		$query: String!
		$pagesize: Int!
		$order: String!
		$orderBy: String!
	) {
		inactiveSupplierRequests(
			query: $query
			pagesize: $pagesize
			pageno: 0
			order: $order
			orderBy: $orderBy
		) {
			totalSize
			content {
				id
				dateCreated
				localAgency
				hostLmsCode
				localItemId
				localItemBarcode
				localItemLocationCode
				localItemType
				canonicalItemType
				localBibId
			}
		}
	}
`;
