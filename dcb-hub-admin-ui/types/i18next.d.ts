import "i18next";
import en from "./src/locales/en-GB/application.json";

declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: "translation";
		resources: {
			translation: typeof en;
		};
	}
}
