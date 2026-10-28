import { describe, expect, it } from "vitest";

import { TAG_COLOURS, tagColour } from "./tagColour";

describe("tagColour", () => {
	it("uses a tag's own colour where dcb-service stores one", () => {
		expect(tagColour("DAMAGED", "success")).toBe("success");
		expect(tagColour("LOCAL_TAG", "info")).toBe("info");
	});

	it("falls back to the starter colour when the stored one is not a palette name", () => {
		expect(tagColour("DAMAGED", "#ff0000")).toBe("error");
		expect(tagColour("DAMAGED", null)).toBe("error");
	});

	it("shows a tag the consortium added in the theme's default", () => {
		expect(tagColour("LOCAL_TAG")).toBe("default");
	});

	// dcb-service's colour migration seeds these; the two must not disagree
	it("gives the five starter tags the colours dcb-service seeds", () => {
		expect({
			DAMAGED: tagColour("DAMAGED"),
			MISSING_PIECES: tagColour("MISSING_PIECES"),
			PATRON_CONTACTED: tagColour("PATRON_CONTACTED"),
			RETURN_DISPUTED: tagColour("RETURN_DISPUTED"),
			SLOW_TO_SHIP: tagColour("SLOW_TO_SHIP"),
		}).toEqual({
			DAMAGED: "error",
			MISSING_PIECES: "warning",
			PATRON_CONTACTED: "info",
			RETURN_DISPUTED: "secondary",
			SLOW_TO_SHIP: "primary",
		});
	});

	it("only names colours MUI's Chip takes", () => {
		expect(TAG_COLOURS).toEqual([
			"default",
			"primary",
			"secondary",
			"info",
			"success",
			"warning",
			"error",
		]);
	});
});
