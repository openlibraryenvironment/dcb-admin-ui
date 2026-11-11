// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { downloadBlob } from "./downloadBlob";

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("downloadBlob", () => {
	it("keeps the URL alive until the click has been handled", () => {
		vi.useFakeTimers();
		URL.createObjectURL = vi.fn(() => "blob:file");
		URL.revokeObjectURL = vi.fn();
		vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

		downloadBlob("file.csv", new Blob(["a"]));
		expect(URL.revokeObjectURL).not.toHaveBeenCalled();

		vi.runAllTimers();
		expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:file");
	});
});
