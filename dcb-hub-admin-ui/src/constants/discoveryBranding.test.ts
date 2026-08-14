import { describe, it, expect } from "vitest";

import {
	BRAND_LIMITS,
	DISCOVERY_THEME_NAMES,
	isValidLogoUrl,
	themeOptions,
} from "./discoveryBranding";
import application from "@/locales/en-GB/application.json";

/**
 * The brand logo URL becomes the `src` of an `<img>` in the chrome of every page of the
 * patron app, on an anonymous route. dcb-service's BrandingValidator is the authority;
 * these cases mirror it so an administrator is told at the field instead of by a rejected
 * save, and so the two cannot drift apart silently.
 */
describe("isValidLogoUrl", () => {
	it("accepts absolute http and https URLs", () => {
		expect(isValidLogoUrl("https://example.org/logo.svg")).toBe(true);
		expect(isValidLogoUrl("http://example.org/logo.svg")).toBe(true);
		expect(isValidLogoUrl("  https://example.org/logo.svg  ")).toBe(true);
	});

	it("accepts blank, which clears the field", () => {
		// An administrator who uploaded the wrong mark has to be able to remove it, and
		// the mutation reads an explicitly blank brand value as a clear.
		expect(isValidLogoUrl("")).toBe(true);
		expect(isValidLogoUrl("   ")).toBe(true);
		expect(isValidLogoUrl(null)).toBe(true);
		expect(isValidLogoUrl(undefined)).toBe(true);
	});

	it("rejects schemes that are not http(s)", () => {
		// Both survive a "is it a non-empty string" check, and both execute.
		expect(isValidLogoUrl("javascript:alert(1)")).toBe(false);
		expect(isValidLogoUrl("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBe(
			false,
		);
	});

	it("rejects anything that leaves the origin implicit", () => {
		// Stored by one origin and rendered by another, so a protocol-relative or
		// root-relative URL resolves against the wrong host - without ever looking like it.
		expect(isValidLogoUrl("//example.org/logo.svg")).toBe(false);
		expect(isValidLogoUrl("/logo.svg")).toBe(false);
		expect(isValidLogoUrl("logo.svg")).toBe(false);
	});

	it("rejects an http(s) URL with no host", () => {
		expect(isValidLogoUrl("https://")).toBe(false);
	});
});

describe("themeOptions", () => {
	it("offers the themes the discovery app ships", () => {
		expect(themeOptions()).toEqual([...DISCOVERY_THEME_NAMES]);
	});

	it("includes a stored theme this build does not know", () => {
		// A deployment that widened dcb.branding.theme-names for its own discovery
		// frontend. Dropping the value from the list would turn "we do not know your
		// theme" into "we cleared your theme" at the next save.
		expect(themeOptions("tenantBrand")).toEqual([
			...DISCOVERY_THEME_NAMES,
			"tenantBrand",
		]);
	});

	it("does not repeat a stored theme that is already known", () => {
		expect(themeOptions("openRS")).toEqual([...DISCOVERY_THEME_NAMES]);
	});
});

describe("brand field limits", () => {
	it("matches the column widths in dcb-service's brand migrations", () => {
		// V8_73_001 / V8_73_002. A value the database would truncate must be refused
		// here, with a message, rather than arriving mangled.
		expect(BRAND_LIMITS).toEqual({
			logoUrl: 400,
			logoAlt: 255,
			patronWelcome: 500,
			themeName: 64,
		});
	});
});

describe("brand translations", () => {
	it("has a string for every key the consortium form renders", () => {
		const brand = application.consortium.brand as Record<string, string>;

		for (const key of [
			"section",
			"section_help",
			"logo_url",
			"logo_url_help",
			"logo_url_invalid",
			"logo_alt",
			"logo_alt_help",
			"theme",
			"theme_help",
			"theme_default",
			"patron_welcome",
			"patron_welcome_help",
		]) {
			expect(typeof brand[key], key).toBe("string");
		}
	});
});
