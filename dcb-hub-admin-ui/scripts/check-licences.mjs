// Production dependency licences against an allow-list, read from package-lock.json so no
// install is needed. A new licence is a supply-chain decision: add it here in the same change.
// Writes reports/licences.json for the release report, before any exit.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const ALLOWED = new Set([
	"MIT",
	"ISC",
	"Apache-2.0",
	"BSD-2-Clause",
	"BSD-3-Clause",
	"0BSD",
	"OFL-1.1",
	"Unlicense",
	"MIT AND ISC",
	"(MIT AND Zlib)",
	"(MIT OR CC0-1.0)",
	"(MIT OR GPL-3.0-or-later)",
]);

// MUI X Pro and Premium declare "SEE LICENSE IN LICENSE": commercial, covered by the MUI X licence key
const COMMERCIAL = /^node_modules\/@mui\/x-[^/]+$/;

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const production = Object.entries(lock.packages).filter(
	([path, pkg]) => path && !pkg.dev && !pkg.devOptional && !pkg.link,
);

const byLicence = {};
const commercial = [];
const unvetted = [];
for (const [path, pkg] of production) {
	const licence = pkg.license ?? "none declared";
	byLicence[licence] = (byLicence[licence] ?? 0) + 1;
	const name = path.replace(/^.*node_modules\//, "");
	if (ALLOWED.has(pkg.license)) continue;
	if (COMMERCIAL.test(path)) commercial.push(name);
	else unvetted.push({ name, licence });
}

mkdirSync("reports", { recursive: true });
writeFileSync(
	"reports/licences.json",
	JSON.stringify({ packages: production.length, byLicence, commercial, unvetted }),
);

for (const { name, licence } of unvetted) console.error(`  ${name}: ${licence}`);
if (unvetted.length > 0) {
	console.error(
		`\n${unvetted.length} production package(s) with a licence not on the allow-list.`,
	);
	process.exit(1);
}
console.log(`Licences: green. ${production.length} production packages.`);
