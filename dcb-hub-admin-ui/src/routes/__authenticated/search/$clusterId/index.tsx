import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/search/$clusterId` sends the reader to the Cluster information tab.
 *
 * The layout has five tabs and, until this file, no index child - so the bare path
 * rendered the page chrome, the title and the tab strip around an EMPTY `Outlet`. It is
 * reachable: it is what a hand-typed or truncated link gives you, and what every tab href
 * is built from.
 *
 * `beforeLoad`, so the redirect happens before anything renders rather than as a flash of
 * the empty layout. Guards belong here and not in a useEffect that renders first - see
 * the route rules in CLAUDE.md.
 *
 * Deliberately NOT added to ROUTES: it resolves to its own child, so the gates that walk
 * that list already measure what a visitor sees.
 */
export const Route = createFileRoute("/__authenticated/search/$clusterId/")({
	beforeLoad: ({ params: { clusterId } }) => {
		throw redirect({
			to: "/search/$clusterId/cluster",
			params: { clusterId },
			replace: true,
		});
	},
});
