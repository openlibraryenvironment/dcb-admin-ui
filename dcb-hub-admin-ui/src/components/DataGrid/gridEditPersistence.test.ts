import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * A grid that can start an edit can persist one.
 *
 * With no `processRowUpdate`, MUI's row editing takes its last branch and commits into
 * grid state alone (`useGridRowEditing.js`: `apiRef.current.updateRows`), so the edit
 * looks saved, reaches no server, and reverts on the next fetch.
 *
 * A source scan, because the claim is about the wiring of twenty-odd call sites rather
 * than one component's behaviour. It relies on a grid and its props living in the same
 * file; `it("finds the grids")` fails if that stops being true.
 */

const repoRoot = process.cwd();

const sourcesUnder = (dir: string): string[] => {
	const absolute = path.resolve(repoRoot, dir);
	return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
		const next = path.join(dir, entry.name);
		if (entry.isDirectory()) return sourcesUnder(next);
		// Tests themselves are excluded, including this one: it quotes both props it
		// looks for, so scanning itself made it its own first false positive.
		return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
			? [next]
			: [];
	});
};

const read = (file: string) =>
	readFileSync(path.resolve(repoRoot, file), "utf8");

/** `@columns/locationColumns` -> `src/columns/locationColumns.ts`. */
const columnModulesImportedBy = (source: string): string[] =>
	[...source.matchAll(/from\s+"@columns\/([\w/]+)"/g)].map(
		(match) => `src/columns/${match[1]}.ts`,
	);

/**
 * Does this file put an editable cell on screen?
 *
 * Either it declares one inline, or it spreads in a `@columns/*` module that does. The
 * indirection is the whole reason a reviewer misses this: `/locations` had no
 * `editable` anywhere in it, only `...defaultLocationColumns`.
 */
const hasEditableColumn = (file: string, source: string): boolean => {
	if (source.includes("editable: true")) return true;
	return columnModulesImportedBy(source).some((module) => {
		try {
			return read(module).includes("editable: true");
		} catch {
			// A `@columns` path that does not resolve is not this test's business; the
			// type-checker already refuses it.
			return false;
		}
	});
};

const EDIT_MODE = /editMode=(?:"(?:row|cell)"|\{)/;

/**
 * The PROP, not the word.
 *
 * Both of these matched a bare `includes("processRowUpdate")` and neither persists
 * anything: the comment above the fix in `locations/index.tsx` names the prop, and
 * every grid that imports `buildRowEditActionsColumn` pulls in a doc comment that
 * mentions it too. This test passed on the very defect it was written for until the
 * match was tightened — which is the only reason to reintroduce a defect and watch.
 */
const PROCESS_ROW_UPDATE = /processRowUpdate\s*=\s*\{/;

/** Rendered, not merely imported. An import persists nothing either. */
const DIALOGS_RENDERED = /<EntityMutationDialogs[\s/>]/;

const allSources = [
	...sourcesUnder("src/routes"),
	...sourcesUnder("src/components"),
	...sourcesUnder("src/forms"),
].map((file) => ({ file, source: read(file) }));

const candidates = allSources.filter(({ source }) => EDIT_MODE.test(source));

/** Every page or component that drives a mutation through the shared hook. */
const mutators = allSources.filter(({ source }) =>
	source.includes("useEntityMutation("),
);

describe("every grid that can start an edit can persist one", () => {
	// Guard the guard. Renaming the prop, or moving the routes, would otherwise leave a
	// suite that passes because it found nothing to check.
	it("finds the grids", () => {
		expect(candidates.length).toBeGreaterThan(8);
		expect(
			candidates.filter(({ file, source }) => hasEditableColumn(file, source))
				.length,
		).toBeGreaterThan(5);
	});

	it.each(candidates.map(({ file }) => file))(
		"%s declares processRowUpdate if any of its columns are editable",
		(file) => {
			const source = read(file);
			if (!hasEditableColumn(file, source)) return;

			expect(
				PROCESS_ROW_UPDATE.test(source),
				`${file} renders an editable grid with no processRowUpdate. MUI commits ` +
					`the edit to grid state alone, so it looks saved and is not.`,
			).toBe(true);
		},
	);

	/**
	 * Every caller of the hook renders its dialogs.
	 *
	 * The request functions mutate nothing: they set `pending`, and
	 * EntityMutationDialogs is what collects the audit fields and runs the mutation.
	 * Omit it and a grid edit never settles its promise either, so the row stays in
	 * edit mode for the session. Not restricted to grids - a details page calling
	 * `requestFormEdit` fails the same way.
	 */
	it("finds the callers", () => {
		expect(mutators.length).toBeGreaterThan(15);
	});

	it.each(mutators.map(({ file }) => file))(
		"%s renders EntityMutationDialogs",
		(file) => {
			expect(
				DIALOGS_RENDERED.test(read(file)),
				`${file} calls useEntityMutation but never renders ` +
					`<EntityMutationDialogs>, so nothing it requests is ever confirmed ` +
					`and nothing is ever sent.`,
			).toBe(true);
		},
	);
});
