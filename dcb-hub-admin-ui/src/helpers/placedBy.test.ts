import { describe, expect, it } from "vitest";

import { placedBy } from "./placedBy";

describe("placedBy", () => {
	it("tells staff from the patron", () => {
		expect(placedBy(true)).toBe("staff");
		expect(placedBy(false)).toBe("patron");
	});

	it("does not read a request dcb-service cannot place as the patron's", () => {
		expect(placedBy(null)).toBe("unknown");
		expect(placedBy(undefined)).toBe("unknown");
	});
});
