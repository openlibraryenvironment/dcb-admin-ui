import { test } from "./fixtures/test";
import { scanForViolations } from "./fixtures/axe";
import { covers } from "./fixtures/coverage";
import { render } from "../scripts/release-report";

// A report offered as accessibility evidence is held to the standard it reports on
for (const colorScheme of ["light", "dark"] as const) {
	test(
		`the release report has no accessibility violations (${colorScheme})`,
		covers(
			`The release report itself passes every check axe can automate, in ${colorScheme} mode.`,
		),
		async ({ page }) => {
			await page.emulateMedia({ colorScheme });
			await page.setContent(
				render({
					statuses: { verify_quality: "success", verify_e2e: "failed" },
					e2e: [
						{
							file: "accessibility.spec.ts",
							title: "/libraries has no violations",
							tags: ["a11y"],
							covers:
								"Every check axe can automate passes on /libraries, in light mode.",
							page: "/libraries",
							view: "light",
							project: "chromium",
							outcome: "passed",
							axe: [
								{
									id: "color-contrast",
									help: "Contrast",
									outcome: "passed",
									criteria: ["1.4.3"],
								},
							],
						},
						{
							file: "display-preferences.spec.ts",
							title: "text size",
							tags: ["a11y", "wcag-1.4.4"],
							covers: "Choosing a larger text size enlarges the text.",
							outcome: "failed",
							axe: [],
						},
						{
							file: "requesting.spec.ts",
							title: "storage",
							tags: ["req-PRIV-02"],
							covers: "No barcode is kept in browser storage.",
							project: "chromium",
							outcome: "flaky",
							axe: [],
							storage: { local: ["oidc.user:x"], session: [], cookies: [] },
						},
					],
					junit: { unit: { tests: 10, passed: 10, failed: 0, skipped: 0 } },
					budget: {
						firstLoad: { size: 338_014, budget: 344_800 },
						routes: [],
						onDemand: [{ name: "DataGrid.js", size: 215_157, budget: 218_100 }],
					},
					lighthouse: {
						pages: [
							{
								page: "/login",
								scores: { performance: 71, accessibility: 100 },
							},
						],
						failures: [],
					},
					vpat: new Map([["3.3.8", "Supports"]]),
					version: "v2.2.0",
					compatibility: {
						schemas: ["8.71.0", "9.2.0"],
						features: [
							{
								id: "insights",
								name: "Insights",
								flag: "VITE_FEATURE_INSIGHTS",
								since: "9.0.0",
							},
						],
						deploymentFlags: ["VITE_FEATURE_EXAMPLE"],
					},
					changes: {
						since: "v2.1.0",
						notes: {
							features: ["a page of evidence"],
							fixes: ["a broken link"],
							breaking: [],
							other: 3,
						},
					},
					previous: {
						figures: [{ label: "Unit tests", value: 9 }],
						pipeline: { tag: "v2.1.0" },
					},
					vpatFacts: {
						version: "v2.2.0",
						updated: "2026-10-23",
						manual: { version: "v1.58.0", date: "2026-03-01" },
						gaps: [
							{
								id: "2.2.6",
								name: "Timeouts",
								conformance: "Partially supports",
								remarks: "A warning appears one minute before.",
							},
						],
					},
					security: {
						headers: [{ name: "X-Content-Type-Options", value: "nosniff" }],
						npm: { critical: 0, high: 0, moderate: 1, low: 0, info: 0 },
						secrets: 0,
						licences: {
							packages: 3,
							byLicence: { MIT: 2, "SEE LICENSE IN LICENSE": 1 },
							commercial: ["@mui/x-license"],
							unvetted: [],
						},
						product: { title: "Functional Source License, Version 1.1" },
					},
					image: {
						base: { image: "nginx:1.30.6-alpine3.24", pinned: true },
						digest: "nginx@sha256:abc",
						tags: ["main-abc1234", "next"],
					},
					languages: [
						{
							code: "en-GB",
							name: "English (United Kingdom)",
							kind: "source",
							strings: 10,
							translated: 10,
							obsolete: 0,
						},
						{
							code: "es",
							name: "Spanish",
							kind: "translation",
							strings: 4,
							translated: 4,
							obsolete: 1,
						},
					],
					nightly: [{ file: "a.spec.ts", name: "t", outcome: "failed" }],
					pipeline: {
						ref: "release",
						commit: "abc1234",
						when: new Date("2026-10-23T12:00:00Z"),
					},
				}),
			);
			await scanForViolations(page);
		},
	);
}
