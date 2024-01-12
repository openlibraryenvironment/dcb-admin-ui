const path = require('path');
const { i18n } = require('./next-i18next.config');
const { version } = require('./package.json')
const { releaseDate } = require('./release-info.json')

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	swcMinify: true,
	sassOptions: {
		includePaths: [path.join(__dirname, 'styles')]
	},
	env: {
		KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_ID,
		KEYCLOAK_SECRET: process.env.KEYCLOAK_SECRET,
	}, 
	images: {
		domains: ['img.pokemondb.net']
	},
	publicRuntimeConfig: {
		DCB_API_BASE: process.env.DCB_API_BASE,
		DCB_ES_URL: process.env.DCB_ES_URL,
		KEYCLOAK_REFRESH: "https://keycloak.sph.k-int.com/realms/dcb-hub",
		version, releaseDate
	},
	// This enables code coverage for Cypress. Commented out due to these known issues, which break the entire testing system:
  // https://github.com/vercel/next.js/issues/44433 Code instrumentation doesn't work with next/font
  // https://github.com/kwonoj/swc-plugin-coverage-instrument/issues/197 Can't exclude redundant files from coverage
	// experimental: {
	// 	swcPlugins: [
	// 	  ['swc-plugin-coverage-instrument', {}]
	// 	]
	//   },
	i18n,
};

module.exports = nextConfig;
