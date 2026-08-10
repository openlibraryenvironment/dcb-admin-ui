import { gql } from "graphql-request";

export const getLibraries = gql`
	query LoadLibraries(
		$pageno: Int!
		$pagesize: Int!
		$order: String!
		$query: String!
		$orderBy: String!
	) {
		libraries(
			pageno: $pageno
			pagesize: $pagesize
			order: $order
			query: $query
			orderBy: $orderBy
		) {
			content {
				id
				fullName
				shortName
				abbreviatedName
				agencyCode
				supportHours
				address
				type
				# Required profile fields: without them every library reports the
				# profile step as outstanding.
				latitude
				longitude
				# Ids only: the onboarding grid needs to know whether a library has
				# any contacts at all, and without this every library reports the
				# contacts step as outstanding.
				contacts {
					id
				}
				agency {
					id
					code
					name
					authProfile
					hostLms {
						id
						code
						clientConfig
						lmsClientClass
					}
					isSupplyingAgency
					isBorrowingAgency
				}
				secondHostLms {
					id
					code
					clientConfig
					lmsClientClass
				}
				membership {
					libraryGroup {
						id
						code
						name
						type
						consortium {
							id
							name
							dateOfLaunch
							functionalSettings {
								id
								name
								enabled
							}
						}
					}
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
