// Per-chunk byte budgets over dist/, run after a build - see docs/performance-budget.md.
//
// Lighthouse measures PAGES; this measures CHUNKS. lighthouserc.js audits /login and
// /consortium/insights, so its total-byte-weight counts only what those two pages fetch:
// on the day this was added the application shipped 1,650 KB gzipped across 382 chunks
// and the budget could see 750 KB of it. The heaviest thing in the artefact - exceljs, at
// 276 KB - sat outside every gate in the repository and could have doubled without one
// going red.
//
// Ported from dcb-admin-for-libraries, unchanged but for this header and the numbers.
import { readdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const ASSETS = join("dist", "assets");
const BUDGET = JSON.parse(readFileSync("bundle-budget.json", "utf8"));

// Below this a chunk is not worth naming individually; the total below catches drift in
// aggregate. Above it, a chunk must be in the budget file — so new weight arrives with a
// number beside it rather than silently.
const NAME_ABOVE = BUDGET.nameChunksAboveBytes;

/** "RequestsGrid-CMPomE8g.js" -> "RequestsGrid.js": the content hash is not identity. */
function withoutHash(file) {
	return file.replace(/-[A-Za-z0-9_-]{8,}(\.[a-z]+)$/, "$1");
}

const measured = readdirSync(ASSETS)
	.filter((file) => file.endsWith(".js") || file.endsWith(".css"))
	.map((file) => ({
		name: withoutHash(file),
		file,
		gz: gzipSync(readFileSync(join(ASSETS, file))).length,
	}))
	.sort((a, b) => b.gz - a.gz);

const problems = [];
const total = measured.reduce((sum, chunk) => sum + chunk.gz, 0);

for (const chunk of measured) {
	const budget = BUDGET.chunks[chunk.name];

	if (budget === undefined) {
		if (chunk.gz > NAME_ABOVE) {
			problems.push(
				`${chunk.name} is ${chunk.gz} bytes gzipped and has no budget. Add it to ` +
					`bundle-budget.json with the number it measures today, or make it smaller ` +
					`than ${NAME_ABOVE}.`,
			);
		}
		continue;
	}

	if (chunk.gz > budget) {
		problems.push(
			`${chunk.name} is ${chunk.gz} bytes gzipped, over its budget of ${budget} ` +
				`(+${chunk.gz - budget}). Cut the weight, or bring an argument — do not raise ` +
				`the number to make this pass.`,
		);
	}
}

for (const name of Object.keys(BUDGET.chunks)) {
	if (!measured.some((chunk) => chunk.name === name)) {
		// A budget for a chunk that no longer exists is a number nobody is checking.
		problems.push(`${name} is budgeted but no longer built. Remove it from bundle-budget.json.`);
	}
}

if (total > BUDGET.totalBytes) {
	problems.push(
		`Everything in dist/assets is ${total} bytes gzipped, over the total budget of ` +
			`${BUDGET.totalBytes} (+${total - BUDGET.totalBytes}).`,
	);
}

const widest = Math.max(...measured.map((chunk) => chunk.name.length));
for (const chunk of measured.filter((c) => c.gz > NAME_ABOVE)) {
	const budget = BUDGET.chunks[chunk.name];
	const room = budget === undefined ? "unbudgeted" : `${budget - chunk.gz} to spare`;
	console.log(`  ${chunk.name.padEnd(widest)}  ${String(chunk.gz).padStart(7)} gz   ${room}`);
}
console.log(`  ${"TOTAL".padEnd(widest)}  ${String(total).padStart(7)} gz   ${BUDGET.totalBytes - total} to spare`);

if (problems.length > 0) {
	console.error(`\nBundle budget: ${problems.length} problem(s)\n`);
	for (const problem of problems) {
		console.error(`  - ${problem}`);
	}
	process.exit(1);
}

console.log("\nBundle budget: green.");
