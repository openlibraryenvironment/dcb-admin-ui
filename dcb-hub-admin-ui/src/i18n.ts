import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import en from "./locales/en-GB/application.json";

const bundleBase =
	typeof window === "undefined"
		? import.meta.env.BASE_URL
		: (window.__DCB_BUNDLE_BASE_URL__ ?? import.meta.env.BASE_URL);

i18n
	.use(HttpBackend) // fetch over the network for MISSING languages
	.use(initReactI18next)
	.init({
		resources: {
			"en-GB": { application: en },
		},
		lng: "en-GB",
		fallbackLng: "en-GB",
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
	});

export default i18n;
