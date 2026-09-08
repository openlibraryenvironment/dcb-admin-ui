import { gql } from "graphql-request";
import { patronRequestFields } from "@fragments/patronRequestFields";

export const getPatronRequestDashboard = gql`
	${patronRequestFields}
	query GetPatronRequestDashboard(
		$allQuery: String
		$activeQuery: String
		$exceptionQuery: String
		$outOfSequenceQuery: String
		$finishedQuery: String
		$pageno: Int
		$pagesize: Int
		$order: String
		$orderBy: String
	) {
		allRequests: patronRequests(
			query: $allQuery
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			orderBy: $orderBy
		) {
			content {
				...PatronRequestFields
			}
			totalSize
		}
		activeRequests: patronRequests(
			query: $activeQuery
			pageno: 0
			pagesize: 1
		) {
			totalSize
		}
		exceptionRequests: patronRequests(
			query: $exceptionQuery
			pageno: 0
			pagesize: 1
		) {
			totalSize
		}
		outOfSequenceRequests: patronRequests(
			query: $outOfSequenceQuery
			pageno: 0
			pagesize: 1
		) {
			totalSize
		}
		finishedRequests: patronRequests(
			query: $finishedQuery
			pageno: 0
			pagesize: 1
		) {
			totalSize
		}
	}
`;
