const path = require("path");

module.exports = {
	i18n: {
		// all the locales supported in the application
		locales: ["en-GB", "en-US"],
		// the default locale to be used when visiting
		// a non-localized route (e.g. `/about`)
		defaultLocale: "en-GB",
	},

	fallbackLng: "en-GB",

	ns: ["common", "application", "validation"],
	defaultNS: "application",
	fallbackNS: "common",

	//fixes issue of keys showing in vercel
	localePath: path.resolve("./public/locales"),
};
