import { describe, expect, it } from "vitest";

import { GraphQLError } from "graphql";
import { ClientError } from "graphql-request";
import {
	errorForDisplay,
	errorForLog,
	requestErrorSummary,
} from "@helpers/safeErrorLog";

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

describe("errorForLog", () => {
	it("keeps a request's token, body and variables out of the console", () => {
		const axiosLike = {
			name: "AxiosError",
			message: "Request failed with status code 500",
			config: {
				method: "post",
				url: "/patrons/requests/abc/transition/cleanup",
				headers: { Authorization: "Bearer a.real.token" },
			},
			response: { status: 500, statusText: "Server Error" },
		};
		const logged = errorForLog(axiosLike);
		expect(logged).toBe(
			"POST /patrons/requests/abc/transition/cleanup -> 500 Server Error",
		);
		expect(logged).not.toContain("Bearer");

		const clientError = Object.assign(new Error("GraphQL Error {variables}"), {
			response: { status: 200, errors: [] },
			request: { query: "query X", variables: { barcode: "29551000123456" } },
		});
		expect(errorForLog(clientError)).not.toContain("29551000123456");
	});

	it("keeps a crash's stack", () => {
		const crash = new TypeError("cannot read properties of undefined");
		expect(errorForLog(crash)).toContain("cannot read properties of undefined");
		expect(errorForLog(crash)).toContain("TypeError");
	});

	it("names anything else that was thrown", () => {
		expect(errorForLog("plain")).toBe("plain");
	});
});

describe("errorForDisplay", () => {
	it("keeps a GraphQL request's variables off the page", () => {
		const clientError = new ClientError(
			{
				status: 200,
				headers: new Headers(),
				body: "",
				errors: [new GraphQLError("Patron not found")],
			},
			{ query: "query X", variables: { barcode: "29551000123456" } },
		);
		expect(clientError.message).toContain("29551000123456");
		expect(errorForDisplay(clientError)).not.toContain("29551000123456");
	});

	it("shows any other error's message, without its stack", () => {
		const crash = new TypeError("cannot read properties of undefined");
		expect(errorForDisplay(crash)).toBe("cannot read properties of undefined");
	});

	it("names anything else that was thrown", () => {
		expect(errorForDisplay("plain")).toBe("plain");
	});
});
