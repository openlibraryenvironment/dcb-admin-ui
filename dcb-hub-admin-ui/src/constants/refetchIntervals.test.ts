import { describe, expect, it } from "vitest";

import {
	DETAIL_REFETCH_MS,
	detailRefetchInterval,
} from "@constants/refetchIntervals";

describe("detailRefetchInterval", () => {
	it("polls a page nobody is editing", () => {
		expect(detailRefetchInterval(false)).toBe(DETAIL_REFETCH_MS);
	});

	it("stops while a form is being edited", () => {
		expect(detailRefetchInterval(true)).toBe(false);
	});
});
