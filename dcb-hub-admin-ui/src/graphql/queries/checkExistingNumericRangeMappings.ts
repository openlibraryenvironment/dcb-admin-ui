import { gql } from "graphql-request";

export const checkExistingNumericRangeMappings = gql`
	query CheckExistingNumericRangeMappings($pagesize: Int!, $query: String!) {
		numericRangeMappings(pagesize: $pagesize, query: $query) {
			totalSize
			content {
				id
				context
				domain
				lowerBound
				upperBound
				targetContext
				mappedValue
				deleted
				lastImported
			}
		}
	}
`;
