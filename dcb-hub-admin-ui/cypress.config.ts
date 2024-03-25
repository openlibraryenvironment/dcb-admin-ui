import { defineConfig } from "cypress";
require("dotenv").config();

export default defineConfig({
	e2e: {
		chromeWebSecurity: false,
		baseUrl: "http://localhost:3000",
		setupNodeEvents(on, config) {
			// require('@cypress/code-coverage/task')(on, config)
			config.env = {
				...process.env,
				...config.env,
			};
			return config;
		},
	},
	// Code coverage ran into the following known issues and has been disabled.
	// https://github.com/vercel/next.js/issues/44433 Code instrumentation doesn't work with next/font
	// https://github.com/kwonoj/swc-plugin-coverage-instrument/issues/197 Can't exclude redundant files from coverage

	component: {
		devServer: {
			framework: "next",
			bundler: "webpack",
		},
	},
});
