import { test, expect } from "@playwright/test";
import { seedAuth } from "./fixtures/auth";
import { mockGraphQL } from "./fixtures/graphql-mocks";
import { useAllFeatures } from "./fixtures/flags";
import consortiumBasics from "./fixtures-data/consortium-basics.json";

/**
 * What the operating system asks for, when the user has chosen nothing.
 *
 * `useThemeStore` holds null for "follow my device" and `useResolvedMode` is the only
 * thing that turns that into a mode. Two properties matter and neither is provable
 * without a browser:
 *
 *   - CONTRAST OUTRANKS COLOUR SCHEME. Asking the OS for more contrast is an
 *     accessibility request; answering it with dark mode because the user also asked for
 *     dark would answer the smaller of the two. This application has a high-contrast
 *     theme and, before this, never offered it to the people who had already said they
 *     needed one.
 *   - The unit test in useResolvedMode.test.ts covers `readSystemMode` with a stubbed
 *     matchMedia. It cannot show that the resolved mode reaches ThemeProvider and paints,
 *     which is the half that actually failed for the typeface picker.
 *
 * `stored` is asserted null on purpose: it proves the OS is deciding rather than a
 * persisted preference happening to agree.
 */
test("prefers-contrast: more selects the high contrast theme", async ({
	page,
}) => {
	await page.emulateMedia({ contrast: "more" });
	await useAllFeatures(page);
	await seedAuth(page);
	await mockGraphQL(page, { LoadConsortiumHeader: consortiumBasics });

	await page.goto("/");
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

	const probe = await page.evaluate(() => ({
		matches: window.matchMedia("(prefers-contrast: more)").matches,
		bodyBg: getComputedStyle(document.body).backgroundColor,
		bodyColor: getComputedStyle(document.body).color,
		stored: window.localStorage.getItem("root:dcb-admin-theme"),
	}));
	expect(probe.matches).toBe(true);
	// Nothing persisted: the OS is deciding, not a stored preference that happens to agree.
	expect(probe.stored).toBeNull();
	// The high-contrast scheme is a light ground with near-black ink (AAA >= 7:1).
	expect(probe.bodyBg).toBe("rgb(255, 255, 255)");
	expect(probe.bodyColor).toBe("rgb(0, 0, 0)");
});

test("prefers-color-scheme dark still wins when contrast is not asked for", async ({
	page,
}) => {
	await page.emulateMedia({ colorScheme: "dark" });
	await useAllFeatures(page);
	await seedAuth(page);
	await mockGraphQL(page, { LoadConsortiumHeader: consortiumBasics });

	await page.goto("/");
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

	const probe = await page.evaluate(
		() => getComputedStyle(document.body).backgroundColor,
	);
	const [r, g, b] = probe.match(/\d+/g)!.map(Number);
	expect((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255).toBeLessThan(0.5);
});
