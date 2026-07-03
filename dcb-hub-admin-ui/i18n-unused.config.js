/** @type {import('i18n-unused').RunOptions} */
module.exports = {
	localesPath: "src/locales/en-GB",
	srcPath: "src",
	translationKeyMatcher: /(?:[$ .{\[](_|t|tc|i18nKey))\(.*?\)/gis,
};
// Gnarly regex in translation key matcher is intended to catch
// the various presentations (such as multi-lines) of our translation keys and t functions
