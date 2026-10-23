import { describe, expect, it } from "vitest";
import { AxiosHeaders } from "axios";

import {
	REQUEST_ID_HEADER,
	fetchWithRequestReference,
	newRequestReference,
	requestReferenceOf,
} from "./requestReference";

// dcb-service keeps a caller's id only if it matches this (docs/request-id.md)
const ACCEPTED = /^[A-Za-z0-9._-]{1,64}$/;

describe("newRequestReference", () => {
	it("makes an id dcb-service keeps, different each time", () => {
		const first = newRequestReference();

		expect(first).toMatch(/^adm-[0-9a-f]{12}$/);
		expect(first).toMatch(ACCEPTED);
		expect(newRequestReference()).not.toBe(first);
	});
});

describe("fetchWithRequestReference", () => {
	it("sends the reference and carries it back on the response", async () => {
		let sent: string | null = null;
		const fetch = fetchWithRequestReference(async (_input, init) => {
			sent = new Headers(init?.headers).get(REQUEST_ID_HEADER);
			return new Response("{}", { status: 500 });
		});

		const response = await fetch("https://dcb.example/graphql", {
			headers: { Authorization: "Bearer token" },
		});

		expect(sent).toMatch(/^adm-/);
		expect(response.status).toBe(500);
		expect(response.headers.get(REQUEST_ID_HEADER)).toBe(sent);
	});

	it("keeps the headers the caller set", async () => {
		let authorization: string | null = null;
		const fetch = fetchWithRequestReference(async (_input, init) => {
			authorization = new Headers(init?.headers).get("Authorization");
			return new Response("{}");
		});

		await fetch("https://dcb.example/graphql", {
			headers: { Authorization: "Bearer token" },
		});

		expect(authorization).toBe("Bearer token");
	});

	it("names the reference when the call never reached dcb-service", async () => {
		const fetch = fetchWithRequestReference(async () => {
			throw new TypeError("Failed to fetch");
		});

		const failure = await fetch("https://dcb.example/graphql").catch(
			(error: unknown) => error,
		);

		expect(requestReferenceOf(failure)).toMatch(/^adm-/);
	});
});

describe("requestReferenceOf", () => {
	it("reads a graphql-request error's response headers", () => {
		const headers = new Headers({ [REQUEST_ID_HEADER]: "adm-0123456789ab" });

		expect(requestReferenceOf({ response: { status: 500, headers } })).toBe(
			"adm-0123456789ab",
		);
	});

	it("reads an axios error's request config", () => {
		const headers = new AxiosHeaders({
			[REQUEST_ID_HEADER]: "adm-ba9876543210",
		});

		expect(requestReferenceOf({ config: { headers } })).toBe(
			"adm-ba9876543210",
		);
	});

	it.each([[null], [undefined], ["boom"], [new Error("no reference")]])(
		"says nothing when there is no reference: %s",
		(error) => {
			expect(requestReferenceOf(error)).toBeNull();
		},
	);
});
