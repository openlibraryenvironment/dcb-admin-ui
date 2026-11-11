import { describe, expect, it } from "vitest";

import { serverAdmits } from "./serverRoles";

describe("serverAdmits", () => {
	it.each([
		["supplierActions", ["CONSORTIUM_ADMIN"], true],
		["supplierActions", ["ADMIN"], false],
		["updateAgency", ["CONSORTIUM_ADMIN", "LIBRARY_ADMIN"], true],
		["updateAgency", ["ADMIN"], false],
		["readRulesets", ["ADMIN"], true],
		["readRulesets", ["CONSORTIUM_ADMIN", "LIBRARY_ADMIN"], false],
	] as const)("%s for %j is %s", (operation, roles, expected) => {
		expect(serverAdmits(operation, roles)).toBe(expected);
	});

	it("admits nobody without roles", () => {
		expect(serverAdmits("updateAgency", undefined)).toBe(false);
		expect(serverAdmits("updateAgency", [])).toBe(false);
	});
});
