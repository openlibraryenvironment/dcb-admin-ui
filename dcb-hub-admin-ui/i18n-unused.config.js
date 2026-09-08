/** @type {import('i18n-unused').RunOptions} */
module.exports = {
	localesPath: "src/locales/en-GB",
	srcPath: "src",
	translationKeyMatcher: /(?:[$ \t(,.{\[](_|t|tc|i18nKey))\(.*?\)/gis,
};
// Gnarly regex in translation key matcher is intended to catch
// the various presentations (such as multi-lines) of our translation keys and t functions.
// The class must include tab, "(" and ",": this codebase indents with tabs, so a
// `t("key")` on its own argument line, or passed as `fn(t("key"), x)`, was being
// missed and reported as an unused key that is very much in use.
