import type { Page } from "@playwright/test";

import clusterAuditLog from "../fixtures-data/cluster-audit-log.json";
import clusterAvailability from "../fixtures-data/cluster-availability.json";

/** The cluster the six /search/$clusterId routes are scanned against. */
export const CLUSTER_ID = "aa110000-1111-5111-9111-aaaaaaaaaaaa";

/**
 * The two REST surfaces the cluster tabs read, neither of them GraphQL.
 *
 * `/items/availability` is the live fan-out: dcb-service turns one call into one request
 * per Host LMS to systems we do not own. The items tab fires TWO of them concurrently -
 * once filtered and once with `filters=none` - so one mount is up to two fan-outs, which
 * is why `lmsFanOutQuery` is on that query and why this is the route whose cost is worth
 * knowing. Both are answered from one fixture here; the tab reads the filtered response
 * for its main grid and the unfiltered one for "items not shown".
 */
export async function mockClusterRest(page: Page) {
	await page.route("**/clusters/*/audit-log", (route) =>
		route.fulfill({ json: clusterAuditLog }),
	);

	await page.route("**/items/availability*", (route) =>
		route.fulfill({ json: clusterAvailability }),
	);
}
