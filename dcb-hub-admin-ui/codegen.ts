// import type { CodegenConfig } from "@graphql-codegen/cli";
// import * as dotenv from "dotenv";
// import * as readline from "readline";

// // Load environment variables from your local .env file
// dotenv.config();

// const apiBase = process.env.VITE_DCB_API_BASE || "http://localhost:8080";
// const keycloakUrl = process.env.VITE_KEYCLOAK_URL;
// const clientId = process.env.VITE_KEYCLOAK_ID || "";
// const clientSecret = process.env.KEYCLOAK_SECRET || "";

// // Helper function to prompt the user in the terminal
// const promptForToken = (): Promise<string> => {
// 	const rl = readline.createInterface({
// 		input: process.stdin,
// 		output: process.stdout,
// 	});

// 	return new Promise((resolve) => {
// 		rl.question(
// 			"\n⚠️  Auto-fetch failed. Please paste your Bearer token: ",
// 			(answer) => {
// 				rl.close();
// 				resolve(answer.trim());
// 			},
// 		);
// 	});
// };

// export default (async (): Promise<CodegenConfig> => {
// 	// Check if we are running in local mode
// 	const isLocalMode = process.env.LOCAL_SCHEMA === "true";

// 	// Define the base configuration shared by both modes
// 	const baseConfig = {
// 		overwrite: true,
// 		documents: "src/graphql/**/*.ts",
// 		generates: {
// 			"src/generated/graphql.ts": {
// 				preset: "client",
// 				plugins: [
// 					"typescript",
// 					"typescript-operations",
// 					"typescript-react-query",
// 				],
// 				config: {
// 					fetcher: "graphql-request",
// 					exposeQueryKeys: true,
// 					exposeFetcher: true,
// 					withHooks: true,
// 					reactQueryVersion: 5,
// 					// documentMode: "string",
// 				},
// 			},
// 		},
// 	};

// 	// If we already have a schema, no need to fetch
// 	if (isLocalMode) {
// 		console.log(
// 			"📂 Running in LOCAL mode. Skipping server auth and using ./schema.graphqls",
// 		);
// 		return {
// 			...baseConfig,
// 			schema: "./schema.graphqls", // Point directly to the file in your root
// 		} as CodegenConfig;
// 	}

// 	// ==========================================
// 	// MODE 2: REMOTE SERVER FETCH
// 	// ==========================================
// 	let token = "";

// 	try {
// 		console.log(
// 			"🌐 Running in REMOTE mode. Fetching schema auth token from Keycloak...",
// 		);

// 		const params = new URLSearchParams();
// 		params.append("grant_type", "client_credentials");

// 		const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
// 			"base64",
// 		);

// 		const response = await fetch(
// 			`${keycloakUrl}/protocol/openid-connect/token`,
// 			{
// 				method: "POST",
// 				headers: {
// 					"Content-Type": "application/x-www-form-urlencoded",
// 					Authorization: `Basic ${basicAuth}`,
// 				},
// 				body: params,
// 			},
// 		);

// 		if (!response.ok) {
// 			const errorText = await response.text();
// 			throw new Error(
// 				`Keycloak responded with status: ${response.status} - ${errorText}`,
// 			);
// 		}

// 		const data = await response.json();
// 		token = data.access_token;
// 		console.log("✅ Token retrieved successfully. Fetching schema...");
// 	} catch (error) {
// 		console.error(
// 			`\n❌ Failed to fetch Codegen auth token: ${error instanceof Error ? error.message : "Unknown Error"}`,
// 		);

// 		if (process.env.CODEGEN_SCHEMA_TOKEN) {
// 			console.log("✅ Using fallback token from .env (CODEGEN_SCHEMA_TOKEN).");
// 			token = process.env.CODEGEN_SCHEMA_TOKEN;
// 		} else {
// 			token = await promptForToken();
// 			if (!token) {
// 				console.warn(
// 					"⚠️  No token provided. Attempting to fetch remote schema without authentication...",
// 				);
// 			}
// 		}
// 	}

// 	return {
// 		...baseConfig,
// 		schema: [
// 			{
// 				[`${apiBase}/graphql`]: {
// 					headers: {
// 						...(token && { Authorization: `Bearer ${token}` }),
// 					},
// 				},
// 			},
// 		],
// 	} as CodegenConfig;
// })();

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
