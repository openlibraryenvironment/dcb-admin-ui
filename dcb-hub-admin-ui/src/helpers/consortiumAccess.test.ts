import { describe, expect, it } from "vitest";

import { canAccessDcbAdmin, isConsortiumStaff } from "./consortiumAccess";

describe("consortium staff", () => {
	it("admits the two consortium roles", () => {
		expect(isConsortiumStaff(["ADMIN"])).toBe(true);
		expect(isConsortiumStaff(["CONSORTIUM_ADMIN"])).toBe(true);
	});

	it("admits somebody who holds a library role as well", () => {
		// Consortium staff are people at libraries. Reading this as "holds a library
		// role, therefore not consortium staff" would bar exactly the administrators the
		// application exists for.
		expect(isConsortiumStaff(["LIBRARY_ADMIN", "CONSORTIUM_ADMIN"])).toBe(true);
	});

	it("refuses library-only roles", () => {
		expect(isConsortiumStaff(["LIBRARY_ADMIN"])).toBe(false);
		expect(isConsortiumStaff(["LIBRARY_READ_ONLY"])).toBe(false);
	});

	it("refuses an empty or absent roles claim rather than defaulting open", () => {
		// A token that says nothing about roles is not a token that says "permitted".
		expect(isConsortiumStaff([])).toBe(false);
		expect(isConsortiumStaff(undefined)).toBe(false);
	});

	it("is not fooled by a role that merely contains an admitted name", () => {
		expect(isConsortiumStaff(["NOT_ADMIN"])).toBe(false);
		expect(isConsortiumStaff(["CONSORTIUM_ADMIN_READONLY"])).toBe(false);
	});
});

describe("access to DCB Admin", () => {
	it("tracks consortium staff", () => {
		expect(canAccessDcbAdmin(["CONSORTIUM_ADMIN"])).toBe(true);
		expect(canAccessDcbAdmin(["LIBRARY_ADMIN"])).toBe(false);
		expect(canAccessDcbAdmin(undefined)).toBe(false);
	});
});
