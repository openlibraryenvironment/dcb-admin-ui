import { describe, expect, it } from "vitest";
import type { AxiosInstance } from "axios";

import { liveItemQuery } from "./liveItem";

// Each attempt is two to four calls into a member library's system, with no server-side limit
describe("liveItemQuery", () => {
	it("is never retried", () => {
		expect(liveItemQuery({} as AxiosInstance, "alpha-lms", "1234").retry).toBe(
			false,
		);
	});
});
