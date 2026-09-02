import { describe, expect, it, afterEach, vi } from "vitest";

import {
	readConsortiumBrand,
	stripUnsupportedConsortiumInput,
} from "@helpers/consortiumBrand";
import { consortiumBrandSelection } from "@fragments/consortiumBrand";

const withFlag = (value: boolean) =>
	vi.stubGlobal("window", {
		__APP_ENV__: { VITE_FEATURE_CONSORTIUM_BRANDING: value ? "true" : "false" },
	});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("readConsortiumBrand", () => {
	it("reads the 9.0.0 brand columns", () => {
		expect(
			readConsortiumBrand({
				brandHeaderIconUrl: "/icon.png",
				brandLogoUrl: "/logo.png",
			}),
		).toEqual({ headerIconUrl: "/icon.png", logoUrl: "/logo.png" });
	});

	it("reads the pre-migration columns an 8.71.0 deployment answers with", () => {
		// The point of the fallback: deploying this release against 8.71.0 must not
		// visibly REMOVE branding the deployment already shows.
		expect(
			readConsortiumBrand({
				headerImageUrl: "/old-icon.png",
				aboutImageUrl: "/old-logo.png",
			}),
		).toEqual({ headerIconUrl: "/old-icon.png", logoUrl: "/old-logo.png" });
	});

	it("prefers the merged columns when a response carries both", () => {
		expect(
			readConsortiumBrand({
				brandHeaderIconUrl: "/new.png",
				headerImageUrl: "/old.png",
				brandLogoUrl: "/new-logo.png",
				aboutImageUrl: "/old-logo.png",
			}),
		).toEqual({ headerIconUrl: "/new.png", logoUrl: "/new-logo.png" });
	});

	it("keeps a deliberately cleared mark cleared", () => {
		// `??` not `||`. An administrator who removed a mark gets no mark, not the
		// pre-migration column's value resurrected underneath them.
		expect(
			readConsortiumBrand({
				brandHeaderIconUrl: "",
				headerImageUrl: "/old.png",
				brandLogoUrl: "",
				aboutImageUrl: "/old-logo.png",
			}),
		).toEqual({ headerIconUrl: "", logoUrl: "" });
	});

	it("answers with strings for a missing or absent consortium", () => {
		expect(readConsortiumBrand(null)).toEqual({
			headerIconUrl: "",
			logoUrl: "",
		});
		expect(readConsortiumBrand(undefined)).toEqual({
			headerIconUrl: "",
			logoUrl: "",
		});
	});
});

describe("stripUnsupportedConsortiumInput", () => {
	const input = {
		id: "c-1",
		reason: "why",
		changeCategory: "Initial setup",
		description: "prose",
		brandLogoUrl: "",
		brandLogoAlt: "",
		brandHeaderIconUrl: "/icon.png",
		brandBackgroundImageUrl: "",
		patronWelcome: "hello",
		defaultThemeName: "openRS",
	};

	it("removes the brand keys entirely before 9.0.0", () => {
		// REMOVED, not blanked. `brandLogoUrl: ""` is still a field
		// UpdateConsortiumInput does not declare on 8.71.0, and an undeclared input
		// field fails the whole mutation - so nothing on the consortium form would
		// save, brand or not.
		withFlag(false);

		const result = stripUnsupportedConsortiumInput(input);

		expect(Object.keys(result).sort()).toEqual([
			"changeCategory",
			"description",
			"id",
			"reason",
		]);
	});

	it("keeps everything from 9.0.0 onwards", () => {
		withFlag(true);

		expect(stripUnsupportedConsortiumInput(input)).toEqual(input);
	});

	it("never mutates the caller's input", () => {
		withFlag(false);
		const original = { ...input };

		stripUnsupportedConsortiumInput(input);

		expect(input).toEqual(original);
	});
});

describe("consortiumBrandSelection", () => {
	it("selects the merged columns from 9.0.0 onwards", () => {
		withFlag(true);

		expect(consortiumBrandSelection("chrome").split(/\s+/)).toEqual([
			"brandHeaderIconUrl",
			"brandLogoUrl",
		]);
		expect(consortiumBrandSelection("full")).toContain("patronWelcome");
	});

	it("selects the pre-migration columns before 9.0.0", () => {
		withFlag(false);

		for (const form of ["chrome", "full"] as const) {
			expect(consortiumBrandSelection(form).split(/\s+/)).toEqual([
				"headerImageUrl",
				"aboutImageUrl",
			]);
		}
	});

	it("never asks 8.71.0 for the uploader fields", () => {
		// They are a member of staff's name and email address on a type any
		// authenticated principal can read, which is why 9.0.0 deleted them. A
		// transitional window is not a reason to put PII back in a browser.
		withFlag(false);

		for (const form of ["chrome", "full"] as const) {
			expect(consortiumBrandSelection(form)).not.toMatch(/Uploader/i);
		}
	});
});
