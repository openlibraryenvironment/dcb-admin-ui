import type { Page, Route } from "@playwright/test";

// graphql-request (see src/hooks/useGraphQLClient.ts) sends a single POST to
// {VITE_DCB_API_BASE}/graphql with {query, variables, operationName} - the
// same shape cypress/utils/graphql-test-utils.ts matched against, ported here.
function hasOperationName(route: Route, operationName: string): boolean {
	const body = route.request().postDataJSON();
	return body?.operationName === operationName;
}

type OperationMocks = Record<string, unknown>;

// Registers one page.route handler that dispatches by operationName to the
// fixture data supplied. Any operation not in `mocks` falls through to
// route.continue(), so unhandled queries fail loudly instead of hanging.
export async function mockGraphQL(page: Page, mocks: OperationMocks) {
	await page.route("**/graphql", async (route) => {
		for (const [operationName, data] of Object.entries(mocks)) {
			if (hasOperationName(route, operationName)) {
				await route.fulfill({ json: { data } });
				return;
			}
		}
		await route.continue();
	});
}
