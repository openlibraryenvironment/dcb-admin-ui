// Lighthouse against the preview, with the assertions in lighthouserc: what `lhci autorun` did,
// on Lighthouse itself. Why it replaced @lhci/cli: docs/performance-budget.md, "Lighthouse measures pages".
//
// Usage: npm run lighthouse    writes .lighthouseci/, exits 1 on a failed `error` assertion
import { spawn, spawnSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { clearTimeout, setTimeout } from "node:timers";

const require = createRequire(import.meta.url);
const OUT = ".lighthouseci";
const CONFIG = ["lighthouserc.cjs", "lighthouserc.js"].find((name) =>
	existsSync(name),
);
if (!CONFIG) throw new Error("No lighthouserc.cjs or lighthouserc.js here.");

/** @type {{ collect: Record<string, any>, assert: Record<string, any> }} */
const { collect, assert } = require(resolve(CONFIG)).ci;
const cli = require.resolve("lighthouse/cli/index.js");

// Every setting this runner passes on. One it does not know would be silently ignored.
const KNOWN_SETTINGS = new Set(["preset", "chromeFlags", "onlyCategories"]);
const unknown = Object.keys(collect.settings ?? {}).filter(
	(key) => !KNOWN_SETTINGS.has(key),
);
if (unknown.length) {
	throw new Error(
		`${CONFIG} sets ${unknown.join(", ")}, which ${import.meta.url} does not pass to Lighthouse.`,
	);
}

/** Starts the preview and resolves once it prints the ready pattern. */
function startServer() {
	const server = spawn(collect.startServerCommand, {
		shell: true,
		detached: process.platform !== "win32",
		stdio: ["ignore", "pipe", "pipe"],
	});
	return new Promise((resolveReady, reject) => {
		const timer = setTimeout(
			() =>
				reject(
					new Error(
						`The preview printed no "${collect.startServerReadyPattern}" in ${collect.startServerReadyTimeout} ms.`,
					),
				),
			collect.startServerReadyTimeout,
		);
		const watch = (chunk) => {
			process.stdout.write(chunk);
			if (String(chunk).includes(collect.startServerReadyPattern)) {
				clearTimeout(timer);
				resolveReady(server);
			}
		};
		server.stdout.on("data", watch);
		server.stderr.on("data", watch);
		server.on("exit", (code) => {
			clearTimeout(timer);
			reject(new Error(`The preview exited with ${code} before it was ready.`));
		});
	});
}

function stopServer(server) {
	server.removeAllListeners("exit");
	if (process.platform === "win32") {
		spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"]);
	} else {
		process.kill(-server.pid, "SIGTERM");
	}
}

function runLighthouse(url, base) {
	const { preset, chromeFlags = "", onlyCategories } = collect.settings ?? {};
	const args = [
		cli,
		url,
		"--output=json",
		"--output=html",
		`--output-path=${base}`,
		"--quiet",
		`--chrome-flags=${chromeFlags}`,
		...(preset ? [`--preset=${preset}`] : []),
		...(onlyCategories
			? [`--only-categories=${onlyCategories.join(",")}`]
			: []),
	];
	const result = spawnSync(process.execPath, args, { stdio: "inherit" });
	if (result.status !== 0)
		throw new Error(`Lighthouse exited with ${result.status} on ${url}.`);
	const lhr = JSON.parse(readFileSync(`${base}.report.json`, "utf8"));
	if (lhr.runtimeError)
		throw new Error(
			`Lighthouse could not audit ${url}: ${lhr.runtimeError.message}`,
		);
	return lhr;
}

const median = (values) => {
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.floor(sorted.length / 2)];
};

/** The value an assertion is judged on, from one run: a category's score or an audit's. */
function valueOf(lhr, id, option) {
	if (id.startsWith("categories:"))
		return lhr.categories[id.slice("categories:".length)]?.score;
	const audit = lhr.audits[id];
	return option === "maxNumericValue" ? audit?.numericValue : audit?.score;
}

/** The assertions that apply to a URL: lhci's assertMatrix, or one set for every URL. */
function assertionsFor(url) {
	const sets = assert.assertMatrix ?? [{ matchingUrlPattern: ".*", ...assert }];
	const other = sets.find(
		(set) => set.aggregationMethod && set.aggregationMethod !== "median",
	);
	if (other)
		throw new Error(
			`${CONFIG} asks for aggregationMethod "${other.aggregationMethod}"; this runner only takes the median.`,
		);
	return sets.filter((set) => new RegExp(set.matchingUrlPattern).test(url));
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const server = await startServer();
const manifest = [];
const results = [];
try {
	for (const url of collect.url) {
		const slug =
			new URL(url).pathname.replace(/\W+/g, "_").replace(/^_|_$/g, "") ||
			"root";
		const runs = [];
		for (let run = 1; run <= collect.numberOfRuns; run++) {
			const base = join(OUT, `${slug}-${run}`);
			runs.push({ base, lhr: runLighthouse(url, base) });
		}

		// The run the release report shows: the one with the median performance score
		const byPerformance = [...runs].sort(
			(a, b) =>
				(a.lhr.categories.performance?.score ?? 0) -
				(b.lhr.categories.performance?.score ?? 0),
		);
		const representative = byPerformance[Math.floor(byPerformance.length / 2)];
		for (const { base, lhr } of runs) {
			manifest.push({
				url,
				isRepresentativeRun: lhr === representative.lhr,
				htmlPath: resolve(`${base}.report.html`),
				jsonPath: resolve(`${base}.report.json`),
				summary: Object.fromEntries(
					Object.entries(lhr.categories).map(([id, category]) => [
						id,
						category.score,
					]),
				),
			});
		}

		for (const set of assertionsFor(url)) {
			for (const [auditId, [level, options]] of Object.entries(
				set.assertions,
			)) {
				const [option, expected] = Object.entries(options)[0];
				const values = runs.map(({ lhr }) => valueOf(lhr, auditId, option));
				if (values.some((value) => typeof value !== "number")) {
					throw new Error(
						`${url} has no ${option === "maxNumericValue" ? "numericValue" : "score"} for ${auditId}.`,
					);
				}
				const actual = median(values);
				const passed =
					option === "maxNumericValue"
						? actual <= expected
						: actual >= expected;
				results.push({
					url,
					auditId,
					level,
					operator: option === "maxNumericValue" ? "<=" : ">=",
					expected,
					actual,
					values,
					passed,
				});
			}
		}
	}
} finally {
	stopServer(server);
}

writeFileSync(
	join(OUT, "manifest.json"),
	`${JSON.stringify(manifest, null, 2)}\n`,
);
writeFileSync(
	join(OUT, "assertion-results.json"),
	`${JSON.stringify(results, null, 2)}\n`,
);

for (const result of results) {
	const mark = result.passed
		? "pass"
		: result.level === "error"
			? "FAIL"
			: "warn";
	console.log(
		`${mark.padEnd(5)}${new URL(result.url).pathname.padEnd(28)}${result.auditId} ${result.actual} ${result.operator} ${result.expected}`,
	);
}
const failed = results.filter(
	(result) => !result.passed && result.level === "error",
);
console.log(
	failed.length
		? `\n${failed.length} assertion(s) failed.`
		: "\nEvery error-level assertion passed.",
);
process.exit(failed.length ? 1 : 0);
