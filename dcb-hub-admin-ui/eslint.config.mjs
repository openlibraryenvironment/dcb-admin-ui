// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import i18next from "eslint-plugin-i18next";
import reactRefresh from "eslint-plugin-react-refresh";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// FlatCompat is required to bridge legacy configs into ESLint 9
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
});

export default [
	...compat.extends(
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:jsx-a11y/recommended",
		"plugin:react/recommended",
		"plugin:react-hooks/recommended",
		"prettier",
	),

	i18next.configs["flat/recommended"],

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
		rules: {
			"@typescript-eslint/no-explicit-any": "off", // For now: explicit any should still be avoided, but can't be avoided everywhere just yet.
			"@typescript-eslint/ban-ts-comment": [
				"error",
				{ "ts-ignore": "allow-with-description" }, // ts-ignore is only allowed with a justification
			],
			"no-duplicate-imports": 2,
			"no-self-compare": 2,
			"no-constant-binary-expression": 2,
		},
	},
];
