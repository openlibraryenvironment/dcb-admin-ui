import { describe, expect, it } from "vitest";
import { resolveGraphQLEndpoint } from "./createGraphQLClient";

describe("resolveGraphQLEndpoint", () => {
	it("resolves an origin-relative runtime API base", () => {
		expect(
			resolveGraphQLEndpoint("/dcb-api", "https://admin.dcb.localhost"),
		).toBe("https://admin.dcb.localhost/dcb-api/graphql");
	});

	it("preserves an absolute runtime API base", () => {
		expect(
			resolveGraphQLEndpoint(
				"https://api.example.test/dcb",
				"https://admin.example.test",
			),
		).toBe("https://api.example.test/dcb/graphql");
	});
});
