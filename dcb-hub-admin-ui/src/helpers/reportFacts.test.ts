import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
	DEPLOYMENT_FLAGS,
	SERVICE_CAPABILITIES,
} from "@constants/serviceCapabilities";
import { LANGUAGE_CHOICES } from "@helpers/locale";
import {
	capabilitiesFrom,
	compareVersions,
	deploymentFlagsFrom,
	language,
	monthsBetween,
	npmAdvisories,
	offeredLanguages,
	previousTag,
	productLicence,
	publishedTags,
	releaseNotes,
	runtimeBase,
	schemaVersions,
	secretFindings,
	securityHeaders,
	vpatFacts,
} from "../../scripts/report-facts.ts";

const read = (path: string) => readFileSync(path, "utf8");

describe("the compatibility the report reads from the source", () => {
	const source = read("src/constants/serviceCapabilities.ts");

	it("reads every capability, with the flag and release the registry gives it", () => {
		expect(capabilitiesFrom(source)).toEqual(
			SERVICE_CAPABILITIES.map(({ id, flag, since }) => ({ id, flag, since })),
		);
	});

	it("reads the flags that do not depend on a dcb-service release", () => {
		expect(deploymentFlagsFrom(source)).toEqual([...DEPLOYMENT_FLAGS]);
	});

	it("lists the committed release schemas, oldest first", () => {
		const versions = schemaVersions(readdirSync("."));
		expect(versions[0]).toBe("8.71.0");
		expect([...versions].sort(compareVersions)).toEqual(versions);
	});

	it("compares versions as numbers, not text", () => {
		expect(compareVersions("9.10.0", "9.2.0")).toBeGreaterThan(0);
		expect(compareVersions("v2.2.0", "2.2.0")).toBe(0);
	});
});

describe("what changed", () => {
	it("groups conventional commits the way the release notes do", () => {
		expect(
			releaseNotes([
				"feat(report): a page of evidence",
				"fix: a broken link",
				"perf(routes): a smaller first load",
				"feat!: a new sign-in",
				"test(e2e): a new spec",
				"Merge branch 'x'",
			]),
		).toEqual({
			features: ["a page of evidence", "a new sign-in"],
			fixes: ["a broken link", "a smaller first load"],
			breaking: ["a new sign-in"],
			other: 2,
		});
	});

	it("compares with the newest release before this commit, so a run on a tag looks back", () => {
		const tags = [
			{ name: "v2.1.0", commit: "b" },
			{ name: "v2.2.0", commit: "head" },
			{ name: "v2.0.0", commit: "a" },
			{ name: "not-a-release", commit: "c" },
		];
		expect(previousTag(tags, "head")).toBe("v2.1.0");
		expect(previousTag(tags, "newer")).toBe("v2.2.0");
	});
});

describe("the VPAT's currency and gaps", () => {
	const facts = vpatFacts(read("docs/DCB_Admin_VPAT.md"));

	it("reads its version, its date and its manual evaluation", () => {
		expect(facts.version).toMatch(/^v\d+\.\d+\.\d+$/);
		expect(facts.updated).toMatch(/^20\d\d-\d\d-\d\d$/);
		expect(facts.manual).toEqual({ version: "v1.58.0", date: "2026-03-01" });
	});

	it("lists every criterion it rates below full support", () => {
		expect(facts.gaps.length).toBeGreaterThan(5);
		expect(
			facts.gaps.every((gap) => /partially|does not/i.test(gap.conformance)),
		).toBe(true);
		expect(facts.gaps.find((gap) => gap.id === "2.2.5")?.remarks).toContain(
			"idle timeout",
		);
	});

	it("counts whole months only", () => {
		expect(monthsBetween("2026-03-01", new Date("2026-09-01T00:00:00Z"))).toBe(
			6,
		);
		expect(monthsBetween("2026-03-15", new Date("2026-09-14T00:00:00Z"))).toBe(
			5,
		);
	});
});

describe("security facts", () => {
	it("reads every header the image adds", () => {
		const headers = securityHeaders(
			read("docker/production/security-headers.conf"),
		);
		expect(headers.map((header) => header.name)).toContain(
			"Content-Security-Policy",
		);
		expect(
			headers.find((header) => header.name === "X-Content-Type-Options")?.value,
		).toBe("nosniff");
	});

	it("reads npm's counts, and gitleaks' new findings", () => {
		expect(
			npmAdvisories({ metadata: { vulnerabilities: { high: 2, low: 1 } } }),
		).toEqual({
			critical: 0,
			high: 2,
			moderate: 0,
			low: 1,
			info: 0,
		});
		expect(
			secretFindings({ runs: [{ results: [{}, {}] }, { results: [] }] }),
		).toBe(2);
		expect(secretFindings({})).toBe(0);
	});

	it("reads the product's licence, and says when package.json declares none", () => {
		expect(
			productLicence("# Functional Source License, Version 1.1\n\nterms", {}),
		).toEqual({
			title: "Functional Source License, Version 1.1",
			declared: undefined,
		});
	});

	it("tells an exact base image from one whose tag moves", () => {
		const dockerfile = (base: string) =>
			`FROM node:22-alpine AS deps\nFROM ${base} AS runner\n`;
		expect(runtimeBase(dockerfile("nginx:1.30.6-alpine3.24"))).toEqual({
			image: "nginx:1.30.6-alpine3.24",
			pinned: true,
		});
		expect(runtimeBase(dockerfile("nginx:stable-alpine"))?.pinned).toBe(false);
		expect(runtimeBase(dockerfile("nginx@sha256:abc"))?.pinned).toBe(true);
	});

	it("names the tags a pipeline publishes, and none on demand", () => {
		expect(
			publishedTags({ branch: "main", shortSha: "abc1234", onDemand: false }),
		).toEqual(["main-abc1234", "next"]);
		expect(
			publishedTags({ branch: "main", shortSha: "abc1234", onDemand: true }),
		).toEqual([]);
		expect(publishedTags({ branch: "feature", onDemand: false })).toEqual([]);
	});
});

describe("languages", () => {
	it("offers what the language switcher offers", () => {
		expect(offeredLanguages(read("src/helpers/locale.ts"))).toEqual(
			LANGUAGE_CHOICES.filter((choice) => choice !== "deployment"),
		);
	});

	it("counts what a translation carries of the source, and what the source no longer has", () => {
		const source = { a: "A", group: { b: "B", c: "C" } };
		expect(
			language(
				"es",
				"Spanish",
				"translation",
				{ a: "Á", group: { b: "Ƀ" }, gone: "x" },
				source,
			),
		).toEqual({
			code: "es",
			name: "Spanish",
			kind: "translation",
			strings: 3,
			translated: 2,
			obsolete: 1,
		});
	});
});
