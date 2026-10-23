// Every gate in this repository, in one run - `npm run gates`.
//
// The gates are listed in docs/testing.md and were previously nine separate commands,
// which is nine chances to forget one. This runs them all, keeps going after a failure so
// one run tells you everything, and prints a table at the end.
//
// THREE THINGS THIS HAS TO GET RIGHT, all of them failures the repository has already
// recorded:
//
// 1. SEQUENTIAL, not parallel. Each Playwright config's webServer BUILDS, and all four
//    builds write the same `dist/`. Two suites at once means one's build replaces the
//    directory the other is serving. They also each drive four Chromiums, and
//    `workers: 4` is calibrated for one preview on this estate - at sixteen the axe suite
//    raced itself, 21 failed against 0.
//
// 2. PORTS FREE FIRST. `reuseExistingServer` is on whenever CI is not set, so a preview
//    left running by an earlier session is not replaced - it is USED, and every result
//    after that is a measurement of a frozen `dist/`. Checked by binding, below.
//
// 3. EXIT CODES, never output. Playwright's reporter writes ANSI escapes and a
//    `grep -c failed` over it has already reported a 25-failure suite as green.
//
// Flags: --skip=lighthouse,base-path   --only=types,lint,unit   --bail
import { spawnSync } from "node:child_process";
import { createServer } from "node:net";

// Lighthouse is slowest and its CPU-bound metrics are worthless under load, so it is the
// last gate and the first one to skip. Order otherwise: everything that needs no build,
// cheapest first, then the four that each build their own dist.
const GATES = [
	{
		id: "types",
		label: "Types",
		cmd: "npx tsc --noEmit",
	},
	{
		id: "lint",
		label: "Lint (zero tolerance)",
		// ESLint exits 0 on warnings otherwise, and a warning nobody is forced to read
		// is a defect with a longer half-life.
		cmd: "npm run lint -- --max-warnings=0",
	},
	{
		id: "unit",
		label: "Unit tests",
		// NOT `npm run test` - that script is bare `vitest`, i.e. watch mode, which
		// never finishes.
		cmd: "npx vitest run",
	},
	{
		id: "supply-chain",
		label: "Production dependencies",
		// Production and high-or-above only, matching verify_supply_chain. The full
		// audit over dev dependencies is dominated by build tooling that never reaches
		// a browser.
		cmd: "npm audit --omit=dev --audit-level=high",
	},
	{
		id: "budget",
		label: "Bundle budget",
		// Its own build, because the budget's chunk names were measured on a
		// VITE_PUBLIC_URL=/ build and the Playwright suites below leave a different
		// base in dist/. Env via `env:` and NOT a `VITE_PUBLIC_URL=/ npm run build`
		// prefix: POSIX inline assignment is a parse error under cmd.exe, so that form
		// only ever ran on Linux.
		cmd: "npm run build",
		env: { VITE_PUBLIC_URL: "/", BUNDLE_BUDGET: "1" },
		then: { label: "Bundle budget", cmd: "npm run budget" },
	},
	{
		id: "e2e",
		label: "E2E + axe + i18n (4173)",
		cmd: "npx playwright test",
		port: 4173,
	},
	{
		id: "base-path",
		label: "Base path /dcb-admin (4203)",
		// The configuration this application actually ships, and the one the main suite
		// does not run - that one pins the base to "/".
		cmd: "npm run e2e:base-path",
		port: 4203,
	},
	{
		id: "bootloader",
		label: "KI bootloader (4183)",
		cmd: "npm run e2e:ki-bootstrap",
		port: 4183,
	},
	{
		id: "container",
		label: "Container: CSP, compression, headers (4213)",
		// The artefact that actually ships. Builds the image, so it is the slowest gate
		// after Lighthouse and the one most worth skipping on a quick local pass.
		cmd: "npm run e2e:container",
		// No `port`: this gate never reuses a running server and removes its own
		// container by name before starting, so a leftover on 4213 is self-healing
		// rather than something the operator has to clear.
	},
	{
		id: "lighthouse",
		label: "Lighthouse payload budget (4193)",
		// total-byte-weight and CLS are deterministic; TBT and LCP are measured on the
		// real CPU and mean nothing on a busy machine. Run this one on an idle box.
		cmd: "npm run lighthouse",
		port: 4193,
	},
];

const args = process.argv.slice(2);
const flag = (name) =>
	args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? "";
const skip = new Set(flag("skip").split(",").filter(Boolean));
const only = new Set(flag("only").split(",").filter(Boolean));
const bail = args.includes("--bail");

const selected = GATES.filter(
	(g) => (only.size === 0 || only.has(g.id)) && !skip.has(g.id),
);

const unknown = [...only, ...skip].filter(
	(id) => !GATES.some((g) => g.id === id),
);
if (unknown.length) {
	console.error(
		`Unknown gate id(s): ${unknown.join(", ")}\nKnown: ${GATES.map((g) => g.id).join(", ")}`,
	);
	process.exit(2);
}

/**
 * Is anything listening on this port?
 *
 * By binding rather than by netstat or lsof: those differ per platform and this has to
 * run on Windows and on the Linux runner. A port that cannot be bound is a port a
 * preview still holds, and `reuseExistingServer` would serve whatever that preview was
 * built from.
 */
function portIsFree(port) {
	return new Promise((resolve) => {
		const probe = createServer();
		probe.once("error", () => resolve(false));
		probe.once("listening", () => probe.close(() => resolve(true)));
		probe.listen(port, "127.0.0.1");
	});
}

const taken = [];
for (const gate of selected.filter((g) => g.port)) {
	if (!(await portIsFree(gate.port))) taken.push(`${gate.port} (${gate.id})`);
}
if (taken.length) {
	console.error(
		[
			`Port(s) still held: ${taken.join(", ")}`,
			"",
			"A preview left running by an earlier run would be REUSED, not replaced, and",
			"every result after that measures its frozen dist/ rather than your tree.",
			"Stop it and run again.",
		].join("\n"),
	);
	process.exit(2);
}

const run = (cmd, env) => {
	const started = Date.now();
	// stdio inherited: the point of one command is one place to read, and a gate's own
	// reporter is better than anything this could summarise. HUSKY is irrelevant here
	// (nothing commits), so the environment is passed through untouched but for `env`.
	const result = spawnSync(cmd, {
		shell: true,
		stdio: "inherit",
		env: { ...process.env, ...env },
	});
	// A signal (Ctrl-C, OOM) leaves status null; treat that as failure rather than as 0.
	const code = result.status ?? (result.signal ? 1 : 1);
	return { code, seconds: Math.round((Date.now() - started) / 1000) };
};

const results = [];
let failed = false;

for (const gate of selected) {
	console.log(`\n\u2500\u2500 ${gate.label} \u2500\u2500 ${gate.cmd}\n`);
	let { code, seconds } = run(gate.cmd, gate.env);

	// A two-step gate (build, then assert over what it built) is one result: a build
	// that fails has not told you anything about the budget.
	if (code === 0 && gate.then) {
		console.log(`\n\u2500\u2500 ${gate.then.label} \u2500\u2500 ${gate.then.cmd}\n`);
		const second = run(gate.then.cmd, gate.env);
		code = second.code;
		seconds += second.seconds;
	}

	results.push({ label: gate.label, id: gate.id, code, seconds });
	if (code !== 0) {
		failed = true;
		if (bail) break;
	}
}

const width = Math.max(...results.map((r) => r.label.length));
console.log(`\n${"=".repeat(width + 20)}`);
for (const r of results) {
	const mark = r.code === 0 ? "PASS" : `FAIL (${r.code})`;
	console.log(
		`${r.label.padEnd(width)}  ${mark.padEnd(10)} ${String(r.seconds).padStart(4)}s`,
	);
}
const notRun = selected.length - results.length;
if (notRun > 0) console.log(`\n${notRun} gate(s) not run (--bail).`);
console.log("=".repeat(width + 20));

process.exit(failed ? 1 : 0);
