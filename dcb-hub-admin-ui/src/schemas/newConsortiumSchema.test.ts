import { describe, it, expect } from "vitest";

import { newConsortiumSchema } from "./newConsortiumSchema";

const websiteUrlIssue = (websiteUrl: string) =>
	newConsortiumSchema
		.safeParse({ websiteUrl })
		.error?.issues.some((issue) => issue.path[0] === "websiteUrl");

describe("newConsortiumSchema website", () => {
	it("rejects a link dcb-service would refuse", () => {
		expect(websiteUrlIssue("www.example.org")).toBe(true);
	});

	it("accepts a full web address or none", () => {
		expect(websiteUrlIssue("https://example.org")).toBe(false);
		expect(websiteUrlIssue("")).toBe(false);
	});
});
