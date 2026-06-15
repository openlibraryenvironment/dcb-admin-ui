import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import en from "./locales/en-GB/application.json";

i18n
	.use(HttpBackend) // fetch over the network for MISSING languages
	.use(initReactI18next)
	.init({
		// Take English immediately
		resources: {
			"en-GB": { application: en },
		},
		lng: "en-GB",
		fallbackLng: "en-GB",
		partialBundledLanguages: true, // the rest are only partially bundled

		backend: {
			// 4. Where to find the OTHER languages (like Spanish, French, etc.)
			// These remain in the public folder: public/locales/es/application.json
			loadPath: "/locales/{{lng}}/{{ns}}.json",
		},
		ns: ["application"],
		defaultNS: "application",
		interpolation: { escapeValue: false },
	});

export default i18n;
