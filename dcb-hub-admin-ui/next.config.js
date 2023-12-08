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
	i18n,
};

module.exports = nextConfig;
