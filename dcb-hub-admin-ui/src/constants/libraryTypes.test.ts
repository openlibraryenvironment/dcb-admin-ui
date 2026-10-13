import { describe, it, expect } from "vitest";

import { isUnlistedLibraryType } from "./libraryTypes";

describe("isUnlistedLibraryType", () => {
	it("flags a stored type outside the list so it can be shown and replaced", () => {
		expect(isUnlistedLibraryType("University")).toBe(true);
		expect(isUnlistedLibraryType("Academic")).toBe(false);
		expect(isUnlistedLibraryType("")).toBe(false);
	});
});
