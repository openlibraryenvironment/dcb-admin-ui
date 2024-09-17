const path = require("path");
const { i18n } = require("./next-i18next.config");
const { version } = require("./package.json");
const { releaseDate } = require("./release-info.json");

/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "standalone",
	compiler: {
		styledComponents: true,
		// This helps SWC (the compiler) build our styled components faster,
		// and prevents mismatches between styled component names on the client and server.
		// https://stackoverflow.com/a/70429669
	},
	eslint: {
		// ignoreDuringBuilds: true,
		// Do not enable this unless absolutely necessary - if ESLint is flagging something up, go look at it.
		// And if you think ESLint is wrong in a specific case, add eslint-ignore and a justification instead.
	},
	env: {
		KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_ID,
		KEYCLOAK_SECRET: process.env.KEYCLOAK_SECRET,
	},
	images: {
		domains: ["img.pokemondb.net"],
	},
	i18n,
	publicRuntimeConfig: {
		DCB_SEARCH_BASE: process.env.DCB_SEARCH_BASE,
		DCB_API_BASE: process.env.DCB_API_BASE,
		DCB_ES_URL: process.env.DCB_ES_URL,
		KEYCLOAK_URL: process.env.KEYCLOAK_URL ?? "", // This is only here so that a null KEYCLOAK_URL doesn't break the build.
		version,
		releaseDate,
	},
	reactStrictMode: true,
	swcMinify: true,
	sassOptions: {
		includePaths: [path.join(__dirname, "styles")],
	},
	// This enables code coverage for Cypress. Commented out due to these known issues, which break the entire testing system:
	// https://github.com/vercel/next.js/issues/44433 Code instrumentation doesn't work with next/font
	// https://github.com/kwonoj/swc-plugin-coverage-instrument/issues/197 Can't exclude redundant files from coverage
	// experimental: {
	// 	swcPlugins: [
	// 	  ['swc-plugin-coverage-instrument', {}]
	// 	]
	//   },
};

module.exports = nextConfig;
