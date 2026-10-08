import { describe, expect, it } from "vitest";

import { APP_TITLE, documentTitleFor } from "./useDocumentTitle";

describe("the document title", () => {
	it("leads with the page, so a truncated tab still distinguishes it", () => {
		expect(documentTitleFor("Libraries")).toBe("Libraries · DCB Admin");
	});

	it("is just the app where a route names no page", () => {
		expect(documentTitleFor()).toBe(APP_TITLE);
		expect(documentTitleFor("")).toBe(APP_TITLE);
		// A blank title used to produce "DCB Admin | " - a trailing separator and a
		// trailing space, visible in the tab.
		expect(documentTitleFor("   ")).toBe(APP_TITLE);
	});

	it("carries no trailing whitespace", () => {
		expect(documentTitleFor("Settings")).toBe(
			documentTitleFor("Settings").trim(),
		);
	});
});
