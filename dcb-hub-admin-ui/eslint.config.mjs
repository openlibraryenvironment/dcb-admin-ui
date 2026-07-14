// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import i18next from "eslint-plugin-i18next";
import reactRefresh from "eslint-plugin-react-refresh";
import pluginQuery from "@tanstack/eslint-plugin-query";
import pluginRouter from "@tanstack/eslint-plugin-router";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// FlatCompat is required to bridge legacy configs into ESLint 9
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
});

export default [
	{
		// Flat config no longer reads .eslintignore - these paths are either
		// build output, auto-generated code, or config files that shouldn't
		// be linted (dist/ in particular can crash the stylish formatter on
		// its minified bundles).
		ignores: [
			"dist/**",
			"coverage/**",
			"src/generated/**",
			"src/routeTree.gen.ts",
			"public/**",
			"*.config.js",
			"*.config.mjs",
			"*.config.ts",
		],
	},

	...compat.extends(
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:jsx-a11y/recommended",
		"plugin:react/recommended",
		"plugin:react-hooks/recommended",
		"prettier",
	),

	i18next.configs["flat/recommended"],

	// TanStack Query and Router recommended rule sets (queryKey deps, stable
	// clients, route property order / param names, etc.)
	...pluginQuery.configs["flat/recommended"],
	...pluginRouter.configs["flat/recommended"],

	{
		plugins: {
			"react-refresh": reactRefresh,
		},
		settings: {
			react: {
				version: "detect",
			},
		},
		rules: {
			"react/react-in-jsx-scope": "off",
			"react-refresh/only-export-components": [
				"warn",
				{ allowConstantExport: true },
			],
		},
	},

	{
		// TanStack file-based routes necessarily pair the route component with a
		// `Route` export created via createFileRoute(); that is by design, so the
		// Fast Refresh rule does not apply to route modules. It stays active for
		// all other components.
		files: ["src/routes/**/*.{ts,tsx}"],
		rules: {
			"react-refresh/only-export-components": "off",
		},
	},

	{
		// The Cloudflare Worker that fronts the S3-hosted builds. It runs in the
		// Workers runtime - not the browser, not Node - so its globals have to be
		// declared here, and it serves no UI, so the i18n literal-string rule does
		// not apply to it.
		files: ["docs/worker.js"],
		languageOptions: {
			globals: {
				fetch: "readonly",
				Request: "readonly",
				Response: "readonly",
				URL: "readonly",
				console: "readonly",
			},
		},
		rules: {
			"i18next/no-literal-string": "off",
		},
	},

	{
		rules: {
			// Prop validation is handled by TypeScript; the runtime prop-types
			// rule is redundant noise in a fully typed codebase.
			"react/prop-types": "off",
			"@typescript-eslint/no-explicit-any": "off", // For now: explicit any should still be avoided, but can't be avoided everywhere just yet.
			"@typescript-eslint/ban-ts-comment": [
				"error",
				{ "ts-ignore": "allow-with-description" }, // ts-ignore is only allowed with a justification
			],
			"no-duplicate-imports": 2,
			"no-self-compare": 2,
			"no-constant-binary-expression": 2,
			// @tanstack/query/exhaustive-deps is disabled for this codebase. Every
			// finding is a false positive under our established pattern:
			//  - Fetch inputs (gqlClient, cfg, auth, t) are stable values from the
			//    TanStack Router context / i18n, not cache discriminators.
			//  - Query variables are derived from MUI DataGrid models via array-index
			//    access (sortModel[0].field). The whole sortModel / paginationModel /
			//    filterModel objects are already in every queryKey, but the rule
			//    cannot recognise that an indexed member is covered by its parent, and
			//    its allowlist only matches dot-paths, not [0] access.
			// The other TanStack Query rules (stable-query-client, no-void-query-fn,
			// mutation/infinite property order, no-unstable-deps, no-rest-destructuring)
			// remain enabled and do add value.
			"@tanstack/query/exhaustive-deps": "off",
		},
	},
];
