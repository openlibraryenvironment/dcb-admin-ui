// import { defineConfig, loadEnv } from "vite";
import { defineConfig, loadEnv } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
/// <reference types="vitest/config" />

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	// Wisdom from Ian: this is done to allow us to deploy the app to a folder rather than the root of a URI.
	// This approach shold also work for deployment at root.
	// const env = loadEnv(mode, process.cwd(), '');
	const env = loadEnv(mode, process.cwd(), "");

	return {
		plugins: [
			tanstackRouter({
				target: "react",
				autoCodeSplitting: true,
			}),
			react(),
		],
		server: {
			historyApiFallback: true, // For Vercel 404 weirdness. We won't end up deploying to Vercel permanently so not to worry too much.
			proxy: {
				// We will proxy any request starting with /api
				// Hopefully we can somehow avoid having to do this but at the minute it is a workaround
				"/api": {
					target: env.VITE_ILL_API_BASE,
					changeOrigin: true, // Necessary for virtual-hosted sites
					secure: false, // Often needed when proxying to an https target
					// We rewrite the path to remove the /api prefix before sending it to the target
					// Probably a nicer way of doing this
					rewrite: (path) => path.replace(/^\/api/, ""),
				},
			},
		},
		base: "./",
		build: {
			// think about other ways of addressing bundle size
			// ultimately if we can't because of the DGrid it's fine
			rollupOptions: {
				output: {
					manualChunks: {
						vendor: ["react", "react-dom"],
						router: ["@tanstack/react-router", "@tanstack/react-query"],
						mui: ["@mui/material", "@emotion/styled", "@emotion/react"],
					},
				},
			},
			optimizeDeps: {
				// Pre-bundle common dependencies
				include: [
					"react",
					"react-dom",
					"@mui/material",
					"@mui/x-data-grid-premium",
					"@emotion/styled",
					"@emotion/react",
				],
			},
		},

		test: {
			include: ["**/*.test.ts"],
			exclude: ["node_modules", "dist", "coverage", "playwright", "**/*.d.ts"],
		},
		resolve: {
			alias: {
				"@components": path.resolve(__dirname, "src/components"),
				"@constants": path.resolve(__dirname, "src/constants"),
				"@forms": path.resolve(__dirname, "src/forms"),
				"@helpers": path.resolve(__dirname, "src/helpers"),
				"@queries": path.resolve(__dirname, "src/queries"),
				"@models": path.resolve(__dirname, "src/models"),
				"@mutations": path.resolve(__dirname, "src/mutations"),
				"@types": path.resolve(__dirname, "src/types"),
				"@": path.resolve(__dirname, "src"),
			},
		},
	};
});
