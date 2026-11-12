import { describe, expect, it } from "vitest";

// WCAG 1.1.1 for every chart: each file that renders an MUI X chart renders it inside
// ChartFigure, which names it and offers its numbers as a table. Read as source, because a
// chart that was never mounted by a test is exactly the one that would be missed.

const sources = import.meta.glob<string>("../../**/*.tsx", {
	query: "?raw",
	import: "default",
	eager: true,
});

/** Decorative by design, each with the text that carries its message instead. */
const EXEMPT: Record<string, string> = {
	"../Insights/TrendStrip.tsx":
		"inert, aria-hidden sparklines: each tile states its latest figure and its direction in text",
};

const IMPORT =
	/import\s*\{([^}]*)\}\s*from\s*"@mui\/x-charts(?:-pro|-premium)?(?:\/[^"]*)?"/g;

const chartsRenderedBy = (source: string): string[] =>
	[...source.matchAll(IMPORT)]
		.flatMap((match) => match[1].split(","))
		.map(
			(name) =>
				name
					.trim()
					.split(/\s+as\s+/)
					.pop() ?? "",
		)
		.filter((name) => /(Chart|Heatmap|Gauge)(Pro|Premium)?$/.test(name))
		.filter((name) => source.includes(`<${name}`));

const chartFiles = Object.entries(sources).filter(
	([path, source]) =>
		!path.includes("/ChartFigure/") && chartsRenderedBy(source).length > 0,
);

describe("charts", () => {
	it("are found, so the check below is not vacuous", () => {
		expect(chartFiles.length).toBeGreaterThanOrEqual(13);
	});

	it.each(chartFiles.filter(([path]) => !(path in EXEMPT)))(
		"%s renders its chart inside ChartFigure",
		(_path, source) => {
			expect(source).toContain("<ChartFigure");
		},
	);

	it("exempts only files that still render a chart", () => {
		const charted = new Set(chartFiles.map(([path]) => path));
		expect(Object.keys(EXEMPT).filter((path) => !charted.has(path))).toEqual(
			[],
		);
	});
});
