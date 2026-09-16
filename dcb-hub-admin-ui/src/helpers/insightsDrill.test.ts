import { describe, expect, it } from "vitest";

import {
	clusterDrill,
	errorDrill,
	failureDrill,
	partnerDrill,
	supplierDrill,
} from "./insightsDrill";

/**
 * The query a panel sends into the request grid.
 *
 * Every field named here is asserted against a real database in dcb-service's
 * PatronRequestQueryFilterTests; what is checked here is the composition, the escaping and
 * the window - the parts that live on this side.
 */

const WINDOW = {
	startDate: "2026-08-01T00:00:00.000Z",
	endDate: "2026-09-01T00:00:00.000Z",
};

describe("a drill-down query", () => {
	it("carries the window, so the grid answers the number that was clicked", () => {
		expect(failureDrill("NO_ITEMS_SELECTABLE", WINDOW).q).toBe(
			'previousStatus:"NO_ITEMS_SELECTABLE" AND dateCreated:' +
				"[2026-08-01T00:00:00.000Z TO 2026-09-01T00:00:00.000Z]",
		);
	});

	it("omits the window rather than sending half a range", () => {
		// A one-sided range is not a narrower filter, it is a syntax error - and the grid
		// would show the reader an empty page with no way to tell why.
		expect(supplierDrill("alpha-lms", {}).q).toBe(
			'supplyingAgencyCode:"alpha-lms"',
		);
		expect(supplierDrill("alpha-lms", { startDate: WINDOW.startDate }).q).toBe(
			'supplyingAgencyCode:"alpha-lms"',
		);
	});

	it("escapes only what would break out of the quoted phrase", () => {
		// A Host LMS code is configuration, not a controlled vocabulary, so a quote in one
		// would otherwise end the phrase early and turn the rest of the value into query
		// syntax.
		expect(supplierDrill('we"ird', {}).q).toBe(
			'supplyingAgencyCode:"we\\"ird"',
		);
		expect(supplierDrill("a\\b", {}).q).toBe('supplyingAgencyCode:"a\\\\b"');
	});

	it("leaves a hyphen alone, because every Host LMS code has one", () => {
		// Inside quotes Lucene takes a hyphen literally. Escaping it would send
		// `alpha\-lms` where dcb-service's own test proves `alpha-lms` matches.
		expect(supplierDrill("alpha-lms", {}).q).toBe(
			'supplyingAgencyCode:"alpha-lms"',
		);
	});

	it("names both halves of a trading pair, because either alone is a larger set", () => {
		expect(partnerDrill("borrower-lms", "supplier-lms", WINDOW).q).toBe(
			'patronHostlmsCode:"borrower-lms" AND supplyingAgencyCode:"supplier-lms" ' +
				"AND dateCreated:[2026-08-01T00:00:00.000Z TO 2026-09-01T00:00:00.000Z]",
		);
	});

	it("leaves an identifier unquoted", () => {
		// Quoting makes the parser read a UUID as a phrase rather than as the field
		// comparison the column needs.
		expect(clusterDrill("6f3a1c2e-0000-4000-8000-000000000001", {}).q).toBe(
			"bibClusterId:6f3a1c2e-0000-4000-8000-000000000001",
		);
	});

	it("sends failures and errors to the exception tab, and the rest to all", () => {
		// The tab IS part of the filter: the exception preset already says status:"ERROR",
		// so the link does not repeat it and cannot contradict it.
		expect(failureDrill("X", {}).to).toBe("/patronRequests/exception");
		expect(errorDrill(WINDOW).to).toBe("/patronRequests/exception");

		expect(supplierDrill("x", {}).to).toBe("/patronRequests/all");
		expect(partnerDrill("a", "b", {}).to).toBe("/patronRequests/all");
		expect(clusterDrill("id", {}).to).toBe("/patronRequests/all");
	});

	it("is the window alone for the headline error rate", () => {
		// Everything that failed: the exception tab's own preset is the whole filter.
		expect(errorDrill(WINDOW).q).toBe(
			"dateCreated:[2026-08-01T00:00:00.000Z TO 2026-09-01T00:00:00.000Z]",
		);
		expect(errorDrill({}).q).toBe("");
	});
});
