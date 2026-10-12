import { describe, expect, it } from "vitest";

import { requestErrorSummary } from "@helpers/safeErrorLog";

/**
 * The patron barcode must not survive into the console - W-5.
 *
 * Fails against the code this replaced, which passed the AxiosError itself to
 * console.error: `config.data` is the request body, and the body of
 * POST /patron/auth/lookup is `{ patronPrinciple: <the barcode> }`.
 */
describe("requestErrorSummary", () => {
	const BARCODE = "29551000123456";

	const axiosLikeError = (over: Record<string, unknown> = {}) => ({
		name: "AxiosError",
		message: "Request failed with status code 401",
		code: "ERR_BAD_REQUEST",
		config: {
			method: "post",
			url: "/patron/auth/lookup",
			// Exactly what axios puts there, and the reason this helper exists.
			data: JSON.stringify({
				patronPrinciple: BARCODE,
				agencyCode: "ALPHA",
			}),
			headers: { Authorization: "Bearer a.real.token" },
		},
		response: {
			status: 401,
			statusText: "Unauthorized",
			data: { failedChecks: [{ description: `No patron ${BARCODE}` }] },
		},
		...over,
	});

	it("names the request and its status", () => {
		expect(requestErrorSummary(axiosLikeError())).toBe(
			"POST /patron/auth/lookup -> 401 Unauthorized",
		);
	});

	it("carries neither the barcode, the token, nor the response body", () => {
		const summary = requestErrorSummary(axiosLikeError());

		expect(summary).not.toContain(BARCODE);
		expect(summary).not.toContain("patronPrinciple");
		expect(summary).not.toContain("Bearer");
		expect(summary).not.toContain("failedChecks");
	});

	it("drops a query string, where an identifier also ends up", () => {
		const summary = requestErrorSummary(
			axiosLikeError({
				config: {
					method: "get",
					url: `/patrons/requests?barcode=${BARCODE}`,
				},
			}),
		);

		expect(summary).toBe("GET /patrons/requests -> 401 Unauthorized");
		expect(summary).not.toContain(BARCODE);
	});

	it("falls back to the transport code when there is no response", () => {
		expect(
			requestErrorSummary(
				axiosLikeError({ response: undefined, code: "ECONNABORTED" }),
			),
		).toBe("POST /patron/auth/lookup -> ECONNABORTED");
	});

	it("survives something that is not an error object at all", () => {
		expect(requestErrorSummary(undefined)).toBe("request failed (no detail)");
		expect(requestErrorSummary("boom")).toBe("request failed (no detail)");
	});
});
