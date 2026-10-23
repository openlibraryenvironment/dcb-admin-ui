// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import {
	createRootRoute,
	createRoute,
	createRouter,
	redirect,
	RouterProvider,
} from "@tanstack/react-router";
import { createMemoryHistory } from "@tanstack/history";
import {
	getGridStringOperators,
	type GridColDef,
} from "@mui/x-data-grid-premium";

import { equalsOnly } from "@filters/equalsOnly";
import { stringifySearch } from "@helpers/viewState/searchSerialiser";
import type { GridViewSpec } from "@helpers/viewState/gridView";
import { emptyView } from "@helpers/viewState/urlViewCodec";
import { rememberedViewRedirect } from "@helpers/viewState/viewRoute";
import { rememberedView, useRememberedViewStore } from "./rememberedViewStore";
import { useGridView, type GridView } from "./useGridView";

const columns: GridColDef[] = [
	{ field: "title", filterOperators: getGridStringOperators() },
	{ field: "status", type: "singleSelect", valueOptions: ["NEW", "DONE"] },
	{ field: "patronBarcode", filterOperators: equalsOnly },
	{ field: "dateCreated", type: "dateTime" },
];

const spec: GridViewSpec = {
	id: "testGrid",
	defaultSort: [{ field: "dateCreated", sort: "desc" }],
	defaultPageSize: 20,
	pageSizeOptions: [20, 50],
	defaultColumnVisibility: {},
	remember: true,
};

let grid: GridView;

const open = (url: string) => {
	const rootRoute = createRootRoute({});
	const gridRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/grid",
		validateSearch: (search: Record<string, unknown>) => search,
		beforeLoad: ({ search, location }) => {
			const restore = rememberedViewRedirect(spec, search, location.state);
			if (restore) throw redirect({ to: "/grid", ...restore });
		},
		component: function Harness() {
			grid = useGridView(spec, columns, gridRoute.useSearch());
			return null;
		},
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([gridRoute]),
		history: createMemoryHistory({ initialEntries: [url] }),
		stringifySearch,
	});
	render(<RouterProvider router={router} />);
	return router;
};

const href = (router: ReturnType<typeof open>) =>
	decodeURIComponent(router.state.location.href);

const remembered = () => ({
	...emptyView(),
	filters: [{ field: "status", operator: "is" as const, values: ["NEW"] }],
	sort: [{ field: "title", direction: "asc" as const }],
});

beforeEach(() => {
	useRememberedViewStore.setState({ views: {} });
});

afterEach(cleanup);

describe("where a view comes from", () => {
	it("opens the grid's defaults on a bare address with nothing remembered", async () => {
		const router = open("/grid");
		await waitFor(() => expect(grid).toBeDefined());
		expect(href(router)).toBe("/grid");
		expect(grid.sortModel).toEqual(spec.defaultSort);
		expect(grid.restored).toBe(false);
	});

	it("opens the reader's last view on a bare address, written into it, and says so", async () => {
		useRememberedViewStore.getState().remember(spec.id, remembered());
		const router = open("/grid");
		await waitFor(() =>
			expect(href(router)).toBe("/grid?filters=status:NEW&sort=title:asc"),
		);
		expect(grid.restored).toBe(true);
		expect(grid.filterModel.items).toEqual([
			{ id: 0, field: "status", operator: "is", value: "NEW" },
		]);
	});

	it("Rule 1: a link's view is shown, and does not replace the remembered one", async () => {
		useRememberedViewStore.getState().remember(spec.id, remembered());
		const router = open("/grid?filters=title:contains:linked");
		await waitFor(() => expect(grid).toBeDefined());
		expect(href(router)).toBe("/grid?filters=title:contains:linked");
		expect(grid.restored).toBe(false);
		expect(grid.filterModel.items[0]).toMatchObject({ value: "linked" });

		await act(() => router.navigate({ to: "/grid", search: {} }));
		await waitFor(() =>
			expect(href(router)).toBe("/grid?filters=status:NEW&sort=title:asc"),
		);
		expect(rememberedView(spec.id)).toEqual(remembered());
	});

	it("Rule 1: paging through a link's view does not make it the remembered one", async () => {
		useRememberedViewStore.getState().remember(spec.id, remembered());
		const router = open("/grid?filters=title:contains:linked");
		await waitFor(() => expect(grid).toBeDefined());
		act(() => grid.onPaginationModelChange({ page: 1, pageSize: 20 }));
		await waitFor(() =>
			expect(href(router)).toBe("/grid?filters=title:contains:linked&page=2"),
		);
		expect(rememberedView(spec.id)).toEqual(remembered());
	});

	it("does not restore over a link that carries other parameters, such as a drill-down", async () => {
		useRememberedViewStore.getState().remember(spec.id, remembered());
		const router = open("/grid?q=status:NEW");
		await waitFor(() => expect(grid).toBeDefined());
		expect(href(router)).toBe("/grid?q=status:NEW");
		expect(grid.restored).toBe(false);
	});
});

describe("the reader's own changes", () => {
	it("reach the address and the remembered view, and end the restored notice", async () => {
		useRememberedViewStore.getState().remember(spec.id, remembered());
		const router = open("/grid");
		await waitFor(() => expect(grid?.restored).toBe(true));

		act(() => grid.onSortModelChange([{ field: "title", sort: "desc" }]));
		await waitFor(() =>
			expect(href(router)).toBe("/grid?filters=status:NEW&sort=title:desc"),
		);
		expect(grid.restored).toBe(false);
		expect(rememberedView(spec.id)?.sort).toEqual([
			{ field: "title", direction: "desc" },
		]);
	});

	it("start a new order on its first page, in one write", async () => {
		const router = open("/grid?page=3");
		await waitFor(() => expect(grid?.paginationModel.page).toBe(2));
		act(() => grid.onSortModelChange([{ field: "title", sort: "asc" }]));
		expect(grid.paginationModel.page).toBe(0);
		await waitFor(() => expect(href(router)).toBe("/grid?sort=title:asc"));
	});

	it("remember the page size but never the page", async () => {
		const router = open("/grid");
		await waitFor(() => expect(grid).toBeDefined());
		act(() => grid.onPaginationModelChange({ page: 1, pageSize: 20 }));
		await waitFor(() => expect(href(router)).toBe("/grid?page=2"));
		expect(rememberedView(spec.id)).toBeUndefined();

		act(() => grid.onPaginationModelChange({ page: 1, pageSize: 50 }));
		await waitFor(() => expect(href(router)).toBe("/grid?page=2&pageSize=50"));
		expect(rememberedView(spec.id)).toEqual({ ...emptyView(), pageSize: 50 });
	});

	it("put column visibility in the address", async () => {
		const router = open("/grid");
		await waitFor(() => expect(grid).toBeDefined());
		act(() => grid.onColumnVisibilityModelChange({ status: false }));
		await waitFor(() => expect(href(router)).toBe("/grid?hide=status"));
		expect(grid.columnVisibilityModel).toEqual({ status: false });
	});

	it("keep a barcode filter in the history entry, never the address or the remembered view", async () => {
		const router = open("/grid");
		await waitFor(() => expect(grid).toBeDefined());
		act(() =>
			grid.onFilterModelChange({
				items: [
					{ id: 1, field: "title", operator: "contains", value: "atlas" },
					{
						id: 2,
						field: "patronBarcode",
						operator: "equals",
						value: "2100012345",
					},
				],
			}),
		);
		await waitFor(() =>
			expect(href(router)).toBe("/grid?filters=title:contains:atlas"),
		);
		expect(
			router.state.location.state.gridPrivate?.[spec.id]?.items,
		).toHaveLength(1);
		expect(JSON.stringify(useRememberedViewStore.getState())).not.toContain(
			"2100012345",
		);
		expect(grid.hasPrivate).toBe(true);
		expect(grid.appliedFilterModel.items).toHaveLength(2);
	});
});

describe("Reset", () => {
	it("returns the defaults and a bare address, and forgets the remembered view", async () => {
		useRememberedViewStore.getState().remember(spec.id, remembered());
		const router = open("/grid");
		await waitFor(() => expect(grid?.restored).toBe(true));
		act(() => grid.reset());
		await waitFor(() => expect(href(router)).toBe("/grid"));
		expect(grid.restored).toBe(false);
		expect(grid.filterModel.items).toEqual([]);
		expect(grid.sortModel).toEqual(spec.defaultSort);
		expect(rememberedView(spec.id)).toBeUndefined();
	});
});

describe("Back", () => {
	it("returns once to the view the grid arrived with, then leaves it", async () => {
		const router = open("/grid");
		await waitFor(() => expect(grid).toBeDefined());
		act(() => grid.onSortModelChange([{ field: "title", sort: "asc" }]));
		await waitFor(() => expect(href(router)).toBe("/grid?sort=title:asc"));
		act(() => grid.onPaginationModelChange({ page: 1, pageSize: 50 }));
		await waitFor(() =>
			expect(href(router)).toBe("/grid?sort=title:asc&page=2&pageSize=50"),
		);
		// The changes were remembered, but the entry Back returns to keeps its own view
		expect(rememberedView(spec.id)).toBeDefined();

		await act(async () => router.history.back());
		await waitFor(() => expect(href(router)).toBe("/grid"));
		expect(grid.sortModel).toEqual(spec.defaultSort);
		expect(grid.restored).toBe(false);
	});
});

describe("an unfinished filter row", () => {
	it("is neither written nor remembered, so a link's view stays the link's", async () => {
		const router = open("/grid?sort=title:asc");
		await waitFor(() => expect(grid).toBeDefined());
		act(() =>
			grid.onFilterModelChange({
				items: [{ id: 1, field: "status", operator: "is" }],
			}),
		);
		await act(() => grid.flush());
		expect(href(router)).toBe("/grid?sort=title:asc");
		expect(rememberedView(spec.id)).toBeUndefined();
	});
});
