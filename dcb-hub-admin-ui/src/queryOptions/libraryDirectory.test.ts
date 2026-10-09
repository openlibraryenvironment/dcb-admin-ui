import { describe, expect, it } from "vitest";
import type { GraphQLClient } from "graphql-request";

import {
	agencyCodeForHostLmsQuery,
	libraryDirectoryQueryKey,
} from "./libraries";

/**
 * The client-side join that replaced two serial requests on /patronRequests/$id.
 *
 * `Library` has no flat field for a Host LMS code, and the `libraries` fetcher's Lucene
 * builder cannot traverse a relation, so this mapping cannot be asked of the server -
 * which makes the lookup itself the thing to pin.
 */

const client = {} as GraphQLClient;

const directory = {
	libraries: {
		content: [
			{
				id: "lib-1",
				fullName: "Alpha",
				agencyCode: "alpha",
				agency: { code: "alpha", hostLms: { code: "ALPHA-HOST" } },
				secondHostLms: null,
			},
			{
				id: "lib-2",
				fullName: "Beta",
				agencyCode: "beta",
				agency: { code: "beta", hostLms: { code: "BETA-HOST" } },
				// Beta runs a second Host LMS, and a patron's home code can be either.
				secondHostLms: { code: "BETA-SECOND" },
			},
		],
	},
};

// No default for `data`: passing `undefined` to a defaulted parameter uses the default,
// which silently made the absent-directory case assert against a full one.
const lookupIn = (data: unknown, hostLmsCode: string | undefined) => {
	const options = agencyCodeForHostLmsQuery(client, hostLmsCode);
	return (options.select as (d: unknown) => string | undefined)(data);
};
const lookup = (hostLmsCode: string | undefined) =>
	lookupIn(directory, hostLmsCode);

describe("agencyCodeForHostLmsQuery", () => {
	it("finds the agency code through a library's primary Host LMS", () => {
		expect(lookup("ALPHA-HOST")).toBe("alpha");
	});

	it("finds it through a SECOND Host LMS, which a library may also run", () => {
		expect(lookup("BETA-SECOND")).toBe("beta");
	});

	it("is undefined for a code no library carries, rather than a wrong library", () => {
		expect(lookup("GAMMA-HOST")).toBeUndefined();
	});

	it("is undefined before the request's own code is known", () => {
		// The patron request resolves first; this select runs on every render until it
		// does, and must not match a library whose secondHostLms is null.
		expect(lookup(undefined)).toBeUndefined();
	});

	it("survives an empty or absent directory", () => {
		expect(
			lookupIn({ libraries: { content: [] } }, "ALPHA-HOST"),
		).toBeUndefined();
		expect(lookupIn({}, "ALPHA-HOST")).toBeUndefined();
		expect(lookupIn(undefined, "ALPHA-HOST")).toBeUndefined();
	});

	it("shares one cache entry whatever code is being looked up", () => {
		// Three of these render on the patron request page. Different keys would mean
		// three fetches of the same list.
		expect(agencyCodeForHostLmsQuery(client, "ALPHA-HOST").queryKey).toEqual(
			libraryDirectoryQueryKey,
		);
		expect(agencyCodeForHostLmsQuery(client, "BETA-HOST").queryKey).toEqual(
			libraryDirectoryQueryKey,
		);
	});
});
