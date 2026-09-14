import type { DiscoveryBrandValues } from "@schemas/discoveryBrandSchema";

/**
 * The themes the discovery app (Symposia) can render, which a consortium may choose for its
 * patrons - docs/theming.md, "The discovery theme list".
 *
 * A copy of symposia-ui's registry. Every theme this console offers itself is in it, so a
 * consortium can use one brand in both; `kInt` is the discovery app's alone.
 */
export const DISCOVERY_THEME_NAMES = [
	"openRS",
	"kInt",
	"evergreen",
	"koha",
	"folio",
	"blueAndWhite",
	"mobius",
] as const;

/**
 * Column widths in dcb-service's V9_0_001 (consortium) and V9_0_002 (library). Rejected
 * here, not by Postgres.
 */
export const BRAND_LIMITS = {
	/** V-11.1. consortium.website_url and consortium.support_url are both varchar(200). */
	linkUrl: 200,
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

/**
 * `dcb.branding.assets.store` out of an `/info` payload, or null when it is not there.
 *
 * Every level is optional on purpose. dcb-service only publishes the branding block when a
 * `BrandAssetStore` bean exists, so its absence is an ordinary answer from an older or
 * differently-configured deployment rather than a malformed response.
 */
export function brandAssetStoreFrom(info: unknown): string | null {
	const store = (
		info as { dcb?: { branding?: { assets?: { store?: unknown } } } } | null
	)?.dcb?.branding?.assets?.store;

	return typeof store === "string" ? store : null;
}

/**
 * Whether this deployment accepts brand image uploads — R-17b.
 *
 * With `dcb.branding.assets.store=none` dcb-service's upload controller is not registered
 * at all (`@Requires(beans = BrandAssetStore.class)`), so POST /brand-assets is a 404 and
 * an upload button there can only ever fail.
 *
 * UNKNOWN IS AVAILABLE, deliberately. A null store means /info has not been read yet, or
 * the request failed, or the payload predates the branding block — none of which is
 * evidence that uploads are off. Hiding the control on unknown would remove a working
 * feature whenever /info is briefly unreachable, and leave no way to explain why. Showing
 * it costs a clear refusal at Save, which is the message dcb-service already writes. This
 * is UX, not authorisation: the control on uploading is the role check on the route.
 */
export function areBrandUploadsAvailable(assetStore: string | null): boolean {
	return assetStore !== "none";
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

/**
 * Mirrors dcb-service's `BrandingValidator.linkUrl` — V-11.1.
 *
 * STRICTER than {@link isValidLogoUrl}, and deliberately: absolute http(s) with a host,
 * and no asset-prefix form. That prefix names an image this service stored, and a
 * "report a problem" link pointing at a stored PNG is not a support desk.
 *
 * dcb-service refuses anything else on write, so without this the administrator meets a
 * 400 with no field attached rather than a message under the box they typed in. Blank is
 * valid and means "clear it".
 */
export function isValidLinkUrl(value?: string | null): boolean {
	const trimmed = value?.trim();
	if (!trimmed) {
		return true;
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

/** What the discovery app's landing page and app bar draw from these values. */
export type PreviewArrangement = {
	appBarName: string;
	headerIcon?: string;
	logo?: string;
	background?: string;
	welcome?: string;
};

/**
 * The discovery app's arrangement, for the Setup preview - S-11.
 *
 * The name belongs to the app bar and never to the lockup, so a consortium with no logo shows
 * no mark rather than its name set large. Images that would not pass {@link isValidLogoUrl}
 * are dropped, as the patron app drops them on read.
 */
export function previewArrangement(
	values: Pick<
		DiscoveryBrandValues,
		"brandLogoUrl" | "brandHeaderIconUrl" | "brandBackgroundImageUrl" | "patronWelcome"
	>,
	consortiumName: string | undefined,
	unnamed: string,
): PreviewArrangement {
	const image = (url?: string) =>
		url?.trim() && isValidLogoUrl(url) ? url.trim() : undefined;

	return {
		appBarName: consortiumName?.trim() || unnamed,
		headerIcon: image(values.brandHeaderIconUrl),
		logo: image(values.brandLogoUrl),
		background: image(values.brandBackgroundImageUrl),
		welcome: values.patronWelcome?.trim() || undefined,
	};
}
