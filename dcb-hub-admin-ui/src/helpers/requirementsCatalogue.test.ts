import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import gates from "../../scripts/gates.json";
import {
	CATEGORIES,
	SECURE_BY_DESIGN,
	catalogue,
} from "../../scripts/release-report";

const entries = Object.entries(catalogue);

/** The release report reports every requirement from its evidence; these keep it able to. */
describe("the requirement catalogue", () => {
	it("has requirements", () => {
		expect(entries.length).toBeGreaterThan(10);
	});

	it("names each requirement by its area and a number, and files it under that area", () => {
		const wrong = entries
			.filter(([id, requirement]) => {
				const area = /^([A-Z]+)-\d{2}$/.exec(id)?.[1] as
					keyof typeof CATEGORIES | undefined;
				return !area || CATEGORIES[area] !== requirement.category;
			})
			.map(([id]) => id);
		expect(wrong).toEqual([]);
	});

	it("gives every requirement a sentence and evidence of some kind", () => {
		const unevidenced = entries
			.filter(
				([, requirement]) =>
					!requirement.requirement.trim() ||
					!(
						requirement.checks?.length ||
						requirement.e2e ||
						requirement.unit?.length ||
						requirement.accessibility ||
						requirement.statement
					),
			)
			.map(([id]) => id);
		expect(unevidenced).toEqual([]);
	});

	it("names only checks the pipeline has", () => {
		const unknown = entries.flatMap(([id, requirement]) =>
			(requirement.checks ?? [])
				.filter((job) => !(job in gates))
				.map((job) => `${id} names ${job}`),
		);
		expect(unknown).toEqual([]);
	});

	it("puts every check the pipeline runs to work for some requirement", () => {
		const claimed = new Set(
			entries.flatMap(([, requirement]) => requirement.checks ?? []),
		);
		expect(Object.keys(gates).filter((job) => !claimed.has(job))).toEqual([]);
	});

	it("names unit tests that exist, by their describe block", () => {
		const missing = entries.flatMap(([id, requirement]) =>
			(requirement.unit ?? [])
				.filter(
					(ref) =>
						!existsSync(ref.file) ||
						!readFileSync(ref.file, "utf8").includes(
							`describe(${JSON.stringify(ref.describe)}`,
						),
				)
				.map((ref) => `${id}: ${ref.file} > ${ref.describe}`),
		);
		expect(missing).toEqual([]);
	});

	it("dates every statement assessed by hand, and not in the future", () => {
		const undated = entries
			.filter(([, requirement]) => {
				const reviewed = requirement.statement?.reviewed;
				if (reviewed === undefined) return false;
				const date = new Date(reviewed);
				return (
					!/^\d{4}-\d{2}-\d{2}$/.test(reviewed) ||
					Number.isNaN(date.getTime()) ||
					date > new Date()
				);
			})
			.map(([id]) => id);
		expect(undated).toEqual([]);
	});

	it("names only Secure by Design principles and EN 301 549 clauses that exist", () => {
		const wrong = entries.flatMap(([id, requirement]) => [
			...(requirement.standards?.sbd ?? [])
				.filter((principle) => !(principle in SECURE_BY_DESIGN))
				.map((principle) => `${id}: principle ${principle}`),
			...(requirement.standards?.en301549 ?? [])
				.filter((clause) => !/^\d+(\.\d+)*$/.test(clause))
				.map((clause) => `${id}: clause ${clause}`),
			...Object.keys(requirement.standards ?? {})
				.filter((standard) => !["sbd", "en301549"].includes(standard))
				.map((standard) => `${id}: ${standard}`),
		]);
		expect(wrong).toEqual([]);
	});
});
