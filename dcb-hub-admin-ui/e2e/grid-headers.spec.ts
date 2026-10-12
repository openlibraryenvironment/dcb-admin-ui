import { test, expect } from "@playwright/test";

import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import { MOCKS } from "./fixtures/routes";

/**
 * A column header can be READ without a mouse - W-8.
 *
 * MUI X truncates a header with `text-overflow: ellipsis` and supplies the full text
 * only through a tooltip wired to `onMouseOver`. Verified in the installed 9.15.0:
 * `GridColumnHeaderTitle` computes its `tooltip` state in that handler alone, there is no
 * `onFocus`, and the Tooltip wraps the inner title div while the focusable element is the
 * `columnheader` cell around it.
 *
 * So the full text reaches a mouse user and nobody else. Measured on /patronRequests/all
 * at 768x1024 before the theme override in `themes/openRS.ts`: "Supplying library"
 * rendered 97px of 107, with no `title` attribute on either the title or the cell, and
 * keyboard navigation across the header row opened no tooltip.
 *
 * NOT an accessible-name defect - the text is in the DOM, so a screen reader reads it
 * whole. This is the sighted keyboard and touch case, which no gate here could see: axe
 * has nothing to say about visual truncation, and the reflow check asks whether the
 * DOCUMENT scrolls sideways, not whether a cell clipped its own contents.
 */

const VIEWPORT = { width: 768, height: 1024 };

/** The grids with the longest headers, which is where this fails first. */
const GRID_ROUTES = [
	{
		path: "/patronRequests/all",
		ready: "Alpha and the art of failure",
	},
	{
		path: "/libraries",
		ready: "Alpha Test Library",
	},
	{
		path: "/mappings/allReferenceValue",
		ready: "loanable-item",
	},
	{
		path: "/locations",
		ready: "Alpha Main Desk",
	},
];

for (const route of GRID_ROUTES) {
	test(`${route.path} shows every column header in full on a tablet`, async ({
		page,
	}) => {
		await page.setViewportSize(VIEWPORT);
		await useAllFeatures(page);
		await mockGraphQL(page, MOCKS);
		await seedAuth(page);
		await page.goto(route.path);
		await expect(page.getByText(route.ready).first()).toBeVisible();

		const headers = await page.evaluate(() => {
			const titles = Array.from(
				document.querySelectorAll(".MuiDataGrid-columnHeaderTitle"),
			);
			return titles
				.map((element) => ({
					text: (element.textContent ?? "").trim(),
					// One pixel of tolerance, as the reflow check uses: sub-pixel layout
					// rounding puts scrollWidth a fraction over clientWidth on headers
					// that are visually fine.
					clipped: element.scrollWidth > element.clientWidth + 1,
					shown: element.clientWidth,
					needed: element.scrollWidth,
				}))
				.filter((header) => header.text.length > 0);
		});

		// A route whose grid did not render would pass vacuously.
		expect(headers.length).toBeGreaterThan(0);

		expect(
			headers.filter((header) => header.clipped),
			`column header(s) clipped at ${VIEWPORT.width}px, readable only by hovering a mouse`,
		).toEqual([]);
	});
}
