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

/**
 * Answer a few operations differently for ONE route, leaving the shared set alone.
 *
 * Registered after `mockGraphQL`, so it is matched first - Playwright chains handlers
 * over the same pattern in reverse registration order. What it does not handle it passes
 * on with `route.fallback()`.
 *
 * The warning on `OperationMock` above still holds and this is not a counter-example:
 * there, the newer handler fell back on an operation the older one did not have either,
 * so the fallback reached `route.continue()` and 500'd the page. Here every operation
 * that falls through IS in the shared set, which is the whole point - this only
 * overrides.
 *
 * It exists because the shared MOCKS answer `LoadAgency`, `LoadLocation` and
 * `LoadLibraryBasics` EMPTY on purpose: the patron request detail page needs them empty
 * to exercise its own "unable to retrieve" paths. The agency and location detail routes
 * need the opposite, and before this they could not be in ROUTES at all - "fixing one
 * breaks the other".
 */
export async function overrideGraphQL(page: Page, mocks: OperationMocks) {
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
		await route.fallback();
	});
}
