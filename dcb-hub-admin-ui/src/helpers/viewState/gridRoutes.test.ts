import { describe, expect, it } from "vitest";

// Every route whose grid reads its view from the URL is wired as docs/url-view-state.md,
// "Adding a grid", says. Read as source: the wiring is in route options a test cannot reach
// without mounting the router.

const routes = import.meta.glob<string>("../../routes/**/*.tsx", {
	query: "?raw",
	import: "default",
	eager: true,
});

// A route's grid is in the route itself, or in a component that calls useGridView for it
const gridRoutes = Object.entries(routes).filter(
	([, source]) =>
		source.includes("useGridView(") ||
		source.includes("<MappingsGrid") ||
		source.includes("<OperatingWelcome"),
);

describe("grid routes", () => {
	it("are found, so the checks below are not vacuous", () => {
		expect(gridRoutes.length).toBeGreaterThanOrEqual(30);
	});

	it.each(gridRoutes)("%s validates the grid's parameters", (_path, source) => {
		expect(source).toMatch(/validateGridSearch/);
	});

	it.each(gridRoutes)(
		"%s restores a remembered view before it loads",
		(_path, source) => {
			expect(source).toMatch(
				/rememberedViewsRedirect\(|rememberedViewRedirect\(/,
			);
			expect(source).toMatch(/throw redirect\(/);
		},
	);
});
