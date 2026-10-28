import { afterEach, describe, expect, it } from "vitest";

import { configureAppBase, toRouteHref } from "./appBase";

const at = (pathname: string, search = "", hash = "") => ({
	pathname,
	search,
	hash,
});

describe("toRouteHref", () => {
	afterEach(() => configureAppBase("/"));

	it("keeps a grid's view, which is its search, and the hash", () => {
		expect(
			toRouteHref(
				at(
					"/patronRequests/all",
					"?filters=description:contains:Alpha&sort=dateCreated:asc&page=2",
					"#auditlog",
				),
			),
		).toBe(
			"/patronRequests/all?filters=description:contains:Alpha&sort=dateCreated:asc&page=2#auditlog",
		);
	});

	it("is a router path under a base path, which the router navigates within", () => {
		configureAppBase("/dcb-admin/");
		expect(toRouteHref(at("/dcb-admin/libraries", "?page=2"))).toBe(
			"/libraries?page=2",
		);
	});
});
