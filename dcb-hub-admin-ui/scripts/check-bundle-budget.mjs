// Gzipped bundle budgets over dist/, run after a BUNDLE_BUDGET=1 build. What every page
// loads first FAILS when over; the total is reported. docs/performance-budget.md says what
// each check is for and why the total is not one.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const DIST = "dist";
const MANIFEST = join(DIST, ".vite", "manifest.json");
const BUDGET = JSON.parse(readFileSync("bundle-budget.json", "utf8"));

if (!existsSync(MANIFEST)) {
	console.error(
		`${MANIFEST} is missing: build with BUNDLE_BUDGET=1 VITE_PUBLIC_URL=/ first.`,
	);
	process.exit(1);
}
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));

/** "RequestsGrid-CMPomE8g.js" -> "RequestsGrid.js": the content hash is not identity. */
const withoutHash = (file) =>
	file.replace(/^assets\//, "").replace(/-[A-Za-z0-9_-]{8,}(\.[a-z]+)$/, "$1");

const isCode = (file) => file.endsWith(".js") || file.endsWith(".css");
const gzCache = new Map();
const gz = (file) => {
	if (!gzCache.has(file)) {
		gzCache.set(file, gzipSync(readFileSync(join(DIST, file))).length);
	}
	return gzCache.get(file);
};

/** A set of manifest entries and everything they import statically: what they load before they run. */
function filesOf(keys) {
	const files = new Set();
	const seen = new Set();
	const follow = (key) => {
		const entry = manifest[key];
		if (!entry || seen.has(key)) return;
		seen.add(key);
		files.add(entry.file);
		for (const css of entry.css ?? []) files.add(css);
		for (const dep of entry.imports ?? []) follow(dep);
	};
	keys.forEach(follow);
	return files;
}

// Chunks with no limit of their own, each with its reason in the budget file. Not counted
// in the first load either: the catalogue grows with every string, and Lighthouse's
// /login total-byte-weight is where its cost to users is gated.
const UNBOUNDED = BUDGET.unbounded ?? {};

// The entry and the app shell it boots (main.tsx imports application.tsx), with their
// static imports. A sum of files, so a bundler regrouping them cannot fail it.
const firstLoadFiles = new Set(
	[...filesOf(["index.html", ...(manifest["index.html"]?.dynamicImports ?? [])])].filter(
		(file) => isCode(file) && !(withoutHash(file) in UNBOUNDED),
	),
);
const firstLoad = [...firstLoadFiles].reduce((sum, file) => sum + gz(file), 0);

const measured = readdirSync(join(DIST, "assets"))
	.map((file) => `assets/${file}`)
	.filter(isCode)
	.map((file) => ({ file, name: withoutHash(file), gz: gz(file) }))
	.sort((a, b) => b.gz - a.gz);
const total = measured.reduce((sum, chunk) => sum + chunk.gz, 0);

const problems = [];

if (firstLoad > BUDGET.firstLoad.budget) {
	problems.push(
		`What every page loads first is ${firstLoad} bytes gzipped, over its budget of ` +
			`${BUDGET.firstLoad.budget} (+${firstLoad - BUDGET.firstLoad.budget}). Move the ` +
			`new weight into the route that needs it, or bring an argument: do not raise the ` +
			`number to make this pass.`,
	);
}

// Outside the first load, a chunk above the threshold must have a number, so a heavy new
// dependency or an accidental split arrives with one beside it
for (const chunk of measured) {
	if (chunk.name in UNBOUNDED || firstLoadFiles.has(chunk.file)) continue;
	const budget = BUDGET.chunks[chunk.name];
	if (budget === undefined) {
		if (chunk.gz > BUDGET.nameChunksAboveBytes) {
			problems.push(
				`${chunk.name} is ${chunk.gz} bytes gzipped and has no budget. Add it to ` +
					`bundle-budget.json with the number it measures today, or make it smaller ` +
					`than ${BUDGET.nameChunksAboveBytes}.`,
			);
		}
		continue;
	}
	if (chunk.gz > budget) {
		problems.push(
			`${chunk.name} is ${chunk.gz} bytes gzipped, over its budget of ${budget} ` +
				`(+${chunk.gz - budget}). Cut the weight, or bring an argument: do not raise ` +
				`the number to make this pass.`,
		);
	}
}

for (const name of Object.keys(BUDGET.chunks)) {
	const built = measured.filter((chunk) => chunk.name === name);
	if (built.length === 0) {
		problems.push(`${name} is budgeted but no longer built. Remove it from bundle-budget.json.`);
	} else if (built.every((chunk) => firstLoadFiles.has(chunk.file))) {
		problems.push(
			`${name} is budgeted but is now in the first load, which the first-load budget ` +
				`covers. Remove its own number from bundle-budget.json.`,
		);
	}
}
for (const name of Object.keys(UNBOUNDED)) {
	if (name in BUDGET.chunks) {
		problems.push(`${name} is both budgeted and unbounded in bundle-budget.json. Keep one.`);
	}
	if (!measured.some((chunk) => chunk.name === name)) {
		problems.push(`${name} is unbounded but no longer built. Remove it from bundle-budget.json.`);
	}
}

const widest = Math.max(20, ...measured.map((chunk) => chunk.name.length));
const line = (label, size, note) =>
	console.log(`  ${label.padEnd(widest)}  ${String(size).padStart(8)} gz   ${note}`);

line(
	"FIRST LOAD",
	firstLoad,
	`${BUDGET.firstLoad.budget - firstLoad} to spare (${firstLoadFiles.size} files)`,
);
for (const chunk of measured.filter(
	(c) => c.gz > BUDGET.nameChunksAboveBytes && !firstLoadFiles.has(c.file),
)) {
	const budget = BUDGET.chunks[chunk.name];
	line(
		chunk.name,
		chunk.gz,
		chunk.name in UNBOUNDED
			? "unbounded"
			: budget === undefined
				? "unbudgeted"
				: `${budget - chunk.gz} to spare`,
	);
}
line("everything emitted", total, "for information; not a budget");

if (problems.length > 0) {
	console.error(`\nBundle budget: ${problems.length} problem(s)\n`);
	for (const problem of problems) console.error(`  - ${problem}`);
	process.exit(1);
}
console.log("\nBundle budget: green.");
