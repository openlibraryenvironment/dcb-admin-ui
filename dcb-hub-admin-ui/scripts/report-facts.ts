// What the release report reads from the repository and the pipeline's own outputs, beyond the
// checks: each one a pure function over text, so each is tested on its own in
// src/helpers/reportFacts.test.ts. docs/testing.md, "The release report".

// ── Compatibility: which dcb-service each feature needs, and which flag turns it on

export interface Feature {
	id: string;
	flag: string;
	/** The lowest dcb-service that serves it, or null when no release does yet */
	since: string | null;
}

/**
 * The capability rows of src/constants/serviceCapabilities.ts, read from its source: that
 * module imports the app through path aliases plain Node cannot resolve.
 * reportFacts.test.ts holds this to the real registry, so the two cannot drift.
 */
export function capabilitiesFrom(source: string): Feature[] {
	return [
		...source.matchAll(
			/\bid: "([a-z_]+)",\s*flag: "([A-Z_]+)",[\s\S]*?\bsince: (?:null|"([\d.]+)")/g,
		),
	].map(([, id, flag, since]) => ({ id, flag, since: since ?? null }));
}

/** Flags that are not dcb-service capabilities: DEPLOYMENT_FLAGS in the same module. */
export function deploymentFlagsFrom(source: string): string[] {
	const list = /DEPLOYMENT_FLAGS = \[([^\]]*)\]/.exec(source)?.[1] ?? "";
	return [...list.matchAll(/"([A-Z_]+)"/g)].map(([, flag]) => flag);
}

const versionParts = (version: string) =>
	version.replace(/^v/, "").split(".").map(Number);

export function compareVersions(a: string, b: string): number {
	const [x, y] = [versionParts(a), versionParts(b)];
	for (let i = 0; i < Math.max(x.length, y.length); i++) {
		const difference = (x[i] ?? 0) - (y[i] ?? 0);
		if (difference !== 0) return difference;
	}
	return 0;
}

/** The dcb-service releases whose schemas are committed and checked: schema.v9.2.0.graphqls. */
export function schemaVersions(files: string[]): string[] {
	return files
		.map((file) => /^schema\.v([\d.]+)\.graphqls$/.exec(file)?.[1])
		.filter((version): version is string => version !== undefined)
		.sort(compareVersions);
}

// ── What changed since the last release

export interface ReleaseNotes {
	features: string[];
	fixes: string[];
	breaking: string[];
	/** Commits that change neither: tests, CI, docs, chores */
	other: number;
}

/** Conventional commit subjects, grouped the way semantic-release writes the notes. */
export function releaseNotes(subjects: string[]): ReleaseNotes {
	const notes: ReleaseNotes = {
		features: [],
		fixes: [],
		breaking: [],
		other: 0,
	};
	for (const subject of subjects) {
		const parsed = /^(\w+)(?:\([^)]*\))?(!)?: (.+)$/.exec(subject.trim());
		if (!parsed) {
			notes.other++;
			continue;
		}
		const [, type, bang, description] = parsed;
		if (bang) notes.breaking.push(description);
		if (type === "feat") notes.features.push(description);
		else if (type === "fix" || type === "perf") notes.fixes.push(description);
		else if (!bang) notes.other++;
	}
	return notes;
}

/** The newest release tag that is not this commit, so a run on a tag compares with the one before. */
export function previousTag(
	tags: { name: string; commit: string }[],
	head: string,
): string | undefined {
	return tags
		.filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag.name) && tag.commit !== head)
		.sort((a, b) => compareVersions(b.name, a.name))[0]?.name;
}

// ── The VPAT: its currency and the gaps it states

export interface VpatFacts {
	/** "v2.2.0" */
	version?: string;
	/** ISO date the report was last updated */
	updated?: string;
	/** When the manual evaluation was last carried out, and for which version */
	manual?: { version: string; date: string };
	/** Criteria the VPAT rates Partially supports or Does not support */
	gaps: { id: string; name: string; conformance: string; remarks: string }[];
}

const MONTHS = [
	"january",
	"february",
	"march",
	"april",
	"may",
	"june",
	"july",
	"august",
	"september",
	"october",
	"november",
	"december",
];

export function vpatFacts(markdown: string): VpatFacts {
	const version = /^DCB Admin \/ (v\d+\.\d+\.\d+)\s*$/m.exec(markdown)?.[1];
	const updated = /last updated on (\d{2})\/(\d{2})\/(\d{2})\b/.exec(markdown);
	const manual =
		/last carried out for (v\d+\.\d+\.\d+), in ([A-Za-z]+) (\d{4})/.exec(
			markdown,
		);
	const month = manual ? MONTHS.indexOf(manual[2].toLowerCase()) + 1 : 0;
	const gaps = markdown.split("\n").flatMap((line) => {
		const cells = line.split("|").map((cell) => cell.trim());
		const criterion = /^(?:\[\*\*|\*\*\[)(\d+\.\d+\.\d+) ([^*\]]+)/.exec(
			cells[1] ?? "",
		);
		const conformance = cells[2] ?? "";
		if (
			!criterion ||
			!/^(partially supports|does not support)$/i.test(conformance)
		)
			return [];
		return [
			{
				id: criterion[1],
				name: criterion[2].trim(),
				conformance,
				remarks: cells[cells.length - 2] ?? "",
			},
		];
	});
	return {
		version,
		updated: updated
			? `20${updated[3]}-${updated[2]}-${updated[1]}`
			: undefined,
		manual:
			manual && month
				? {
						version: manual[1],
						date: `${manual[3]}-${String(month).padStart(2, "0")}-01`,
					}
				: undefined,
		gaps,
	};
}

/** Whole months from one ISO date to another, counting only completed months. */
export function monthsBetween(from: string, to: Date): number {
	const start = new Date(`${from}T00:00:00Z`);
	let months =
		(to.getUTCFullYear() - start.getUTCFullYear()) * 12 +
		to.getUTCMonth() -
		start.getUTCMonth();
	if (to.getUTCDate() < start.getUTCDate()) months--;
	return months;
}

// ── Security: the headers the image sends, advisories, the secret scan, licences

/** Each `add_header` in docker/production/security-headers.conf, in order. */
export function securityHeaders(
	conf: string,
): { name: string; value: string }[] {
	return [...conf.matchAll(/^\s*add_header\s+([A-Za-z-]+)\s+"([^"]*)"/gm)].map(
		([, name, value]) => ({ name, value }),
	);
}

export type Severity = "critical" | "high" | "moderate" | "low" | "info";
export const SEVERITIES: Severity[] = [
	"critical",
	"high",
	"moderate",
	"low",
	"info",
];

/** The counts in `npm audit --json`, which reports each vulnerable package once. */
export function npmAdvisories(audit: {
	metadata?: { vulnerabilities?: Partial<Record<Severity, number>> };
}): Record<Severity, number> {
	const counts = audit.metadata?.vulnerabilities ?? {};
	return Object.fromEntries(
		SEVERITIES.map((severity) => [severity, counts[severity] ?? 0]),
	) as Record<Severity, number>;
}

/** Findings in gitleaks' SARIF; a baselined finding is not reported, so this counts new ones. */
export function secretFindings(sarif: {
	runs?: { results?: unknown[] }[];
}): number {
	return (sarif.runs ?? []).reduce(
		(sum, run) => sum + (run.results?.length ?? 0),
		0,
	);
}

export interface Licences {
	packages: number;
	byLicence: Record<string, number>;
	commercial: string[];
	unvetted: { name: string; licence: string }[];
}

/** The product's own licence: the title of LICENSE, and what package.json declares. */
export function productLicence(
	licenceFile: string,
	packageJson: { license?: string },
) {
	const title = licenceFile
		.split("\n")
		.find((line) => line.trim())
		?.replace(/^#+\s*/, "")
		.trim();
	return { title: title ?? "No LICENSE file", declared: packageJson.license };
}

// ── The image

/** The runtime stage's base, and whether it names one exact release. */
export function runtimeBase(
	dockerfile: string,
): { image: string; pinned: boolean } | undefined {
	const image = [...dockerfile.matchAll(/^FROM\s+(\S+)/gm)].at(-1)?.[1];
	if (!image) return undefined;
	const tag = image.split(":")[1] ?? "";
	return {
		image,
		pinned:
			/^\d+\.\d+\.\d+(?:-[a-z0-9.]+)?$/.test(tag) || image.includes("@sha256:"),
	};
}

/** The tags this pipeline publishes, which depend only on where it runs. */
export function publishedTags(env: {
	branch?: string;
	shortSha?: string;
	onDemand: boolean;
}): string[] {
	if (env.onDemand) return [];
	if (env.branch === "main" && env.shortSha)
		return [`main-${env.shortSha}`, "next"];
	if (env.branch === "release") return ["the new version's number", "latest"];
	return [];
}

// ── Languages

export interface Language {
	code: string;
	name: string;
	/** en-GB is the source; an overlay replaces only what differs; a translation stands alone */
	kind: "source" | "overlay" | "translation";
	strings: number;
	/** Strings of the source this one carries; an overlay falls back to the source for the rest */
	translated: number;
	/** Strings the source no longer has */
	obsolete: number;
}

const flatKeys = (tree: unknown, prefix = ""): string[] =>
	typeof tree === "object" && tree !== null
		? Object.entries(tree).flatMap(([key, value]) =>
				typeof value === "string"
					? [`${prefix}${key}`]
					: flatKeys(value, `${prefix}${key}.`),
			)
		: [];

export function language(
	code: string,
	name: string,
	kind: Language["kind"],
	strings: unknown,
	source: unknown,
): Language {
	const keys = flatKeys(strings);
	const sourceKeys = new Set(flatKeys(source));
	return {
		code,
		name,
		kind,
		strings: keys.length,
		translated: keys.filter((key) => sourceKeys.has(key)).length,
		obsolete: keys.filter((key) => !sourceKeys.has(key)).length,
	};
}

/** LANGUAGE_CHOICES in src/helpers/locale.ts, without "deployment", which is not a language. */
export function offeredLanguages(source: string): string[] {
	const list = /LANGUAGE_CHOICES = \[([^\]]*)\]/.exec(source)?.[1] ?? "";
	return [...list.matchAll(/"([^"]+)"/g)]
		.map(([, code]) => code)
		.filter((code) => code !== "deployment");
}

/** The names the language switcher's endonyms stand for, in English */
export const LANGUAGE_NAMES: Record<string, string> = {
	"en-GB": "English (United Kingdom)",
	"en-US": "English (United States)",
	es: "Spanish",
};

// ── Browsers

/** What each Playwright project in playwright.config.ts runs in. */
export const PROJECT_BROWSERS: Record<string, string> = {
	chromium: "Chrome on a desktop",
	narrow: "Chrome at 320 CSS pixels wide, the width of a small phone",
};
