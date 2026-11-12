// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import { useCustomColumns } from "./useCustomColumns";

describe("useCustomColumns", () => {
	it("returns the same columns on every render", () => {
		const { result, rerender } = renderHook(() => useCustomColumns());
		const first = result.current;

		rerender();

		expect(result.current).toBe(first);
	});
});
