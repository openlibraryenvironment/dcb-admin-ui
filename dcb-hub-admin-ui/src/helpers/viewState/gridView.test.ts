import { describe, expect, it } from "vitest";
import dayjs from "dayjs";
import {
	getGridDefaultColumnTypes,
	getGridStringOperators,
	GridLogicOperator,
	type GridColDef,
	type GridFilterOperator,
} from "@mui/x-data-grid-premium";
import { defaultParseSearch } from "@tanstack/react-router";

import { equalsOnly } from "@filters/equalsOnly";
import { isOnly } from "@filters/isOnly";
import { luceneDateRangeOperators } from "@filters/luceneDateRangeOperators";
import { numericFilters } from "@filters/numericFilters";
import { serverSupportedOperators } from "@filters/serverFilterOperators";
import {
	filterToView,
	gridRules,
	modelsToView,
	operatorWord,
	orderFromView,
	orderToView,
	parsePrivateState,
	viewToModels,
	type GridModels,
	type GridViewSpec,
} from "./gridView";
import { stringifySearch } from "./searchSerialiser";
import { decodeView, encodeView } from "./urlViewCodec";
import { librariesView } from "@constants/dataGrid/gridViews";

const columns: GridColDef[] = [
	{ field: "__check__", type: "custom" },
	{
		field: "status",
		type: "singleSelect",
		valueOptions: ["SUBMITTED_TO_DCB", "CONFIRMED"],
	},
	{ field: "title", filterOperators: getGridStringOperators() },
	{ field: "patronBarcode", filterOperators: equalsOnly },
	{
		field: "dateCreated",
		type: "dateTime",
		filterOperators: luceneDateRangeOperators,
	},
	{ field: "elapsed", type: "number", filterOperators: numericFilters },
	{ field: "pickupLibrary", type: "singleSelect", filterOperators: isOnly },
	{ field: "notes", filterable: false, sortable: false },
	{ field: "actions", type: "actions" },
];

const spec: GridViewSpec = {
	id: "testGrid",
	defaultSort: [{ field: "dateCreated", sort: "desc" }],
	defaultPageSize: 20,
	pageSizeOptions: [10, 20, 50, 100],
	defaultColumnVisibility: { notes: false },
	remember: true,
};

const rules = gridRules(columns);

const defaults = (): GridModels => viewToModels(spec, rules, decodeView({}));

/** Models → URL view → the address bar → URL view → models, as a shared link travels. */
const throughTheAddressBar = (models: GridModels) => {
	const { view, privateState } = modelsToView(spec, rules, models);
	const href = stringifySearch(encodeView(view));
	const read = decodeView(defaultParseSearch(href));
	return { href, models: viewToModels(spec, rules, read, privateState) };
};

describe("every operator a grid offers has a word in the URL", () => {
	const offered = new Map<string, string>();
	const collect = (operator: GridFilterOperator, source: string) =>
		offered.set(operator.value, source);

	for (const [type, definition] of Object.entries(
		getGridDefaultColumnTypes(),
	)) {
		for (const operator of definition.filterOperators ?? [])
			collect(operator, `MUI ${type}`);
	}
	const modules = import.meta.glob<Record<string, unknown>>(
		["../../filters/*.ts", "!../../filters/*.test.ts"],
		{ eager: true },
	);
	for (const [path, exports] of Object.entries(modules)) {
		for (const exported of Object.values(exports)) {
			const candidates = Array.isArray(exported) ? exported : [exported];
			for (const candidate of candidates) {
				if (
					typeof candidate === "object" &&
					candidate !== null &&
					typeof (candidate as GridFilterOperator).value === "string" &&
					typeof (candidate as GridFilterOperator).getApplyFilterFn ===
						"function"
				)
					collect(candidate as GridFilterOperator, path);
			}
		}
	}
	for (const operator of serverSupportedOperators)
		if (!offered.has(operator))
			offered.set(operator, "serverSupportedOperators");

	it("finds the app's own operators, so the sweep is not empty", () => {
		expect(offered.get("luceneDateRange")).toMatch(/filters/);
		expect(offered.get("containsPhrase")).toMatch(/filters/);
	});

	it.each([...offered])("%s (%s)", (operator) => {
		expect(operatorWord(operator)).toBeDefined();
	});
});

describe("a view survives a shared link", () => {
	it("writes the defaults as a bare address", () => {
		expect(throughTheAddressBar(defaults()).href).toBe("");
	});

	it("carries filters, sort, page, page size and columns", () => {
		const models: GridModels = {
			...defaults(),
			filterModel: {
				items: [
					{
						id: 0,
						field: "status",
						operator: "isAnyOf",
						value: ["SUBMITTED_TO_DCB", "CONFIRMED"],
					},
					{
						id: 1,
						field: "title",
						operator: "contains",
						value: "local history",
					},
					{ id: 2, field: "elapsed", operator: "between", value: ["2", null] },
				],
			},
			sortModel: [{ field: "title", sort: "asc" }],
			paginationModel: { page: 2, pageSize: 50 },
			columnVisibilityModel: { notes: true, title: false },
		};
		const { href, models: read } = throughTheAddressBar(models);
		expect(href).toBe(
			"?filters=status:SUBMITTED_TO_DCB,CONFIRMED&filters=title:contains:local+history" +
				"&filters=elapsed:between:2..&sort=title:asc&page=3&pageSize=50&hide=title&show=notes",
		);
		expect(read).toEqual({
			...models,
			columnVisibilityModel: { notes: true, title: false },
		});
	});

	it("writes a date picker's value as ISO text, and reads it back as text the picker takes", () => {
		const start = dayjs("2026-10-01T00:00:00Z");
		const { href, models } = throughTheAddressBar({
			...defaults(),
			filterModel: {
				items: [
					{
						id: 0,
						field: "dateCreated",
						operator: "luceneDateRange",
						value: [start, null],
					},
				],
			},
		});
		expect(href).toBe(
			"?filters=dateCreated:between:2026-10-01T00:00:00.000Z..",
		);
		expect(models.filterModel.items[0].value).toEqual([
			"2026-10-01T00:00:00.000Z",
			null,
		]);
	});

	it("reads one value of `is` as the column's equality, and several as any-of", () => {
		const one = decodeView({ filters: "status:CONFIRMED" });
		expect(viewToModels(spec, rules, one).filterModel.items[0]).toMatchObject({
			operator: "is",
			value: "CONFIRMED",
		});
		const many = decodeView({ filters: "status:CONFIRMED,SUBMITTED_TO_DCB" });
		expect(viewToModels(spec, rules, many).filterModel.items[0]).toMatchObject({
			operator: "isAnyOf",
			value: ["CONFIRMED", "SUBMITTED_TO_DCB"],
		});
	});

	it("writes an explicitly unsorted grid as `none`, which reads back unsorted", () => {
		const { href, models } = throughTheAddressBar({
			...defaults(),
			sortModel: [],
		});
		expect(href).toBe("?sort=none");
		expect(models.sortModel).toEqual([]);
	});

	it("writes OR only when it joins two filters", () => {
		const items = [
			{ id: 0, field: "title", operator: "contains", value: "a" },
			{ id: 1, field: "title", operator: "contains", value: "b" },
		];
		const or = GridLogicOperator.Or;
		expect(filterToView(rules, { items, logicOperator: or }).logic).toBe("or");
		expect(
			filterToView(rules, { items: items.slice(0, 1), logicOperator: or })
				.logic,
		).toBeUndefined();
	});
});

describe("private values never reach the URL", () => {
	const models = (): GridModels => ({
		...defaults(),
		filterModel: {
			items: [
				{ id: 0, field: "title", operator: "contains", value: "atlas" },
				{
					id: 1,
					field: "patronBarcode",
					operator: "equals",
					value: "2100012345",
				},
			],
			quickFilterValues: ["Smith"],
		},
	});

	it("keeps a barcode and quick-search text out of the address", () => {
		const { href } = throughTheAddressBar(models());
		expect(href).toBe("?filters=title:contains:atlas");
		expect(href).not.toContain("2100012345");
		expect(href).not.toContain("Smith");
	});

	it("restores them from the history entry, in the panel's order", () => {
		const { models: read } = throughTheAddressBar(models());
		expect(read.filterModel).toEqual(models().filterModel);
	});

	it("ignores a barcode filter a link carries", () => {
		const view = decodeView({
			filters: ["patronBarcode:2100012345", "title:x"],
		});
		expect(viewToModels(spec, rules, view).filterModel.items).toEqual([
			{ id: 0, field: "title", operator: "equals", value: "x" },
		]);
	});

	it("reads back from history state only private fields, checked like a link", () => {
		expect(
			parsePrivateState(rules, {
				items: [
					{
						index: 0,
						item: { field: "title", operator: "contains", value: "x" },
					},
					{
						index: -1,
						item: { field: "patronBarcode", operator: "equals", value: "1" },
					},
					{
						index: 3,
						item: { field: "patronBarcode", operator: "nope", value: "1" },
					},
					{
						index: 1,
						item: { field: "patronBarcode", operator: "equals", value: "7" },
					},
				],
				quickFilterValues: ["ok", 42, "x".repeat(257)],
			}),
		).toEqual({
			items: [
				{
					index: 1,
					item: {
						id: 1,
						field: "patronBarcode",
						operator: "equals",
						value: "7",
					},
				},
			],
			quickFilterValues: ["ok"],
		});
		expect(parsePrivateState(rules, "nonsense")).toBeUndefined();
	});
});

describe("a filter the grammar cannot state", () => {
	// A pickup library with twenty locations: twenty ids joined, far past what a URL value may hold
	const library = Array.from(
		{ length: 20 },
		(_, i) => `4f8c1b2e-9a3d-4c7f-8e15-2b6d7a0c9e${String(i).padStart(2, "0")}`,
	).join("|");
	const models = (): GridModels => ({
		...defaults(),
		filterModel: {
			items: [
				{ id: 0, field: "pickupLibrary", operator: "is", value: library },
				{ id: 1, field: "title", operator: "contains", value: "atlas" },
			],
		},
	});

	it("still filters the grid, from the history entry, and stays out of the address", () => {
		const { href, models: read } = throughTheAddressBar(models());
		expect(href).toBe("?filters=title:contains:atlas");
		expect(read.filterModel).toEqual(models().filterModel);
	});

	it("is read back from the history entry", () => {
		const { privateState } = filterToView(rules, models().filterModel);
		expect(parsePrivateState(rules, privateState)).toEqual(privateState);
	});
});

describe("a link is read through the grid's allow-lists", () => {
	const read = (search: Record<string, unknown>) =>
		viewToModels(spec, rules, decodeView(search));

	it.each([
		["a field the grid does not have", "secret:x"],
		["a field the grid does not filter on", "notes:x"],
		["an operator the column does not offer", "elapsed:contains:5"],
		["a value of the wrong type", "elapsed:min:five"],
		["a date that is not one", "dateCreated:from:yesterday"],
	])("drops %s", (_label, filter) => {
		expect(
			read({ filters: [filter, "title:contains:ok"] }).filterModel.items,
		).toEqual([{ id: 0, field: "title", operator: "contains", value: "ok" }]);
	});

	it("drops a sort on a column that cannot sort, leaving the default", () => {
		expect(read({ sort: "notes:asc" }).sortModel).toEqual(spec.defaultSort);
	});

	it("drops a page size the grid does not offer", () => {
		expect(read({ pageSize: 7 }).paginationModel.pageSize).toBe(20);
	});

	it("ignores a column the grid does not have, and never writes MUI's own", () => {
		expect(read({ hide: "title,ghost" }).columnVisibilityModel).toEqual({
			notes: false,
			title: false,
		});
		const { view } = modelsToView(spec, rules, {
			...defaults(),
			columnVisibilityModel: { notes: false, __check__: false },
		});
		expect(view.hide).toEqual([]);
	});
});

describe("the allow-lists", () => {
	it("are the same rules for columns whose select options arrive later", () => {
		const later = columns.map((column) =>
			column.field === "status"
				? { ...column, valueOptions: ["SUBMITTED_TO_DCB", "CONFIRMED", "NEW"] }
				: column,
		);
		expect(gridRules(later).key).toBe(rules.key);
	});

	it("change when a column's operators do", () => {
		const fewer = columns.map((column) =>
			column.field === "title"
				? { ...column, filterOperators: equalsOnly }
				: column,
		);
		expect(gridRules(fewer).key).not.toBe(rules.key);
	});
});

describe("the largest page a reader can choose", () => {
	const viewModels = (): GridModels =>
		viewToModels(librariesView, rules, decodeView({}));

	const travel = (pageSize: number) => {
		const { view } = modelsToView(librariesView, rules, {
			...viewModels(),
			paginationModel: { page: 0, pageSize },
		});
		const href = stringifySearch(encodeView(view));
		return {
			href,
			pageSize: viewToModels(
				librariesView,
				rules,
				decodeView(defaultParseSearch(href)),
			).paginationModel.pageSize,
		};
	};

	it("survives a shared link at 200", () => {
		const { href, pageSize } = travel(200);
		expect(href).toContain("pageSize=200");
		expect(pageSize).toBe(200);
	});

	it("is not widened by a hand-typed link", () => {
		expect(
			viewToModels(librariesView, rules, decodeView({ pageSize: 500 }))
				.paginationModel.pageSize,
		).toBe(librariesView.defaultPageSize);
	});
});

describe("pinning and column order", () => {
	it("write as the pinned lists and the shortest run of leading columns", () => {
		const { href, models } = throughTheAddressBar({
			...defaults(),
			pinnedColumns: { left: ["status"], right: ["actions"] },
			columnOrder: orderFromView(rules, ["elapsed", "title"]),
		});
		expect(href).toBe("?pinLeft=status&pinRight=actions&order=elapsed,title");
		expect(models.pinnedColumns).toEqual({
			left: ["status"],
			right: ["actions"],
		});
		expect(models.columnOrder.slice(0, 2)).toEqual(["elapsed", "title"]);
	});

	it("drop a column the grid does not render, and keep the rest in their default places", () => {
		const models = viewToModels(
			spec,
			rules,
			decodeView({
				pinLeft: "noSuchColumn,status",
				order: "noSuchColumn,notes",
			}),
		);
		expect(models.pinnedColumns).toEqual({ left: ["status"], right: [] });
		expect(models.columnOrder[0]).toBe("notes");
		expect([...models.columnOrder].sort()).toEqual([...rules.order].sort());
	});

	it("never write the default order", () => {
		expect(orderToView(rules, rules.order)).toBeUndefined();
	});

	it("always find the shortest prefix that gives the order back", () => {
		// A seeded shuffle: the same orders every run
		let seed = 7;
		const random = () =>
			((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
		for (let run = 0; run < 200; run++) {
			const order = [...rules.order];
			const moves = 1 + Math.floor(random() * 3);
			for (let move = 0; move < moves; move++) {
				const from = Math.floor(random() * order.length);
				const [field] = order.splice(from, 1);
				order.splice(Math.floor(random() * order.length), 0, field);
			}
			const prefix = orderToView(rules, order) ?? [];
			expect(orderFromView(rules, prefix)).toEqual(order);
			if (prefix.length > 0) {
				expect(orderFromView(rules, prefix.slice(0, -1))).not.toEqual(order);
			}
		}
	});
});

describe("aggregation", () => {
	const aggregating: GridViewSpec = { ...spec, aggregation: true };
	const travel = (gridSpec: GridViewSpec, models: GridModels) => {
		const { view } = modelsToView(gridSpec, rules, models);
		const href = stringifySearch(encodeView(view));
		return {
			href,
			models: viewToModels(
				gridSpec,
				rules,
				decodeView(defaultParseSearch(href)),
			),
		};
	};

	it("survives a shared link on a grid that holds every row", () => {
		const { href, models } = travel(aggregating, {
			...defaults(),
			aggregationModel: { elapsed: "sum", dateCreated: "max" },
		});
		expect(href).toBe("?agg=elapsed:sum,dateCreated:max");
		expect(models.aggregationModel).toEqual({
			elapsed: "sum",
			dateCreated: "max",
		});
	});

	it("drops a function the column's type is not offered", () => {
		const models = viewToModels(
			aggregating,
			rules,
			decodeView({ agg: "title:sum,elapsed:avg" }),
		);
		expect(models.aggregationModel).toEqual({ elapsed: "avg" });
	});

	it("is never written or read on a server-paged grid, where it would total one page", () => {
		const { href } = travel(spec, {
			...defaults(),
			aggregationModel: { elapsed: "sum" },
		});
		expect(href).toBe("");
		expect(
			viewToModels(spec, rules, decodeView({ agg: "elapsed:sum" }))
				.aggregationModel,
		).toEqual({});
	});
});
