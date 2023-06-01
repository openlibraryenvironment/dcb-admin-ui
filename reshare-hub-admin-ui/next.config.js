const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	swcMinify: true,
	sassOptions: {
		includePaths: [path.join(__dirname, 'styles')]
	},
	images: {
		domains: ['img.pokemondb.net']
	},
	publicRuntimeConfig: {
		DCB_API_BASE: process.env.DCB_API_BASE,
		DCB_ES_URL: process.env.DCB_ES_URL
	}
};

module.exports = nextConfig;
