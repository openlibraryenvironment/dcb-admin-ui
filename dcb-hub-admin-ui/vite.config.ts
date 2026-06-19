import { defineConfig, loadEnv } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
/// <reference types="vitest/config" />

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
			historyApiFallback: true,
			proxy: {
				"/api": {
					target: env.VITE_ILL_API_BASE,
					changeOrigin: true,
					secure: false,
					rewrite: (path) => path.replace(/^\/api/, ""),
				},
			},
		},
		base: "./",
		optimizeDeps: {
			include: [
				"react",
				"react-dom",
				"@mui/material",
				"@mui/x-data-grid-premium",
				"@emotion/styled",
				"@emotion/react",
			],
		},

		test: {
			include: ["**/*.test.ts"],
			exclude: ["node_modules", "dist", "coverage", "playwright", "**/*.d.ts"],
		},

		resolve: {
			alias: {
				"@assets": path.resolve(__dirname, "src/assets"),
				"@columns": path.resolve(__dirname, "src/columns"),
				"@components": path.resolve(__dirname, "src/components"),
				"@constants": path.resolve(__dirname, "src/constants"),
				"@filters": path.resolve(__dirname, "src/filters"),
				"@forms": path.resolve(__dirname, "src/forms"),
				"@generated": path.resolve(__dirname, "src/generated"),
				"@helpers": path.resolve(__dirname, "src/helpers"),
				"@hooks": path.resolve(__dirname, "src/hooks"),
				"@layout": path.resolve(__dirname, "src/layout"),
				"@queries": path.resolve(__dirname, "src/graphql/queries"),
				"@models": path.resolve(__dirname, "src/models"),
				"@mutations": path.resolve(__dirname, "src/graphql/mutations"),
				"@themes": path.resolve(__dirname, "src/themes"),
				"@types": path.resolve(__dirname, "src/types"),
				"@": path.resolve(__dirname, "src"),
			},
		},
	};
});
