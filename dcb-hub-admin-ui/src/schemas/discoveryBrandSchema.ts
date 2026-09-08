import * as Yup from "yup";
import type { TFunction } from "i18next";

import { BRAND_LIMITS, isValidLogoUrl } from "@constants/discoveryBranding";

/**
 * The patron-facing brand fields, validated once — W-8.
 *
 * Mirrors dcb-service's `BrandingValidator` so an administrator is told at the field
 * rather than by a rejected mutation, and mirrors the column widths in V9_0_001 so a
 * value too long is refused here rather than by Postgres.
 *
 * ONE COPY, used by both the consortium record page and setup's discovery chapter. These
 * rules are the subtle part of the feature - a URL that becomes the `src` of an `<img>` in
 * the chrome of every patron page, a length that matches a column, a blank that means
 * "clear it" rather than "unchanged" - and two hand-maintained copies of a rule like that
 * is how one of them ends up accepting what the server refuses.
 *
 * Takes `t` rather than importing i18n directly so the messages are produced at render
 * time in the active language, as the page that owns the form already does.
 */
export const discoveryBrandFields = (t: TFunction) => ({
	// Blank is valid at every one of these and means "clear it" - an administrator who
	// uploaded the wrong mark must be able to remove it.
	brandLogoUrl: Yup.string()
		.trim()
		.max(BRAND_LIMITS.logoUrl)
		.test(
			"absolute-http-url",
			t("consortium.brand.logo_url_invalid"),
			isValidLogoUrl,
		),
	brandLogoAlt: Yup.string().trim().max(BRAND_LIMITS.logoAlt),
	brandHeaderIconUrl: Yup.string()
		.trim()
		.max(BRAND_LIMITS.headerIconUrl)
		.test(
			"absolute-http-url-or-asset",
			t("consortium.brand.logo_url_invalid"),
			isValidLogoUrl,
		),
	brandBackgroundImageUrl: Yup.string()
		.trim()
		.max(BRAND_LIMITS.backgroundImageUrl)
		.test(
			"absolute-http-url-or-asset",
			t("consortium.brand.logo_url_invalid"),
			isValidLogoUrl,
		),
	patronWelcome: Yup.string().trim().max(BRAND_LIMITS.patronWelcome),
	defaultThemeName: Yup.string().trim().max(BRAND_LIMITS.themeName),
});

/** The brand fields on their own, for a form that carries nothing else. */
export const discoveryBrandSchema = (t: TFunction) =>
	Yup.object().shape(discoveryBrandFields(t));

export interface DiscoveryBrandValues {
	brandLogoUrl?: string;
	brandLogoAlt?: string;
	brandHeaderIconUrl?: string;
	brandBackgroundImageUrl?: string;
	patronWelcome?: string;
	defaultThemeName?: string;
}
