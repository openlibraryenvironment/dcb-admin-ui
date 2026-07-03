import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
	schema: "./schema.graphqls",
	documents: "src/graphql/**/*.ts",
	overwrite: true,
	generates: {
		"src/generated/graphql/": {
			preset: "client",
			config: {
				documentMode: "string",
			},
		},
	},
};

export default config;
