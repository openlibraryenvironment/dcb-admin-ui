import { defineConfig, loadEnv } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { readFileSync } from "fs";
/// <reference types="vitest/config" />

export default defineConfig(({ mode }) => {
	// Wisdom from Ian: this is done to allow us to deploy the app to a folder rather than the root of a URI.
	// This approach shold also work for deployment at root.
	// const env = loadEnv(mode, process.cwd(), '');
	const env = loadEnv(mode, process.cwd(), "");

	// Build-time constants. `version` and `releaseDate` are baked at build time
	// (they used to be exposed via Next's publicRuntimeConfig); they are NOT runtime
	// env, so they belong in `define`, not in the injected `cfg`/inject_env.json.
	const pkg = JSON.parse(
		readFileSync(path.resolve(__dirname, "package.json"), "utf-8"),
	);
	const releaseInfo = JSON.parse(
		readFileSync(path.resolve(__dirname, "release-info.json"), "utf-8"),
	);

	return {
		define: {
			__APP_VERSION__: JSON.stringify(pkg.version),
			__APP_RELEASE_DATE__: JSON.stringify(releaseInfo.releaseDate ?? ""),
		},
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
		// Deliberately an absolute path (matching the VITE_PUBLIC_URL used for
		// the router's basepath in src/main.tsx), not a relative "./" base.
		// A relative base resolves asset URLs against the CURRENT page path,
		// which breaks on any SPA-fallback-served deep route (nginx try_files,
		// Cloudflare Pages, S3+CloudFront error-document, etc. all serve
		// index.html AT the deep URL, not at "/") - e.g. refreshing
		// /libraries/<id> would 404 every asset request and blank-page the app.
		base: env.VITE_PUBLIC_URL || "/",
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
				"@schemas": path.resolve(__dirname, "src/schemas"),
				"@themes": path.resolve(__dirname, "src/themes"),
				"@types": path.resolve(__dirname, "src/types"),
				"@": path.resolve(__dirname, "src"),
			},
		},
	};
});
