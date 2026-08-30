import { defineConfig, loadEnv, type Plugin } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { readFileSync } from "fs";
/// <reference types="vitest/config" />

function kiBootstrapCssPlugin(): Plugin {
	return {
		name: "ki-bootstrap-css",
		enforce: "post",
		generateBundle(_options, bundle) {
			const cssFiles = Object.values(bundle)
				.filter(
					(output) =>
						output.type === "asset" && output.fileName.endsWith(".css"),
				)
				.map((output) => output.fileName);

			const adapterEntry = Object.values(bundle).find(
				(output) =>
					output.type === "chunk" &&
					output.isEntry &&
					output.facadeModuleId?.endsWith("/src/ki-bootstrap.ts"),
			);

			if (adapterEntry?.type !== "chunk" || cssFiles.length === 0) {
				return;
			}

			adapterEntry.code = `
const __kiStyles = ${JSON.stringify(cssFiles)};
if (typeof document !== "undefined") {
	for (const __kiStyle of __kiStyles) {
		const __kiHref = new URL("./" + __kiStyle, import.meta.url).href;
		const __kiLoaded = Array.from(document.styleSheets).some(
			(__kiSheet) => __kiSheet.href === __kiHref,
		);
		if (!__kiLoaded) {
			const __kiLink = document.createElement("link");
			__kiLink.rel = "stylesheet";
			__kiLink.href = __kiHref;
			__kiLink.dataset.kiStylesheet = __kiHref;
			document.head.appendChild(__kiLink);
		}
	}
}
${adapterEntry.code}`;
		},
	};
}

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
			kiBootstrapCssPlugin(),
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
		experimental: {
			// HTML remains rooted at the standalone VITE_PUBLIC_URL. References
			// emitted inside JS/CSS stay relative to their own file, so the same
			// chunks also work below a versioned bootloader bundle URL.
			renderBuiltUrl(_filename, { hostType }) {
				return hostType === "html" ? undefined : { relative: true };
			},
		},
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
		build: {
			rollupOptions: {
				preserveEntrySignatures: "strict",
				input: {
					index: path.resolve(__dirname, "index.html"),
					"ki-bootstrap": path.resolve(
						__dirname,
						"src/ki-bootstrap.ts",
					),
				},
				output: {
					// NO `codeSplitting.groups` HERE, DELIBERATELY, AND MEASURED.
					//
					// symposia-ui merges chunks in exactly this position and it took that
					// app from 73 requests to 35 and its LCP under budget. The same move
					// was tried here twice and made things worse or did nothing, so it is
					// recorded rather than left for somebody to re-derive:
					//
					//   {test: /node_modules/, minShareCount: 2, minSize: 20KiB}
					//     122 -> 89 script requests, but 638 KiB -> 1,024 KiB and
					//     LCP 6.9s -> 8.8s. The premium data grid, x-charts-pro and
					//     exceljs are each shared by two or more LAZY routes, so
					//     minShareCount hoists them onto the critical path of a page
					//     that renders a sign-in card.
					//
					//   {test: /@mui\/(material|system|utils|...)/, same constraints}
					//     122 -> 110 requests, +17 KiB, LCP unchanged within noise - and
					//     it produced a single 126 KiB chunk that Lighthouse measured as
					//     69% unused on this page.
					//
					// The two applications differ in where their weight is. symposia-ui's
					// problem was 32 tiny vendor chunks in front of first paint. This
					// application's is a large EAGER APPLICATION GRAPH: `routeTree.gen.ts`
					// statically imports all 81 route definitions, and those definitions
					// pull `schemas`, `axios`, `dayjs` and the bundled locale catalogue in
					// with them. Reshaping chunks moves that weight around; it does not
					// remove it. See WELCOME_EXPERIENCE_PLAN.md §8.
					//
					// ki-bootstrap.js is the ONE public file name in the artefact - the
					// bootloader resolves it by name, so it must not carry a hash.
					entryFileNames: (chunk) =>
						chunk.facadeModuleId?.endsWith("/src/ki-bootstrap.ts")
							? "ki-bootstrap.js"
							: "assets/[name]-[hash].js",
					chunkFileNames: "assets/[name]-[hash].js",
					assetFileNames: "assets/[name]-[hash][extname]",
				},
			},
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
				"@fragments": path.resolve(__dirname, "src/graphql/fragments"),
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
