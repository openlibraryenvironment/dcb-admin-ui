import { describe, expect, it } from "vitest";

import { isClientError, lmsFanOutQuery, nonCriticalQuery } from "./queryPolicy";

const withStatus = (status: number) => ({ response: { status } });

describe("isClientError", () => {
	it("is true across 4xx and false either side of it", () => {
		expect(isClientError(withStatus(400))).toBe(true);
		expect(isClientError(withStatus(404))).toBe(true);
		expect(isClientError(withStatus(499))).toBe(true);
		expect(isClientError(withStatus(399))).toBe(false);
		expect(isClientError(withStatus(500))).toBe(false);
		expect(isClientError(withStatus(503))).toBe(false);
	});

	it("is false for an error carrying no status", () => {
		// A network failure has no response at all, and must stay retryable.
		expect(isClientError(new Error("Network Error"))).toBe(false);
		expect(isClientError(undefined)).toBe(false);
		expect(isClientError(null)).toBe(false);
	});
});

describe("lmsFanOutQuery", () => {
	const { retry } = lmsFanOutQuery;

	it("does not retry a 4xx, so one 404 is one fan-out", () => {
		expect(retry(0, withStatus(404))).toBe(false);
		expect(retry(0, withStatus(400))).toBe(false);
	});

	it("keeps the client default's budget for a 5xx or a network failure", () => {
		// `retry: 1` on the query client is two attempts; this is the same.
		expect(retry(0, withStatus(503))).toBe(true);
		expect(retry(1, withStatus(503))).toBe(false);
		expect(retry(0, new Error("Network Error"))).toBe(true);
		expect(retry(1, new Error("Network Error"))).toBe(false);
	});
});

describe("nonCriticalQuery", () => {
	it("does not throw to the route error boundary", () => {
		// The whole point: GlobalError replaces the route, so a query for a label
		// must not be able to reach it. docs/query-error-policy.md.
		expect(nonCriticalQuery.throwOnError).toBe(false);
	});
});
