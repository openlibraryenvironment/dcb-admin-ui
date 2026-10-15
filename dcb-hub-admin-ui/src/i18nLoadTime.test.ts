import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// i18n.t() run while a module loads is fixed in whatever language, and from whatever
// catalogue, exists at that moment: a later language choice never reaches it, and a
// string loaded after it is a raw key. Translate where the string is used - a `t`
// passed in, or a message function the validator calls. docs/i18n.md.

const EAGER_CALLBACKS = new Set([
	"map",
	"flatMap",
	"forEach",
	"filter",
	"reduce",
	"some",
	"every",
	"find",
]);

const isTranslateRef = (node: ts.Node): boolean =>
	ts.isPropertyAccessExpression(node) &&
	/^(i18n|i18next)$/.test(node.expression.getText()) &&
	node.name.text === "t";

const isTranslate = (node: ts.Node): node is ts.CallExpression =>
	ts.isCallExpression(node) && isTranslateRef(node.expression);

/** Line numbers of every i18n.t() that runs while `text` is being loaded. */
export function loadTimeTranslations(fileName: string, text: string): number[] {
	const source = ts.createSourceFile(
		fileName,
		text,
		ts.ScriptTarget.Latest,
		true,
		fileName.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
	);

	// Functions declared at module level, so a call to one at load time can be followed
	const local = new Map<string, ts.Node>();
	for (const statement of source.statements) {
		if (ts.isFunctionDeclaration(statement) && statement.name && statement.body)
			local.set(statement.name.text, statement.body);
		if (ts.isVariableStatement(statement))
			for (const d of statement.declarationList.declarations)
				if (
					ts.isIdentifier(d.name) &&
					d.initializer &&
					(ts.isArrowFunction(d.initializer) ||
						ts.isFunctionExpression(d.initializer))
				)
					local.set(d.name.text, d.initializer.body);
	}

	const lines = new Set<number>();
	const followed = new Set<ts.Node>();
	const atLoad = (node: ts.Node): void => {
		if (isTranslate(node))
			lines.add(source.getLineAndCharacterOfPosition(node.getStart()).line + 1);
		if (ts.isCallExpression(node)) {
			// i18n.t handed to another function at load: that function translates now
			for (const arg of node.arguments)
				if (isTranslateRef(arg))
					lines.add(
						source.getLineAndCharacterOfPosition(arg.getStart()).line + 1,
					);
			const callee = node.expression;
			const body = ts.isIdentifier(callee) ? local.get(callee.text) : undefined;
			if (body && !followed.has(body)) {
				followed.add(body);
				atLoad(body);
			}
			if (
				ts.isPropertyAccessExpression(callee) &&
				EAGER_CALLBACKS.has(callee.name.text)
			)
				for (const arg of node.arguments)
					if (ts.isArrowFunction(arg) || ts.isFunctionExpression(arg))
						atLoad(arg.body);
		}
		if (ts.isFunctionLike(node)) return; // runs later, if at all
		ts.forEachChild(node, atLoad);
	};
	atLoad(source);
	return [...lines].sort((a, b) => a - b);
}

const SRC = path.resolve(__dirname);

const sourceFiles = (readdirSync(SRC, { recursive: true }) as string[])
	.map((file) => file.split(path.sep).join("/"))
	.filter(
		(file) =>
			/\.tsx?$/.test(file) &&
			!/\.test\.tsx?$/.test(file) &&
			!file.startsWith("generated/"),
	);

describe("no translation runs while a module loads", () => {
	it("finds the patterns it is here to find", () => {
		const found = loadTimeTranslations(
			"probe.ts",
			[
				'const direct = i18n.t("a");', // 1
				"const helper = (key: string) => i18n.t(key);", // 2: called on 3
				'const viaHelper = helper("b");',
				'const mapped = ["c"].map((k) => i18n.t(k));', // 4
				'const deferred = () => i18n.t("d");', // never called at load
				'const lazy = { error: () => i18n.t("e") };',
				"const handed = getOptions(i18n.t);", // 7
				"const deferredHand = () => getOptions(i18n.t);",
			].join("\n"),
		);
		expect(found).toEqual([1, 2, 4, 7]);
	});

	it.each(sourceFiles)("%s", (file) => {
		expect(
			loadTimeTranslations(file, readFileSync(path.join(SRC, file), "utf8")),
		).toEqual([]);
	});
});
