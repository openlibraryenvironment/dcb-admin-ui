import type { CodegenConfig } from "@graphql-codegen/cli";

// `typescript-operations`, NOT the `client` preset.
//
// The client preset expects documents authored as graphql("query ...") calls and
// layers fragment-masking on top. Our documents are gql`` tagged template strings
// consumed by graphql-request, so the preset's output was unusable without
// rewriting all 74 documents - which is why nothing ever imported it.
//
// This plugin reads the same gql`` documents untouched and emits a result/variables
// type pair per *named* operation (query LoadLibraries -> LoadLibrariesQuery +
// LoadLibrariesQueryVariables), which plug straight into graphql-request's
// request<TData, TVariables>() signature.
//
// It is deliberately the ONLY plugin here. As of v6 typescript-operations is
// self-contained: it emits the schema input types and enums its operations depend
// on. Pairing it with the `typescript` plugin (the usual pre-v6 recipe) makes both
// plugins emit those types and every one of them collides with TS2300 "Duplicate
// identifier".
const config: CodegenConfig = {
	schema: "./schema.graphqls",
	documents: "src/graphql/**/*.ts",
	overwrite: true,
	// Format the artifact as part of generating it.
	//
	// Raw typescript-operations output puts each operation type on one line (the
	// longest is ~3.8k characters). Prettier - via format-on-save, or the
	// lint-staged hook this repo used to run - then reformatted it to 80 columns
	// before it was committed. So the checked-in file was prettier(codegen),
	// while CI's `npm run codegen` produced codegen(), and the CI gate diffed the
	// two and failed every time. Locally it looked like nothing was wrong:
	// codegen wrote the raw file, the editor reformatted it straight back to the
	// committed bytes, and `git commit` reported nothing to commit.
	//
	// Generating the formatted file makes the two identical by construction, so
	// the gate compares like with like no matter who or what runs it.
	hooks: { afterOneFileWrite: ["prettier --write"] },
	generates: {
		"src/generated/graphql.ts": {
			plugins: ["typescript-operations"],
			config: {
				// Our documents never select __typename, so emitting it would describe a
				// field the server does not actually return.
				skipTypename: true,
				scalars: {
					// The schema's `scalar JSON` (clientConfig, alarmDetails, ...) defaults
					// to `unknown`, which makes every property read on it a type error.
					// It is always a JSON object in practice, so say so.
					JSON: "Record<string, any>",
				},
			},
		},
	},
};

export default config;
