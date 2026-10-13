import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

import application from "./locales/en-GB/application.json";

// A key the catalogue does not carry renders as the key itself. The e2e fixture catches
// that on the journeys the suite runs; this catches every key written out in full, on
// every path, run or not. A key built at runtime is left to the e2e fixture. docs/i18n.md.

const PLURAL_SUFFIXES = [
	"",
	"_zero",
	"_one",
	"_two",
	"_few",
	"_many",
	"_other",
];
const KEY_SHAPE = /^[A-Za-z][A-Za-z0-9_-]*(\.[A-Za-z0-9_-]+)+$/;

type Tree = { [key: string]: string | Tree };

const lookup = (catalogue: Tree, key: string) =>
	key
		.split(".")
		.reduce<unknown>(
			(node, part) =>
				node && typeof node === "object" ? (node as Tree)[part] : undefined,
			catalogue,
		);

/** Every key written out in full in `text` that `catalogue` cannot resolve, with its line. */
export function unresolvedKeys(
	fileName: string,
	text: string,
	catalogue: Tree,
): string[] {
	const source = ts.createSourceFile(
		fileName,
		text,
		ts.ScriptTarget.Latest,
		true,
		fileName.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
	);
	const found: string[] = [];

	const check = (node: ts.Node | undefined) => {
		if (!node) return;
		if (ts.isConditionalExpression(node)) {
			check(node.whenTrue);
			check(node.whenFalse);
			return;
		}
		if (!ts.isStringLiteral(node) && !ts.isNoSubstitutionTemplateLiteral(node))
			return;
		const key = node.text;
		if (!KEY_SHAPE.test(key)) return;
		const resolves = PLURAL_SUFFIXES.some(
			(suffix) => typeof lookup(catalogue, key + suffix) === "string",
		);
		if (!resolves)
			found.push(
				`${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}: ${key}`,
			);
	};

	const visit = (node: ts.Node): void => {
		// The first argument of a call to t, i18n.t or i18next.t
		if (ts.isCallExpression(node)) {
			const callee = node.expression;
			const isT =
				(ts.isIdentifier(callee) && callee.text === "t") ||
				(ts.isPropertyAccessExpression(callee) &&
					callee.name.text === "t" &&
					/^(i18n|i18next)$/.test(callee.expression.getText()));
			if (isT) check(node.arguments[0]);
		}
		// The i18nKey attribute of a Trans element
		if (
			ts.isJsxAttribute(node) &&
			node.name.getText() === "i18nKey" &&
			node.initializer
		)
			check(
				ts.isJsxExpression(node.initializer)
					? node.initializer.expression
					: node.initializer,
			);
		// A property named …Key (labelKey, titleKey, translationKey): a key another call translates
		if (ts.isPropertyAssignment(node) && /Key$/.test(node.name.getText()))
			check(node.initializer);
		ts.forEachChild(node, visit);
	};
	visit(source);
	return found;
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

describe("every translation key written out in full is in the en-GB catalogue", () => {
	it("finds the forms it is here to find", () => {
		const catalogue: Tree = {
			ui: {
				save: "Save",
				item_one: "{{count}} item",
				item_other: "{{count}} items",
			},
		};
		const found = unresolvedKeys(
			"probe.tsx",
			[
				't("ui.save");', // resolves
				't("ui.item", { count: 2 });', // resolves through its plural forms
				't("ui.missing");', // 3
				'i18n.t(flag ? "ui.save" : "ui.gone");', // 4
				'const x = <Trans i18nKey="ui.absent" />;', // 5
				'const tab = { labelKey: "ui.nowhere" };', // 6
				"t(`ui.${dynamic}`);", // built at runtime: the e2e fixture's job
				'const route = "libraries.list";', // not passed to t(): not a key
			].join("\n"),
			catalogue,
		);
		expect(found).toEqual([
			"3: ui.missing",
			"4: ui.gone",
			"5: ui.absent",
			"6: ui.nowhere",
		]);
	});

	it.each(sourceFiles)("%s", (file) => {
		expect(
			unresolvedKeys(
				file,
				readFileSync(path.join(SRC, file), "utf8"),
				application as Tree,
			),
		).toEqual([]);
	});
});
