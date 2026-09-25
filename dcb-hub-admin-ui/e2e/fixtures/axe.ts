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

/**
 * The document must not scroll sideways — WCAG 2.2 1.4.10 Reflow.
 *
 * axe cannot see this. Reflow is a layout property, not a DOM one, and no automated rule
 * in the ruleset reports it; it is the failure the `narrow` project in playwright.config
 * exists to catch, and this is what actually catches it.
 *
 * The DOCUMENT, not its contents. A data grid or a wide code block scrolling inside its own
 * `overflow-x: auto` container is correct and expected — the criterion is about the page,
 * and a container that scrolls itself does not widen the document.
 *
 * One pixel of tolerance: sub-pixel layout rounding puts scrollWidth a fraction over
 * clientWidth on pages that are visually fine, and a gate that fires on 0.5px is a gate
 * somebody disables.
 */
async function expectNoHorizontalScroll(page: Page) {
	const overflow = await page.evaluate(() => {
		const root = document.documentElement;
		const offenders = [];

		if (root.scrollWidth > root.clientWidth + 1) {
			for (const element of Array.from(document.body.querySelectorAll("*"))) {
				const box = element.getBoundingClientRect();
				if (box.width > 0 && box.right > root.clientWidth + 1) {
					offenders.push(
						`${element.tagName.toLowerCase()}.${String(element.className).split(" ").slice(0, 2).join(".")} right=${Math.round(box.right)}`,
					);
				}
				if (offenders.length >= 5) break;
			}
		}

		return {
			overshoot: root.scrollWidth - root.clientWidth,
			viewport: root.clientWidth,
			offenders,
		};
	});

	expect(
		overflow,
		`document scrolls horizontally at ${overflow.viewport}px`,
	).toMatchObject({ offenders: [] });
	expect(overflow.overshoot).toBeLessThanOrEqual(1);
}

/**
 * Wait for an entering MUI dialog to reach full opacity before scanning it. Mid-fade, axe
 * composites the Paper against the backdrop (~#e4e4e4) and reports secondary text at 4.19:1
 * instead of the settled 5.74:1 — an intermittent contrast failure naming a colour pair that
 * is nowhere in the theme. `toBeVisible` is true from the first frame, so it does not help.
 */
export async function waitForDialogToSettle(page: Page) {
	// The whole ancestor chain, not just the Paper. MUI fades the Dialog's own wrapper
	// rather than the Paper, so the Paper reports opacity 1 while everything inside it is
	// still being composited at less than full opacity — which is why polling the Paper
	// alone fixed nothing and the failure stayed intermittent.
	await expect
		.poll(async () =>
			page.evaluate(() => {
				const paper = document.querySelector(".MuiDialog-paper");
				if (!paper) return null;

				for (let node: Element | null = paper; node; node = node.parentElement) {
					if (getComputedStyle(node).opacity !== "1") {
						return "settling";
					}
				}

				return "settled";
			}),
		)
		.toBe("settled");
}

export async function scanForViolations(page: Page) {
	await expectNoHorizontalScroll(page);
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
 * The landmark structure the tag list above cannot see.
 *
 * axe tags `landmark-one-main` and `region` as `best-practice`, so a scan asking for the
 * WCAG A+AA ladder is structurally incapable of reporting them - which is how a Level A
 * failure sat behind a green Level A gate. See docs/accessibility.md.
 */
export const LANDMARK_RULES = [
	"landmark-one-main",
	"landmark-unique",
	"region",
	"bypass",
];

export async function scanForLandmarks(page: Page) {
	await tagLicenceWatermarks(page);

	const results = await new AxeBuilder({ page })
		.withRules(LANDMARK_RULES)
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
