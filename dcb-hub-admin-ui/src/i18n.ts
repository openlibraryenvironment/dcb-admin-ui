import i18n, {
	type BackendModule,
	type ReadCallback,
	type Services,
} from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend, { type HttpBackendOptions } from "i18next-http-backend";
import enGB from "./locales/en-GB/application.json";
import { deploymentLocale, resolveLanguage } from "@helpers/locale";
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

/**
 * en-GB is the whole catalogue. en-US holds only the strings whose spelling or wording
 * differs, built as a chunk of its own and fetched when it is used; every other key
 * falls through to en-GB. Other languages come from public/locales.
 */
const OVERLAYS: Record<string, () => Promise<{ default: object }>> = {
	"en-US": () => import("./locales/en-US/application.json"),
};

class LocaleBackend implements BackendModule<HttpBackendOptions> {
	static type = "backend" as const;
	type = "backend" as const;
	private readonly http = new HttpBackend();

	init(services: Services, options: HttpBackendOptions) {
		this.http.init(services, options);
	}

	read(language: string, namespace: string, callback: ReadCallback) {
		const overlay = OVERLAYS[language];
		if (!overlay) return this.http.read(language, namespace, callback);
		overlay().then(
			(module) => callback(null, module.default),
			(error: Error) => callback(error, false),
		);
	}
}

i18n
	.use(LocaleBackend)
	.use(initReactI18next)
	.init({
		resources: { "en-GB": { application: enGB } },
		// The best answer before the runtime config arrives, so an overlay a stored choice
		// needs is already loading; applyLanguage settles it once the config is known.
		lng: resolveLanguage(useLocaleStore.getState().choice, deploymentLocale()),
		fallbackLng: (code) => {
			if (code === "en-GB") return [];
			if (code === "en-US") return ["en-GB"];
			// A partial translation falls back to the deployment's English
			return deploymentLocale() === "en-US" ? ["en-US", "en-GB"] : ["en-GB"];
		},
		load: "currentOnly",
		partialBundledLanguages: true, // en-GB is bundled; the rest load on demand

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
