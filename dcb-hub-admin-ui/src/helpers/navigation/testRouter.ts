import {
	createRootRoute,
	createRoute,
	createRouter,
} from "@tanstack/react-router";
import { createMemoryHistory } from "@tanstack/history";

import { readRouteTreePaths } from "./routeTreePaths";

/**
 * The app's route shapes, matched by the real router.
 *
 * Routes are rebuilt from the generated path list with no components attached, so a
 * navigation test asks TanStack itself "does this URL resolve, and to what" without
 * importing 84 route modules. Reimplementing the matcher would be testing the test:
 * `/patronRequests/audits` looks dead to a naive segment comparison and in fact
 * matches `/patronRequests/$id`, which is the whole reason that bug shipped.
 *
 * Test-only.
 */
export type RouteResolution = {
	/** The matched route's template, e.g. "/locations/$locationId". */
	route: string | undefined;
	/** Path params the URL bound, e.g. { locationId: "…" }. */
	params: Record<string, string>;
};

export function createRouteMatcher(): (pathname: string) => RouteResolution {
	const paths = readRouteTreePaths();
	const rootRoute = createRootRoute({});
	rootRoute.addChildren(
		paths.map((routePath) =>
			createRoute({ path: routePath, getParentRoute: () => rootRoute }),
		),
	);
	const router = createRouter({
		routeTree: rootRoute,
		history: createMemoryHistory({ initialEntries: ["/"] }),
	});

	return (pathname: string) => {
		const matched = router.getMatchedRoutes(pathname);
		return {
			route: matched.foundRoute?.fullPath,
			params: (matched.routeParams ?? {}) as Record<string, string>,
		};
	};
}

/** A row id, an entity id or a record id: what a detail URL's parameter carries. */
export const SAMPLE_ID = "4f8c1b2e-9a3d-4c7f-8e15-2b6d7a0c9e31";
