/**
 * The patron-facing brand fields an administrator sets here, and what may go in them.
 *
 * These describe the DISCOVERY app (Symposia), not this one. `defaultThemeName` names a
 * theme from the discovery frontend's registry — it is not one of this application's own
 * themes in `src/themes/openRS.ts`, and the two lists are unrelated.
 *
 * <h2>Where the vocabulary really lives</h2>
 *
 * dcb-service validates `defaultThemeName` on write against `dcb.branding.theme-names`,
 * whose default is exactly the list below. That is the authority; this constant exists so
 * an administrator picks from a list instead of typing a name and discovering it was
 * wrong from a rejected save — which is §C-5's requirement that configuration survive a
 * non-specialist.
 *
 * It is therefore a duplicate, and it is one on purpose for now: dcb-service does not
 * expose the configured list, and the honest fix is a query that returns it, done in
 * dcb-service's own batch rather than by checking out its branch mid-flight. Until then,
 * two rules keep the duplication harmless:
 *
 *  1. A deployment that has WIDENED `dcb.branding.theme-names` still renders whatever is
 *     stored — {@link themeOptions} folds the current value in, so a theme this build has
 *     never heard of appears as itself rather than vanishing from the control and being
 *     silently cleared on the next save.
 *  2. A stored theme is tolerated on read by the discovery app regardless, so the worst
 *     case of drift is an administrator not being offered a theme, never a broken patron.
 */
export const DISCOVERY_THEME_NAMES = ["openRS", "kInt"] as const;

/**
 * Column widths in dcb-service's V8_73_001 / V8_73_002 / V8_73_003. Rejected here, not by
 * Postgres.
 */
export const BRAND_LIMITS = {
	logoUrl: 400,
	logoAlt: 255,
	headerIconUrl: 400,
	backgroundImageUrl: 400,
	patronWelcome: 500,
	themeName: 64,
} as const;

/**
 * The path dcb-service serves uploaded brand assets from — R-17b.
 *
 * An upload returns a site-relative URL under this prefix, and dcb-service's
 * BrandingValidator accepts that form on write alongside an absolute http(s) URL. Kept in
 * step with `dcb.branding.assets.public-path-prefix`, whose default this is.
 */
export const BRAND_ASSET_PATH_PREFIX = "/discovery/brand-assets/";

/**
 * What the file picker offers, and what dcb-service will actually accept — R-17c.
 *
 * PNG and JPEG only. SVG is refused because it is a script-capable document and one
 * served from our own origin would be stored XSS in the chrome of every patron page,
 * including the sign-in page. WebP is refused because the server cannot re-encode it, and
 * an image it cannot decode is one it will not store.
 *
 * This attribute is a CONVENIENCE, never a control: a file picker filter is a hint to the
 * operating system and says nothing about the bytes. dcb-service sniffs magic bytes and
 * ignores both the filename and the declared content type.
 */
export const BRAND_IMAGE_ACCEPT = "image/png,image/jpeg";

/** Matches `dcb.branding.assets.max-bytes`. Checked again, and properly, on the server. */
export const BRAND_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

/**
 * The theme choices to render, including whatever is currently stored.
 *
 * A value outside the known list is not an error to correct — it is a deployment running
 * a discovery frontend we do not ship, which `dcb.branding.theme-names` exists to allow.
 * Dropping it from the options would turn "this control does not know your theme" into
 * "this control cleared your theme", one save later.
 */
export function themeOptions(current?: string | null): string[] {
	const known: string[] = [...DISCOVERY_THEME_NAMES];
	return current && !known.includes(current) ? [...known, current] : known;
}

/** The shape dcb-service's asset store mints: a SHA-256 and an extension it re-encodes to. */
const ASSET_KEY = /^[0-9a-f]{64}[.](png|jpg)$/;

/**
 * Mirrors dcb-service's `BrandingValidator.logoUrl` so the administrator is told at the
 * field rather than by a rejected mutation.
 *
 * Absolute http(s) with a host, OR a path under dcb-service's own asset prefix — the two
 * routes of R-17e, one column. Nothing else. This URL becomes the `src` of an `<img>` in
 * the chrome of every page of the patron app, so `javascript:` and `data:` have no
 * legitimate use here, and a protocol-relative `//host/x` leaves the origin without
 * looking like it did. Blank is valid and means "clear it".
 *
 * The prefix branch checks the KEY as well as the prefix. A "starts with" test would
 * accept `/discovery/brand-assets/../../something`, and a prefix test that can be walked
 * out of is not a prefix test.
 */
export function isValidLogoUrl(value?: string | null): boolean {
	const trimmed = value?.trim();
	if (!trimmed) {
		return true;
	}

	if (trimmed.startsWith(BRAND_ASSET_PATH_PREFIX)) {
		return ASSET_KEY.test(trimmed.slice(BRAND_ASSET_PATH_PREFIX.length));
	}

	let url: URL;
	try {
		url = new URL(trimmed);
	} catch {
		return false;
	}

	return (
		(url.protocol === "https:" || url.protocol === "http:") && url.host !== ""
	);
}
