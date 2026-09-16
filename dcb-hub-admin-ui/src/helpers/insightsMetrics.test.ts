import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";

import { METRIC_IDS, methodKeys } from "./insightsMetrics";
import en from "../locales/en-GB/application.json";

/**
 * The methodology gate.
 *
 * A definition that is optional gets written for the first six metrics and abandoned, and
 * a half-populated registry is worse than none: a reader who finds an explanation beside
 * two figures and none beside the third concludes the third is not explicable.
 *
 * So: every metric the interface claims to explain must be in the registry with all three
 * parts translated, and the panels that carry no explanation yet are counted here rather
 * than left to be noticed.
 */

const INSIGHTS = resolve(__dirname, "../components/Insights");

const panels = readdirSync(INSIGHTS)
	.filter((file) => file.endsWith(".tsx"))
	.map((file) => ({
		name: file.replace(/\.tsx$/, ""),
		source: readFileSync(join(INSIGHTS, file), "utf8"),
	}));

/** Every `metric="..."` handed to MetricInfo, wherever it appears. */
const usedMetrics = [
	...new Set(
		panels.flatMap(({ source }) =>
			[...source.matchAll(/metric="([a-z_]+)"/g)].map((match) => match[1]),
		),
	),
];

/**
 * Components that render no figure of their own - a shell, a tile, a layout - so they are
 * not expected to explain one.
 */
const NOT_FIGURES = new Set([
	"CollectionAnalysisSection",
	"CollectionPanel",
	"KpiTile",
	"LazyPanel",
	"MetricInfo",
	"PanelState",
	"InsightsDashboard",
	"ScopeSelector",
	"SubjectBar",
	"DrillLink",
	"ChartExportToolbar",
	"ExportContext",
	"PanelExport",
	"ReturnToInsights",
]);

describe("the metric registry", () => {
	it("finds the panels it is meant to be checking", () => {
		// Guards the gate: a moved directory would make every assertion below pass over
		// an empty list.
		expect(panels.length).toBeGreaterThanOrEqual(20);
		expect(usedMetrics.length).toBeGreaterThan(0);
	});

	it("knows every metric the interface claims to explain", () => {
		const unknown = usedMetrics.filter(
			(metric) => !(METRIC_IDS as readonly string[]).includes(metric),
		);

		expect(unknown, `not in METRIC_IDS: ${unknown.join(", ")}`).toEqual([]);
	});

	it("carries all three parts, in English, for every registered metric", () => {
		const catalogue = en as unknown as Record<string, any>;
		const missing: string[] = [];

		for (const metric of METRIC_IDS) {
			for (const key of Object.values(methodKeys(metric))) {
				const value = key
					.split(".")
					.reduce<any>((node, part) => node?.[part], catalogue);

				if (typeof value !== "string" || value.trim() === "") {
					missing.push(key);
				}
			}
		}

		expect(missing, `untranslated: ${missing.join(", ")}`).toEqual([]);
	});

	it("counts the panels that still explain nothing", () => {
		const undocumented = panels
			.filter(({ name }) => !NOT_FIGURES.has(name))
			.filter(({ source }) => !source.includes("MetricInfo"))
			.map(({ name }) => name);

		// A number, not an intention. Ten panels render a figure with no statement of
		// where it came from - nine of them collection analysis, whose queries aggregate
		// bib_record rather than patron_request and have not been read against the SQL.
		// Inventing a methodology would be worse than admitting the gap: it is the text a
		// library will quote back when it disputes a figure.
		//
		// THIS BOUND ONLY EVER GOES DOWN. Raising it to make a change pass is how the gap
		// becomes permanent.
		expect(
			undocumented.length,
			`no MetricInfo yet: ${undocumented.join(", ")}`,
		).toBeLessThanOrEqual(10);
	});
});
