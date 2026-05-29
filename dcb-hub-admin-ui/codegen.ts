import type { CodegenConfig } from "@graphql-codegen/cli";
import * as dotenv from "dotenv";
dotenv.config();
const apiBase = process.env.VITE_DCB_API_BASE || "http://localhost:8080";

const config: CodegenConfig = {
	overwrite: true,
	schema: `${apiBase}/graphql`,
	documents: "src/graphql/**/*.ts",
	generates: {
		"src/generated/graphql.ts": {
			plugins: [
				"typescript",
				"typescript-operations",
				"typescript-react-query",
			],
			config: {
				fetcher: "graphql-request",
				exposeQueryKeys: true,
				exposeFetcher: true,
				withHooks: true,
			},
		},
	},
};

export default config;
