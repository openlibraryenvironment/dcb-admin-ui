import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * Every route path the generated tree declares, read as text.
 *
 * Text rather than an import: routeTree.gen.ts statically imports all 84 route
 * modules, and with them the schemas, the locale catalogue and the charts - so
 * importing it to learn a list of strings costs a full application graph in a unit
 * test. `FileRoutesByFullPath` is generated from the same source of truth as the
 * tree itself, so reading it cannot drift from the routes that exist.
 *
 * Test-only: this reads from disk and must never reach the bundle.
 */
export function readRouteTreePaths(
	generatedFile = path.resolve(
		path.dirname(fileURLToPath(import.meta.url)),
		"../../routeTree.gen.ts",
	),
): string[] {
	const source = readFileSync(generatedFile, "utf8");
	const marker = "export interface FileRoutesByFullPath {";
	const start = source.indexOf(marker);
	if (start === -1) {
		throw new Error(`${generatedFile} has no FileRoutesByFullPath interface`);
	}
	const block = source.slice(start + marker.length);
	const body = block.slice(0, block.indexOf("\n}"));
	const paths = [...body.matchAll(/^\s*'([^']+)':/gm)].map((match) => match[1]);
	if (paths.length === 0) {
		throw new Error(`No route paths parsed from ${generatedFile}`);
	}
	return paths;
}
