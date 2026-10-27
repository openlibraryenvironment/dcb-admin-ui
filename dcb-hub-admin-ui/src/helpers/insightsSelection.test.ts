import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { ALL_PANELS, panelsOf, selectPanels } from "@helpers/insightsSelection";
import { INSIGHTS_PAGES, selectPages } from "@helpers/insightsPages";
import { isInsightsPageShown } from "@helpers/featureFlags";
import {
	isInsightsPanelShown,
	isInsightsSectionShown,
} from "@helpers/insightsPanelFlags";
import { resolveSubject, visibleSubjects } from "@helpers/insightsSubjects";

const shown = (raw: string | undefined) => [...selectPanels(raw).shown].sort();

describe("VITE_INSIGHTS_PANELS", () => {
	it("shows everything when unset or blank, which envsubst makes of an unset variable", () => {
		for (const raw of [undefined, "", " , "]) {
			expect(shown(raw)).toEqual([...ALL_PANELS].sort());
		}
	});

	it("shows everything for all", () => {
		expect(shown("all")).toEqual([...ALL_PANELS].sort());
	});

	it("leaves out a section or a panel after all", () => {
		const left = selectPanels("all,-partners,-gaps.rareGems").shown;
		expect(left.has("partners.netFlow")).toBe(false);
		expect(left.has("partners.tradingPartners")).toBe(false);
		expect(left.has("gaps.rareGems")).toBe(false);
		expect(left.has("gaps.unmetLocal")).toBe(true);
		expect(left.size).toBe(ALL_PANELS.length - 3);
	});

	it("shows exactly what a list names, a section standing for its panels", () => {
		expect(shown("overview,service.durations")).toEqual(
			[...panelsOf("overview"), "service.durations"].sort(),
		);
	});

	it("applies names left to right", () => {
		expect(shown("service,-service.failures")).toEqual(
			panelsOf("service")
				.filter((panel) => panel !== "service.failures")
				.sort(),
		);
		expect(shown("-service.failures,all")).toEqual([...ALL_PANELS].sort());
	});

	it("reports a name it does not know, and shows what it does", () => {
		const { shown: left, unknown } = selectPanels(
			"all,-gaps.rareGem, trends.nothing",
		);
		expect(unknown).toEqual(["-gaps.rareGem", "trends.nothing"]);
		expect(left.has("gaps.rareGems")).toBe(true);
	});

	it("names every panel once", () => {
		expect(new Set(ALL_PANELS).size).toBe(ALL_PANELS.length);
	});
});

describe("VITE_INSIGHTS_PAGES", () => {
	it("shows every page when unset, and exactly the pages a list names", () => {
		expect([...selectPages(undefined).shown]).toEqual([...INSIGHTS_PAGES]);
		expect([...selectPages("all,-groups").shown]).toEqual([
			"consortium",
			"libraries",
		]);
		expect([...selectPages("libraries").shown]).toEqual(["libraries"]);
	});
});

describe("what a deployment shows", () => {
	const deploy = (env: Record<string, string>) =>
		vi.stubGlobal("window", {
			__APP_ENV__: { VITE_FEATURE_INSIGHTS: "true", ...env },
		});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("shows no page while the release flag is off, whatever the list says", () => {
		deploy({ VITE_FEATURE_INSIGHTS: "false", VITE_INSIGHTS_PAGES: "all" });
		expect(isInsightsPageShown("consortium")).toBe(false);
	});

	it("hides a page the list leaves out", () => {
		deploy({ VITE_INSIGHTS_PAGES: "all,-groups" });
		expect(isInsightsPageShown("groups")).toBe(false);
		expect(isInsightsPageShown("libraries")).toBe(true);
	});

	it("keeps a panel off while the release it needs is not deployed", () => {
		deploy({ VITE_INSIGHTS_PANELS: "all" });
		expect(isInsightsPanelShown("trends.durationTrend")).toBe(false);
		deploy({
			VITE_INSIGHTS_PANELS: "all",
			VITE_FEATURE_INSIGHTS_TRENDS: "true",
		});
		expect(isInsightsPanelShown("trends.durationTrend")).toBe(true);
	});

	it("hides a subject with no panel shown, and falls back from a link to it", () => {
		deploy({ VITE_INSIGHTS_PANELS: "all,-trends,-gaps" });
		expect(isInsightsSectionShown("trends")).toBe(false);
		expect(visibleSubjects(1)).toEqual([
			"service",
			"demand",
			"partners",
			"collection",
		]);
		expect(resolveSubject("trends", 1)).toBe("service");
		expect(resolveSubject("gaps", 1)).toBe("service");
		expect(resolveSubject("demand", 1)).toBe("demand");
	});

	it("still hides gaps across several libraries when the list shows it", () => {
		deploy({ VITE_INSIGHTS_PANELS: "all" });
		expect(visibleSubjects(2)).not.toContain("gaps");
		expect(visibleSubjects(1)).toContain("gaps");
	});

	it("warns once for a name it does not know, without repeating it on every read", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		deploy({ VITE_INSIGHTS_PANELS: "all,-nope" });
		isInsightsPanelShown("overview.headline");
		isInsightsPanelShown("overview.moreFigures");
		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn.mock.calls[0][0]).not.toContain("nope");
	});
});

describe("docs/deployment.md, 2b", () => {
	const doc = readFileSync(
		path.resolve(process.cwd(), "docs/deployment.md"),
		"utf8",
	).replace(/\r\n/g, "\n");
	// Prettier pads a table's header to its column widths
	const table = (header: RegExp) => {
		const start = doc.search(header);
		expect(start, String(header)).toBeGreaterThan(-1);
		return doc.slice(start, doc.indexOf("\n\n", start));
	};

	it("lists every panel, and none this app lacks", () => {
		const listed = [
			...table(/^\| *Subject *\| *Panels *\|/m).matchAll(
				/`([a-z]+\.[A-Za-z]+)`/g,
			),
		];
		expect(listed.map((match) => match[1]).sort()).toEqual(
			[...ALL_PANELS].sort(),
		);
	});

	it("lists every page, and none this app lacks", () => {
		const listed = [
			...table(/^\| *Page *\| *Name *\|/m).matchAll(/`([a-z]+)`/g),
		];
		expect(listed.map((match) => match[1])).toEqual([...INSIGHTS_PAGES]);
	});
});
