import { describe, it, expect } from "vitest";

import {
	areBrandUploadsAvailable,
	brandAssetStoreFrom,
	BRAND_ASSET_PATH_PREFIX,
	BRAND_LIMITS,
	DISCOVERY_THEME_NAMES,
	isValidLinkUrl,
	isValidLogoUrl,
	previewArrangement,
	themeOptions,
} from "./discoveryBranding";
import application from "@/locales/en-GB/application.json";
import { THEME_NAMES } from "../themes/openRS";

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

describe("DISCOVERY_THEME_NAMES", () => {
	it("offers every theme this console can be given, so one brand works in both apps", () => {
		// S-13 and F-33: the console offered MOBIUS for staff while the patron app could
		// only fall back to OpenRS blue for the same consortium.
		expect([...DISCOVERY_THEME_NAMES]).toEqual(expect.arrayContaining([...THEME_NAMES]));
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
		// V9_0_001 / V9_0_002, plus V6_2_0_021 and V9_0_008 for the two link
		// columns. A value the database would truncate must be refused here, with a
		// message, rather than arriving mangled.
		expect(BRAND_LIMITS).toEqual({
			linkUrl: 200,
			logoUrl: 400,
			logoAlt: 255,
			headerIconUrl: 400,
			backgroundImageUrl: 400,
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
			"header_icon_url",
			"header_icon_url_help",
			"background_image_url",
			"background_image_url_help",
			"upload",
			"uploading",
			"upload_formats",
			"upload_too_large",
			"upload_failed",
			"image_url",
			"external_url_cost",
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

// --- R-17e: one column, two ways to fill it ----------------------------------

describe("an uploaded asset path", () => {
	const key = "a".repeat(64);

	/**
	 * The new accepted form. An upload returns a site-relative URL under dcb-service's
	 * own asset prefix — which is exactly the shape every other case here exists to
	 * reject — so the rule is widened by one case rather than relaxed.
	 */
	it("accepts a path under dcb-service's asset prefix", () => {
		expect(isValidLogoUrl(`/discovery/brand-assets/${key}.png`)).toBe(true);
		expect(isValidLogoUrl(`/discovery/brand-assets/${key}.jpg`)).toBe(true);
	});

	/**
	 * A "starts with" test would accept this. A prefix test that can be walked out of is
	 * not a prefix test, which is why the key's shape is checked too.
	 */
	it("rejects a traversal out of the prefix", () => {
		expect(isValidLogoUrl("/discovery/brand-assets/../../etc/passwd")).toBe(
			false,
		);
	});

	it("rejects anything under the prefix that is not a key this service minted", () => {
		expect(isValidLogoUrl("/discovery/brand-assets/logo.png")).toBe(false);
		expect(isValidLogoUrl(`/discovery/brand-assets/${key}.svg`)).toBe(false);
	});

	it("still rejects every other site-relative path", () => {
		expect(isValidLogoUrl(`/uploads/${key}.png`)).toBe(false);
		expect(isValidLogoUrl("/discovery/brand-assets-evil/x.png")).toBe(false);
	});
});

/**
 * Whether the upload control is offered at all — R-17b.
 *
 * dcb-service publishes `dcb.branding.assets.store` on /info precisely so this decision can
 * be made, and its BrandingCapabilityInfoTests pins the shape. These cases are the other
 * half of that contract: without them the prop exists, defaults to true, and nothing ever
 * passes it — which is exactly the state this replaced.
 */
describe("brandAssetStoreFrom", () => {
	it("reads the store out of an /info payload", () => {
		expect(
			brandAssetStoreFrom({
				dcb: { branding: { assets: { store: "database" } } },
			}),
		).toBe("database");

		expect(
			brandAssetStoreFrom({ dcb: { branding: { assets: { store: "none" } } } }),
		).toBe("none");
	});

	it("returns null when the branding block is absent at any level", () => {
		// Not a malformed response: dcb-service only publishes the block when a
		// BrandAssetStore bean exists, and an older service has none of it.
		expect(brandAssetStoreFrom({ version: "9.0.0" })).toBe(null);
		expect(brandAssetStoreFrom({ dcb: {} })).toBe(null);
		expect(brandAssetStoreFrom({ dcb: { branding: {} } })).toBe(null);
		expect(brandAssetStoreFrom({ dcb: { branding: { assets: {} } } })).toBe(
			null,
		);
	});

	it("survives a payload that is not an object at all", () => {
		expect(brandAssetStoreFrom(null)).toBe(null);
		expect(brandAssetStoreFrom(undefined)).toBe(null);
		expect(brandAssetStoreFrom("nope")).toBe(null);
		expect(
			brandAssetStoreFrom({ dcb: { branding: { assets: { store: 7 } } } }),
		).toBe(null);
	});
});

describe("areBrandUploadsAvailable", () => {
	it("offers uploads when the service stores them", () => {
		expect(areBrandUploadsAvailable("database")).toBe(true);
	});

	it("hides uploads only when the service says none", () => {
		// store=none means the upload controller is not registered, so the button could
		// only ever 404.
		expect(areBrandUploadsAvailable("none")).toBe(false);
	});

	it("treats unknown as available, rather than hiding a working feature", () => {
		// null is "/info not read yet, or unreachable, or older than the branding block".
		// Hiding on null would remove uploads whenever /info blips, with nothing on screen
		// to explain why; showing costs a clear refusal at Save. Hiding a button is UX
		// here, not authorisation — the role check on the route is the control.
		expect(areBrandUploadsAvailable(null)).toBe(true);
	});
});

describe("isValidLinkUrl", () => {
	/**
	 * V-11.1. Mirrors dcb-service's BrandingValidator.linkUrl, which now refuses these
	 * on write — so without the check the administrator meets a 400 with no field
	 * attached instead of a message under the box they typed in.
	 */
	it.each(["https://library.example.org", "http://intranet.example/help"])(
		"accepts %s",
		(value) => {
			expect(isValidLinkUrl(value)).toBe(true);
		},
	);

	it("treats blank as valid, because blank means clear it", () => {
		expect(isValidLinkUrl("")).toBe(true);
		expect(isValidLinkUrl("   ")).toBe(true);
		expect(isValidLinkUrl(null)).toBe(true);
		expect(isValidLinkUrl(undefined)).toBe(true);
	});

	it.each([
		["javascript:alert(1)", "a script URL"],
		["data:text/html,<h1>hi", "a data URL"],
		["//evil.example.org/phish", "protocol-relative, which leaves the origin"],
		["/settings", "a path back into this application"],
		["mailto:librarian@example.org", "a scheme that is not http(s)"],
		["library.example.org", "a bare host with no scheme"],
	])("rejects %s — %s", (value) => {
		expect(isValidLinkUrl(value)).toBe(false);
	});

	it("refuses an asset path that isValidLogoUrl accepts", () => {
		// The one place the two rules deliberately differ. That prefix names an image
		// this service stored; a "report a problem" link pointing at a stored PNG is not
		// a support desk.
		const asset = `${BRAND_ASSET_PATH_PREFIX}${"a".repeat(64)}.png`;

		expect(isValidLogoUrl(asset)).toBe(true);
		expect(isValidLinkUrl(asset)).toBe(false);
	});
});

describe("previewArrangement", () => {
	it("puts the consortium's name in the app bar, and sets no name in the lockup", () => {
		const parts = previewArrangement(
			{ patronWelcome: "  Search Missouri's shared collections.  " },
			"WOLFCON 26",
			"Your consortium",
		);

		expect(parts.appBarName).toBe("WOLFCON 26");
		expect(parts.logo).toBeUndefined();
		expect(parts.welcome).toBe("Search Missouri's shared collections.");
	});

	it("draws only the images the patron app would render", () => {
		const parts = previewArrangement(
			{
				brandLogoUrl: "javascript:alert(1)",
				brandHeaderIconUrl: "https://example.org/icon.png",
				brandBackgroundImageUrl: "   ",
			},
			"MOBIUS",
			"Your consortium",
		);

		expect(parts.logo).toBeUndefined();
		expect(parts.headerIcon).toBe("https://example.org/icon.png");
		expect(parts.background).toBeUndefined();
	});

	it("falls back to the placeholder for a consortium with no name yet", () => {
		expect(previewArrangement({}, "  ", "Your consortium").appBarName).toBe(
			"Your consortium",
		);
	});
});
