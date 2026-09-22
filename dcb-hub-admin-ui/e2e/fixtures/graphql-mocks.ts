import type { Page, Route } from "@playwright/test";

// graphql-request (see src/hooks/useGraphQLClient.ts) sends a single POST to
// {VITE_DCB_API_BASE}/graphql with {query, variables, operationName} - the
// same shape cypress/utils/graphql-test-utils.ts matched against, ported here.
function hasOperationName(route: Route, operationName: string): boolean {
	const body = route.request().postDataJSON();
	return body?.operationName === operationName;
}

/**
 * Fixture data for an operation, or a function of the variables it was sent.
 *
 * The function form exists so a spec can assert WHAT the application sent, not only
 * what it did with the answer. Doing that with a second `page.route` does not work:
 * handlers over the same pattern chain in reverse registration order, and a
 * `route.fallback()` from the newer one lands on this handler's `route.continue()`,
 * which has no server behind it and 500s the page.
 */
type OperationMock = unknown | ((variables: any) => unknown);
type OperationMocks = Record<string, OperationMock>;

// Registers one page.route handler that dispatches by operationName to the
// fixture data supplied. Any operation not in `mocks` falls through to
// route.continue(), so unhandled queries fail loudly instead of hanging.
export async function mockGraphQL(page: Page, mocks: OperationMocks) {
	await page.route("**/graphql", async (route) => {
		for (const [operationName, mock] of Object.entries(mocks)) {
			if (hasOperationName(route, operationName)) {
				const data =
					typeof mock === "function"
						? mock(route.request().postDataJSON()?.variables)
						: mock;
				await route.fulfill({ json: { data } });
				return;
			}
		}
		await route.continue();
	});
}
