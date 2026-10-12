import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import enGB from "./locales/en-GB/application.json";
import enUS from "./locales/en-US/application.json";
import {
	DEFAULT_LOCALE,
	deploymentLocale,
	resolveLanguage,
} from "@helpers/locale";
import { useLocaleStore } from "@hooks/useLocaleStore";
import {
	armMissingKeyReporting,
	isMissingKeyReportingEnabled,
	recordMissingKey,
} from "./helpers/i18nMissingKeys";

const bundleBase =
	typeof window === "undefined"
		? import.meta.env.BASE_URL
		: (window.__DCB_BUNDLE_BASE_URL__ ?? import.meta.env.BASE_URL);

if (isMissingKeyReportingEnabled()) armMissingKeyReporting();

i18n
	.use(HttpBackend) // fetch over the network for MISSING languages
	.use(initReactI18next)
	.init({
		resources: {
			"en-GB": { application: enGB },
			"en-US": { application: enUS },
		},
		lng: DEFAULT_LOCALE,
		// A partial translation falls back to the deployment's English, not a fixed one.
		fallbackLng: (code) =>
			code.startsWith("en") ? [DEFAULT_LOCALE] : [deploymentLocale()],
		load: "currentOnly",
		partialBundledLanguages: true, // the rest are only partially bundled

		backend: {
			// Base-relative: a root-absolute "/locales/..." escapes the app's base
			// path, and on an origin hosting several apps it lands on a sibling (or
			// the SPA fallback) and parses HTML as JSON.
			loadPath: `${bundleBase}locales/{{lng}}/{{ns}}.json`,
		},
		ns: ["application"],
		defaultNS: "application",
		interpolation: { escapeValue: false },
		// A key the catalogue does not carry renders as the key itself, which a user
		// sees as raw text like `libraries.accounts.email`. i18next calls
		// missingKeyHandler INSTEAD of the backend's own saveMissing when one is set,
		// so nothing is posted anywhere. Gated, and the gate that reads it:
		// e2e/i18n-missing.spec.ts. docs/i18n.md.
		saveMissing: isMissingKeyReportingEnabled(),
		missingKeyHandler: (languages, namespace, key) => {
			recordMissingKey(languages?.[0] ?? "unknown", namespace, key);
		},
	});

/**
 * Puts the user's choice, or the deployment's locale, into effect: the translations and the
 * page's `lang`, which screen readers pronounce by. Called once the runtime config is
 * known, and again whenever the choice changes.
 */
export function applyLanguage(): Promise<unknown> {
	const language = resolveLanguage(
		useLocaleStore.getState().choice,
		deploymentLocale(),
	);
	document.documentElement.lang = language;
	return i18n.language === language
		? Promise.resolve()
		: i18n.changeLanguage(language);
}

export default i18n;
