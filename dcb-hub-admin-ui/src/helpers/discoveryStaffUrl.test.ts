import { describe, expect, it } from "vitest";

import { discoveryStaffUrl } from "./discoveryStaffUrl";

describe("discoveryStaffUrl", () => {
	it("offers nothing when the deployment names no discovery app", () => {
		expect(discoveryStaffUrl(undefined)).toBeNull();
		expect(discoveryStaffUrl("")).toBeNull();
	});

	it("points at the staff pages of a discovery app at the origin root", () => {
		expect(discoveryStaffUrl("https://discovery.example.org")).toBe(
			"https://discovery.example.org/staff",
		);
		expect(discoveryStaffUrl("https://discovery.example.org/")).toBe(
			"https://discovery.example.org/staff",
		);
	});

	it("keeps a path prefix, with or without its trailing slash", () => {
		expect(discoveryStaffUrl("https://example.org/discovery")).toBe(
			"https://example.org/discovery/staff",
		);
		expect(discoveryStaffUrl("https://example.org/discovery/")).toBe(
			"https://example.org/discovery/staff",
		);
	});

	it("refuses anything that is not a web address", () => {
		expect(discoveryStaffUrl("javascript:alert(1)")).toBeNull();
		expect(discoveryStaffUrl("discovery.example.org")).toBeNull();
	});
});
