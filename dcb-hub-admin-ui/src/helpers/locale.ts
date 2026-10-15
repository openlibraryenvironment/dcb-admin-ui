import "dayjs/locale/en-gb";

/**
 * Which English a deployment speaks, and which one a user has chosen instead.
 *
 * A locale is both a translation file and a date convention: en-US reads 09/15/2026 with
 * weeks from Sunday, en-GB 15/09/2026 from Monday. docs/deployment.md, "Locale".
 */

export const SUPPORTED_LOCALES = ["en-US", "en-GB"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

/** What a deployment that sets nothing gets: British, as the interface text always was. */
export const DEFAULT_LOCALE: AppLocale = "en-GB";

export const isAppLocale = (value: unknown): value is AppLocale =>
	typeof value === "string" &&
	(SUPPORTED_LOCALES as readonly string[]).includes(value);

/** The dayjs locale MUI X's pickers read their date order and first weekday from. */
export const DAYJS_LOCALES: Record<AppLocale, string> = {
	"en-US": "en",
	"en-GB": "en-gb",
};

const warned = new Set<string>();

/** The deployment's locale from VITE_LOCALE, or the default when it is unset or unknown. */
export function deploymentLocale(): AppLocale {
	const configured =
		typeof window === "undefined" ? undefined : window.__APP_ENV__?.VITE_LOCALE;

	if (!configured) return DEFAULT_LOCALE;
	if (isAppLocale(configured)) return configured;

	if (!warned.has(configured)) {
		warned.add(configured);
		console.warn(
			`VITE_LOCALE "${configured}" is not one of ${SUPPORTED_LOCALES.join(", ")}; using ${DEFAULT_LOCALE}.`,
		);
	}
	return DEFAULT_LOCALE;
}

/**
 * What a user may pick. "deployment" follows VITE_LOCALE, and is the default, so a
 * deployment that changes its locale changes it for everyone who has not chosen otherwise.
 * "es" is a translation only; its dates follow the deployment.
 */
export const LANGUAGE_CHOICES = ["deployment", "en-US", "en-GB", "es"] as const;
export type LanguageChoice = (typeof LANGUAGE_CHOICES)[number];

export const isLanguageChoice = (value: unknown): value is LanguageChoice =>
	typeof value === "string" &&
	(LANGUAGE_CHOICES as readonly string[]).includes(value);

/** The i18next language for a choice. */
export const resolveLanguage = (
	choice: LanguageChoice,
	deployment: AppLocale,
): string => (choice === "deployment" ? deployment : choice);

/** The locale dates and numbers are formatted in for a choice. */
export const resolveFormatLocale = (
	choice: LanguageChoice,
	deployment: AppLocale,
): AppLocale => (isAppLocale(choice) ? choice : deployment);
