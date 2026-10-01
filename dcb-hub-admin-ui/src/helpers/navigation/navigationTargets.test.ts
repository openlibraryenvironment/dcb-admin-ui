import { describe, expect, it } from "vitest";

import { DATA_GRID_TYPES } from "@constants/dataGrid/types";
import { resolveRowClickPath } from "@helpers/dataGrid/resolveRowClickPath";
import { dataChangeLogEntityPath } from "@helpers/dataChangeLogHelperFunctions";
import { getBreadcrumbKey } from "@helpers/breadcrumbs/getBreadcrumbKey";
import { getSpecialRedirects } from "@helpers/breadcrumbs/getSpecialRedirects";
import { TABS as LIBRARY_TABS } from "@constants/libraryTabs";
import { TABS as GROUP_TABS } from "@constants/groupTabs";
import { MAPPING_TABS, mappingTabPath } from "@constants/mappingsTabs";
import {
	createRouteMatcher,
	SAMPLE_ID,
	type RouteResolution,
} from "./testRouter";
import { readRouteTreePaths } from "./routeTreePaths";

const match = createRouteMatcher();

/**
 * Whether `pathname` addresses the page its author meant.
 *
 * Route existence alone is not the question, and assuming it was is how both defects
 * this file guards shipped green: `/patronRequests/<locationId>` and
 * `/patronRequests/audits` each match a real route. So a target must ALSO bind every
 * path parameter to a value that is genuinely an id. A parameter that swallowed a
 * static segment - "audits", "undefined", a grid type - is a wrong destination
 * wearing a valid route's URL.
 */
const describeTarget = (
	pathname: string,
	ids: string[],
): { ok: boolean; why: string; resolution: RouteResolution } => {
	const resolution = match(pathname);
	if (!resolution.route) {
		return { ok: false, why: "matches no route", resolution };
	}
	const smuggled = Object.entries(resolution.params).filter(
		([, value]) => !ids.includes(value),
	);
	if (smuggled.length > 0) {
		const bindings = smuggled
			.map(([key, value]) => key + '="' + value + '"')
			.join(", ");
		return {
			ok: false,
			why:
				"matched " +
				resolution.route +
				" by binding " +
				bindings +
				" - that segment is part of the path, not an id",
			resolution,
		};
	}
	return { ok: true, why: "", resolution };
};

const expectResolves = (pathname: string, ids: string[] = [SAMPLE_ID]) => {
	const { ok, why } = describeTarget(pathname, ids);
	expect(ok, '"' + pathname + '" ' + why).toBe(true);
};

describe("the route tree the app declares", () => {
	it("parses, so every check below runs against real routes", () => {
		const paths = readRouteTreePaths();
		expect(paths).toContain("/locations/$locationId");
		expect(paths).toContain("/libraries/$libraryId/locations/");
		// Neither of these exists, which is what made the two defects possible.
		expect(paths).not.toContain("/libraryLocations/$id");
		expect(paths).not.toContain("/patronRequests/audits");
	});
});

describe("data grid whole-row click targets", () => {
	// Every grid type is either a decision not to route, or a URL that must resolve.
	// A type that is neither non-clickable nor redirected falls to the default
	// `/<type>/<id>`, and six of those were addressing routes this app does not have.
	it.each(DATA_GRID_TYPES)("%s", (type) => {
		const target = resolveRowClickPath(type, SAMPLE_ID);
		if (target === undefined) return; // non-clickable by decision
		expectResolves(target);
	});

	it("sends a library's locations to the location, not to patron requests", () => {
		expect(resolveRowClickPath("libraryLocations", SAMPLE_ID)).toBe(
			"/locations/" + SAMPLE_ID,
		);
	});

	it("has no fall-through to patron requests", () => {
		// The regression this replaces: a type listed as needing redirection but given
		// no branch fell through an `else` to `/patronRequests/<id>`, which resolves -
		// so nothing failed. An unclassified type now keeps its own name in the path,
		// which matches nothing, so the case above fails instead of passing quietly.
		expect(resolveRowClickPath("agencies", SAMPLE_ID)).toBe(
			"/agencies/" + SAMPLE_ID,
		);
		expect(match("/notAGridType/" + SAMPLE_ID).route).toBeUndefined();
	});
});

describe("data change log entity links", () => {
	// Every table name the log can name. calculateEntityLink translated nine of them
	// and both call sites interpolated the result straight into a path, so the rest
	// rendered a link to "/undefined/<entityId>".
	const ENTITY_TYPES = [
		"agency",
		"bib_record",
		"consortium",
		"consortium_contact",
		"functional_setting",
		"host_lms",
		"library",
		"library_contact",
		"library_group",
		"library_group_member",
		"location",
		"numeric_range_mapping",
		"patron_request",
		"person",
		"reference_value_mapping",
	];

	it.each(ENTITY_TYPES)("%s links somewhere real, or nowhere", (entityType) => {
		const path = dataChangeLogEntityPath(entityType, SAMPLE_ID);
		if (path === undefined) return; // no page for this entity kind
		expectResolves(path);
	});

	it("never produces a path containing undefined", () => {
		for (const entityType of [...ENTITY_TYPES, "a_table_added_next_release"]) {
			const path = dataChangeLogEntityPath(entityType, SAMPLE_ID);
			expect(path ?? "").not.toContain("undefined");
		}
	});

	it("offers no link for a kind the log names but the app cannot show", () => {
		// Each of these is logged and none has a detail route: the two mapping kinds
		// have only a list page, which takes no id.
		for (const entityType of [
			"consortium",
			"consortium_contact",
			"functional_setting",
			"library_contact",
			"library_group_member",
			"person",
			"reference_value_mapping",
			"numeric_range_mapping",
		]) {
			expect(
				dataChangeLogEntityPath(entityType, SAMPLE_ID),
				entityType + " should not link",
			).toBeUndefined();
		}
	});

	it("offers no link for a record that has been deleted", () => {
		expect(
			dataChangeLogEntityPath("library", SAMPLE_ID, { deleted: true }),
		).toBeUndefined();
	});
});

describe("breadcrumb trails", () => {
	// Breadcrumb hrefs are built by slicing the current path, so every intermediate
	// segment becomes a link whether or not a route answers it.
	const TITLE = "Example Library";

	/** The crumbs Breadcrumbs renders for `pathname`, excluding the current page. */
	const trailFor = (pathname: string) => {
		const segments = pathname.split("/").filter(Boolean);
		return segments.slice(0, -1).map((_, index) => {
			const prefix = segments.slice(0, index + 1);
			const href = "/" + prefix.join("/");
			const key = getBreadcrumbKey(prefix, TITLE);
			const lastSegment = prefix[prefix.length - 1];
			return {
				key,
				href,
				destination: getSpecialRedirects(
					key,
					href,
					pathname.startsWith("/search/") && lastSegment.length === 36,
				),
			};
		});
	};

	/** Every route path, with its parameters filled in as a real URL would have them. */
	const CONCRETE_ROUTES = readRouteTreePaths()
		.map((routePath) =>
			routePath
				.split("/")
				.map((segment) => (segment.startsWith("$") ? SAMPLE_ID : segment))
				.join("/"),
		)
		.filter((pathname) => pathname !== "/" && !pathname.includes("$"));

	it.each(CONCRETE_ROUTES)("%s", (pathname) => {
		for (const crumb of trailFor(pathname)) {
			if (!crumb.destination) continue; // not a page, rendered as text
			if (crumb.destination.startsWith("/search?")) continue; // a search, not a path
			const { ok, why } = describeTarget(crumb.destination, [SAMPLE_ID]);
			expect(
				ok,
				'on "' +
					pathname +
					'" the "' +
					crumb.key +
					'" crumb links to "' +
					crumb.destination +
					'", which ' +
					why,
			).toBe(true);
		}
	});

	it("renders the audit log crumb as text, having no page of its own", () => {
		const trail = trailFor("/patronRequests/audits/" + SAMPLE_ID);
		const auditCrumb = trail.find((crumb) => crumb.key === "nav.auditLog");
		expect(
			auditCrumb,
			"the audit log crumb should be in the trail",
		).toBeDefined();
		expect(auditCrumb?.destination).toBeUndefined();
		// Why it cannot simply link to its own href: that href resolves, to the wrong page.
		expect(match("/patronRequests/audits").route).toBe("/patronRequests/$id/");
	});
});

describe("tab bar destinations", () => {
	// A tab bar is a list of paths in a constant, so a route renamed on one side and not
	// the other is invisible until somebody clicks. tabsAreLinks.test.ts proves each tab
	// IS a link; this proves the link goes somewhere.
	it.each(LIBRARY_TABS.map((tab) => tab.path))("a library's %s tab", (path) => {
		expectResolves("/libraries/" + SAMPLE_ID + path);
	});

	it.each(GROUP_TABS.map((tab) => tab.path))("a group's %s tab", (path) => {
		expectResolves("/groups/" + SAMPLE_ID + path);
	});

	it.each(MAPPING_TABS.map((tab) => tab.type + "/" + tab.category))(
		"the %s mappings tab",
		(label) => {
			const tab = MAPPING_TABS.find(
				(candidate) => candidate.type + "/" + candidate.category === label,
			)!;
			expectResolves(mappingTabPath(SAMPLE_ID, tab.type, tab.category));
		},
	);
});

describe("navigation targets carry no query or fragment in the path", () => {
	// The router reads `to` as a pathname alone: it does not split a "?" or a "#" out
	// of it. A hand-built "/patronRequests/<id>#auditlog" bound the id parameter to
	// "<id>#auditlog", so the page loaded nothing and scrolled nowhere. Search params
	// belong in `search`, fragments in `hash`.
	const targets = [
		...DATA_GRID_TYPES.map((type) => resolveRowClickPath(type, SAMPLE_ID)),
		dataChangeLogEntityPath("library", SAMPLE_ID),
	].filter((target): target is string => target !== undefined);

	it.each(targets)("%s", (target) => {
		expect(target).not.toContain("?");
		expect(target).not.toContain("#");
	});
});
