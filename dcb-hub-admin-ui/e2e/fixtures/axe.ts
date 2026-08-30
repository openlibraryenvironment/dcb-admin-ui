import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * One axe scan, used by every accessibility gate — W-1.
 *
 * WCAG 2.2 AA is the floor, so the tag list is the full A + AA ladder and the assertion is
 * ZERO violations. Failures are reported as rule id, impact and the node it was found on,
 * because "3 violations" is not something anybody can act on.
 */
export const WCAG_TAGS = [
	"wcag2a",
	"wcag2aa",
	"wcag21a",
	"wcag21aa",
	"wcag22aa",
];

/**
 * The MUI X watermark, which is a property of the TEST environment and not of the
 * application.
 *
 * `.env.e2e` sets `VITE_MUI_X_LICENSE_KEY=` empty - a licence key is not something that
 * can be committed - so every DataGrid renders a grey "MUI X Missing license key" overlay
 * at 62% alpha over the rows. Axe measures it, correctly, as failing contrast.
 *
 * It is excluded rather than tolerated: the node is tagged and handed to `AxeBuilder.
 * exclude`, so the exclusion is visible in this file and applies to nothing else on the
 * page. A blanket allowance for `color-contrast`, or for `.MuiDataGrid-main`, would have
 * hidden a real contrast defect in the grid the moment one appeared.
 *
 * Returns how many it tagged, so a caller can assert the exclusion did not silently start
 * matching more than it should.
 */
async function tagLicenceWatermarks(page: Page): Promise<number> {
	return page.evaluate(() => {
		const nodes = Array.from(document.querySelectorAll("div")).filter(
			(node) =>
				node.children.length === 0 &&
				node.textContent?.trim() === "MUI X Missing license key",
		);
		nodes.forEach((node) =>
			node.setAttribute("data-e2e-licence-watermark", "true"),
		);
		return nodes.length;
	});
}

export async function scanForViolations(page: Page) {
	await tagLicenceWatermarks(page);

	const results = await new AxeBuilder({ page })
		.withTags(WCAG_TAGS)
		.exclude("[data-e2e-licence-watermark]")
		.analyze();

	expect(
		results.violations.map((violation) => ({
			id: violation.id,
			impact: violation.impact,
			nodes: violation.nodes.map((node) => node.target.join(" ")),
		})),
	).toEqual([]);
}

/**
 * Proves the emulated colour scheme actually reached the application.
 *
 * `useThemeStore` seeds its mode from `prefers-color-scheme`. If that never arrived, a
 * "passing" dark run is just a second light run - a gate that measures the wrong thing and
 * reports success. Reads the painted background rather than the media query, because the
 * media query matching says nothing about whether the theme followed it.
 */
export async function expectPaintedScheme(
	page: Page,
	scheme: "light" | "dark",
) {
	const luminance = await page.evaluate(() => {
		const [r, g, b] = getComputedStyle(document.body)
			.backgroundColor.match(/\d+/g)!
			.map(Number);
		return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
	});

	if (scheme === "dark") expect(luminance).toBeLessThan(0.5);
	else expect(luminance).toBeGreaterThan(0.5);
}
