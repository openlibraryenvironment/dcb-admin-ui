import { describe, expect, it } from "vitest";

import { getBreadcrumbKey, isTranslationKey } from "./getBreadcrumbKey";

/**
 * The fallback is `"nav." + pathArray.join(".")`, so a path this function does not
 * recognise produces a key containing the record's UUID - and the breadcrumb renders
 * that as literal text. It fails silently by construction, which is why it needs a
 * test per tab rather than a spot check. Found by e2e/i18n-missing.spec.ts.
 */
const LIBRARY = "c23df3ab-77c0-5689-b56d-fc8a2d6a5f22";

describe("every library tab has a breadcrumb key", () => {
	it.each([
		["accounts", "nav.libraries.accounts"],
		["bibs", "nav.libraries.bibs"],
		["branding", "nav.libraries.branding"],
		["contacts", "nav.libraries.contacts"],
		["insights", "nav.libraries.insights"],
		["locations", "nav.locations"],
		["service", "nav.libraries.service"],
		["settings", "nav.libraries.settings"],
	])("%s", (tab, expected) => {
		expect(getBreadcrumbKey(["libraries", LIBRARY, tab])).toBe(expected);
	});

	it("never puts the record's id in a key", () => {
		for (const tab of [
			"accounts",
			"bibs",
			"branding",
			"contacts",
			"insights",
			"locations",
			"service",
			"settings",
		]) {
			expect(getBreadcrumbKey(["libraries", LIBRARY, tab])).not.toContain(
				LIBRARY,
			);
		}
	});
});

describe("a key is told apart from a title", () => {
	it("recognises a translation key", () => {
		expect(isTranslationKey("nav.libraries.settings")).toBe(true);
		expect(isTranslationKey("mappings.ref_value")).toBe(true);
	});

	it("rejects a record's own name", () => {
		// getBreadcrumbKey returns the library or group name where the crumb IS the
		// record. Translating it asks i18next for a key by that name.
		expect(isTranslationKey("Alpha Test Library")).toBe(false);
		expect(isTranslationKey("Northern Region")).toBe(false);
	});

	it("rejects a bare id", () => {
		expect(isTranslationKey(LIBRARY)).toBe(false);
	});

	it("returns the title, not a key, for a library with no tab", () => {
		expect(getBreadcrumbKey(["libraries", LIBRARY], "Alpha Test Library")).toBe(
			"Alpha Test Library",
		);
	});
});
