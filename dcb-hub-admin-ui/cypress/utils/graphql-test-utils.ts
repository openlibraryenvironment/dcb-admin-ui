// Utilities for auto-aliasing GraphQL queries, which are sometimes tricky to intercept because they come from the same URL.
// https://docs.cypress.io/guides/end-to-end-testing/working-with-graphql
export const hasOperationName = (req: { body: any }, operationName: any) => {
	const { body } = req;
	return (
		Object.prototype.hasOwnProperty.call(body, "operationName") &&
		body.operationName === operationName
	);
};

// Finds the query title if it's not specified in operationName.
export const hasQuery = (req: { body: any }, query: string) => {
	const { body } = req;
	const extractedQuery = body.query.split(" ");
	console.log(extractedQuery[1], query);
	if (extractedQuery[1] === query) {
		console.log("Match");
		return true;
	} else {
		console.log("No match");
		return false;
	}
};

// Alias query if operationName matches
// export const aliasQuery = (req: any, operationName: any) => {
//     if (hasOperationName(req, operationName)) {
//       req.alias = `gql${operationName}Query`
//     }
// }
export const aliasQuery = (req: any, query: any) => {
	if (hasQuery(req, query)) {
		req.alias = `gql${query}Query`;
	} else {
		console.log("No alias");
	}
};
// Alias mutation if operationName matches
export const aliasMutation = (req: any, operationName: any) => {
	if (hasOperationName(req, operationName)) {
		req.alias = `gql${operationName}Mutation`;
	}
};
