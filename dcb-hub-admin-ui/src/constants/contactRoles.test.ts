import { describe, it, expect } from "vitest";

import { CONTACT_ROLE_OPTIONS } from "./contactRoles";

describe("CONTACT_ROLE_OPTIONS", () => {
	// dcb-service's RoleName enum: the create data fetchers reject anything else
	it("offers exactly the roles dcb-service accepts", () => {
		expect(CONTACT_ROLE_OPTIONS.map((option) => option.value).sort()).toEqual(
			[
				"IMPLEMENTATION_CONTACT",
				"LIBRARY_SERVICES_ADMINISTRATOR",
				"OPERATIONS_CONTACT",
				"SIGN_OFF_AUTHORITY",
				"SPONSOR",
				"SUPPORT",
				"TECHNICAL_CONTACT",
			].sort(),
		);
	});
});
