import { gql } from "graphql-request";

export const getAlarms = gql`
	query LoadAlarms(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		alarms(
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
				created
				lastSeen
				repeatCount
				expires
				alarmDetails
			}
			pageable {
				number
				offset
			}
		}
	}
`;
