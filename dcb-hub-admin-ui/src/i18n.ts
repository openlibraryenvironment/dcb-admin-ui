import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../public/locales/en-GB/application.json"; // Combine into one

i18n.use(initReactI18next).init({
	resources: {
		en: { translation: en },
		// es: { translation: es },
	},
	lng: "en", // Default language
	fallbackLng: "en",
	interpolation: {
		escapeValue: false,
	},
});

export default i18n;
