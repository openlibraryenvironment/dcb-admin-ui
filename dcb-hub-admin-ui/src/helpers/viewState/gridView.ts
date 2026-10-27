import {
	getGridDefaultColumnTypes,
	GRID_AGGREGATION_FUNCTIONS,
	GridLogicOperator,
	type GridAggregationModel,
	type GridColDef,
	type GridColumnVisibilityModel,
	type GridFilterItem,
	type GridFilterModel,
	type GridFilterOperator,
	type GridPaginationModel,
	type GridPinnedColumnFields,
	type GridSortModel,
} from "@mui/x-data-grid-premium";

import {
	encodeFilter,
	isFieldName,
	type OperatorWord,
	type UrlAggregate,
	type UrlFilter,
	type UrlSort,
	type UrlView,
} from "./urlViewCodec";

// MUI X's grid models to and from the URL's view: docs/url-view-state.md.

/** Filter fields whose values never go in a URL, a remembered view or a saved one. */
export const PRIVATE_FILTER_FIELDS: readonly string[] = [
	"patronBarcode",
	"requesterNote",
];

export const isPrivateField = (field: string) =>
	PRIVATE_FILTER_FIELDS.includes(field);

export interface GridViewSpec {
	/** Keys the grid's remembered view and its history-state entries. */
	id: string;
	/** A second view on a page prefixes its parameters with this. */
	namespace?: string;
	defaultSort: GridSortModel;
	defaultPageSize: number;
	pageSizeOptions: readonly number[];
	defaultColumnVisibility: GridColumnVisibilityModel;
	/** Whether a bare URL opens the reader's last view of this grid. */
	remember: boolean;
	/** The reader chooses each column's aggregate. Only a grid that holds every row: on a server page it would total one page. */
	aggregation?: boolean;
}

export interface GridModels {
	filterModel: GridFilterModel;
	sortModel: GridSortModel;
	paginationModel: GridPaginationModel;
	columnVisibilityModel: GridColumnVisibilityModel;
	pinnedColumns: GridPinnedColumnFields;
	/** Every field the reader can share, in the reader's order. */
	columnOrder: string[];
	aggregationModel: GridAggregationModel;
}

/** What a grid keeps in its history entry rather than its URL. */
export interface PrivateGridState {
	/** Each with its position in the full filter list, so the panel keeps its order. */
	items: { index: number; item: GridFilterItem }[];
	quickFilterValues: string[];
}

/** MUI X operator values, ours and its defaults, to the URL's words. */
const WORD_OF: Readonly<Record<string, OperatorWord>> = {
	equals: "is",
	is: "is",
	"=": "is",
	isAnyOf: "is",
	not: "not",
	"!=": "not",
	doesNotEqual: "not",
	"does not equal": "not",
	"Does not equal": "not",
	contains: "contains",
	containsPhrase: "phrase",
	doesNotContain: "notContains",
	"does not contain": "notContains",
	startsWith: "startsWith",
	endsWith: "endsWith",
	onOrAfter: "from",
	onOrBefore: "to",
	after: "after",
	before: "before",
	between: "between",
	luceneDateRange: "between",
	">=": "min",
	"<=": "max",
	">": "over",
	"<": "under",
	isEmpty: "empty",
	isNotEmpty: "notEmpty",
	last30Days: "last30Days",
	last90Days: "last90Days",
};

export const operatorWord = (operator: string): OperatorWord | undefined =>
	WORD_OF[operator];

type ValueKind = "none" | "scalar" | "list" | "range";

const RANGE_OPERATORS = new Set(["between", "luceneDateRange"]);
const DATE_OPERATORS = new Set(["luceneDateRange", "onOrAfter", "onOrBefore"]);
const EQUALITY_OPERATORS = ["equals", "is", "="];
const MAX_TEXT = 256;
// A pickup library's value packs its locations' ids: longer than a URL may carry, so kept in history
const MAX_VALUE = 4096;
const MAX_QUICK_FILTER_VALUES = 10;
const MAX_PRIVATE_ITEMS = 20;
const NUMERIC = /^-?\d+(\.\d+)?$/;

const kindOf = (operator: GridFilterOperator): ValueKind => {
	if (operator.value === "isAnyOf") return "list";
	if (RANGE_OPERATORS.has(operator.value)) return "range";
	return operator.requiresFilterValue === false || !operator.InputComponent
		? "none"
		: "scalar";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const isText = (value: unknown): value is string =>
	typeof value === "string" && value.length <= MAX_TEXT;

const isValue = (value: string) => value.length <= MAX_VALUE;

const isDateText = (value: string) =>
	value.length <= 64 && !Number.isNaN(Date.parse(value));

const isNumeric = (value: string) => NUMERIC.test(value);

const isBooleanText = (value: string) => value === "true" || value === "false";

// A select's values are bounded text, not checked against its options: on several grids those load
// after the first render, and a linked filter would be dropped and the grid fetched unfiltered first.
const acceptsFor = (type: string): ((value: string) => boolean) => {
	switch (type) {
		case "number":
			return isNumeric;
		case "boolean":
			return isBooleanText;
		case "date":
		case "dateTime":
			return isDateText;
		default:
			return isValue;
	}
};

interface FilterRule {
	operators: ReadonlyMap<string, ValueKind>;
	type: string;
}

/** The allow-lists: a field the grid does not filter on, or an operator it does not offer, is refused. */
export interface GridRules {
	filters: ReadonlyMap<string, FilterRule>;
	sortable: ReadonlySet<string>;
	fields: ReadonlySet<string>;
	/** The fields in the grid's default order. */
	order: readonly string[];
	/** Per aggregable field, the aggregate functions MUI offers its type. */
	aggregates: ReadonlyMap<string, ReadonlySet<string>>;
	/** Equal for two column sets the URL cannot tell apart. */
	key: string;
}

export const gridRules = (columns: readonly GridColDef[]): GridRules => {
	const types = getGridDefaultColumnTypes();
	const filters = new Map<string, FilterRule>();
	for (const column of columns) {
		if (column.filterable === false || column.type === "actions") continue;
		const type = column.type ?? "string";
		const operators =
			column.filterOperators ?? types[type]?.filterOperators ?? [];
		filters.set(column.field, {
			operators: new Map(operators.map((op) => [op.value, kindOf(op)])),
			type,
		});
	}
	const sortable = new Set(
		columns
			.filter(
				(column) => column.sortable !== false && column.type !== "actions",
			)
			.map((column) => column.field),
	);
	// MUI's own columns (`__check__`, `__detail_panel_toggle__`) are not the reader's to share
	const order = columns.map((column) => column.field).filter(isFieldName);
	const fields = new Set(order);
	const aggregates = new Map<string, ReadonlySet<string>>();
	for (const column of columns) {
		if (!isFieldName(column.field) || column.aggregable === false) continue;
		const type = column.type ?? "string";
		const offered =
			column.availableAggregationFunctions ??
			Object.entries(GRID_AGGREGATION_FUNCTIONS)
				.filter(([, fn]) => !fn.columnTypes || fn.columnTypes.includes(type))
				.map(([name]) => name);
		aggregates.set(column.field, new Set(offered));
	}
	const key = JSON.stringify([
		[...filters].map(([field, rule]) => [
			field,
			rule.type,
			[...rule.operators],
		]),
		[...sortable],
		order,
		[...aggregates].map(([field, names]) => [field, [...names]]),
	]);
	return { filters, sortable, fields, order, aggregates, key };
};

/** Values as a URL holds them: the date pickers hand over Dayjs objects, which serialise to ISO. */
const plainText = (value: unknown): string | null => {
	if (value === null || value === undefined || value === "") return null;
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean")
		return String(value);
	if (typeof (value as { toJSON?: unknown }).toJSON === "function") {
		const json = (value as { toJSON: () => unknown }).toJSON();
		return typeof json === "string" ? json : null;
	}
	return null;
};

const acceptsFilterValue = (rule: FilterRule, operator: string) =>
	DATE_OPERATORS.has(operator) ? isDateText : acceptsFor(rule.type);

/** One grid filter as the URL states it, or null for a row not finished or not allowed. */
export const itemToFilter = (
	rules: GridRules,
	item: GridFilterItem,
): UrlFilter | null => {
	const rule = rules.filters.get(item.field);
	const kind = rule?.operators.get(item.operator);
	const operator = operatorWord(item.operator);
	if (!rule || !kind || !operator) return null;
	const accepts = acceptsFilterValue(rule, item.operator);

	if (kind === "none") return { field: item.field, operator, values: [] };
	if (kind === "scalar") {
		const value = plainText(item.value);
		return value !== null && accepts(value)
			? { field: item.field, operator, values: [value] }
			: null;
	}
	if (kind === "list") {
		if (!Array.isArray(item.value) || item.value.length === 0) return null;
		const values = item.value.map(plainText);
		return values.every(
			(value): value is string => value !== null && accepts(value),
		)
			? { field: item.field, operator, values }
			: null;
	}
	if (!Array.isArray(item.value) || item.value.length !== 2) return null;
	const bounds = item.value.map(plainText);
	if (bounds.every((bound) => bound === null)) return null;
	if (!bounds.every((bound) => bound === null || accepts(bound))) return null;
	return {
		field: item.field,
		operator,
		values: bounds.map((bound) => bound ?? ""),
	};
};

/** The column's own operator for a URL word: `is` with several values is `isAnyOf`. */
const operatorFor = (
	rule: FilterRule,
	filter: UrlFilter,
): string | undefined => {
	const offered = [...rule.operators.keys()];
	if (filter.operator === "is") {
		if (filter.values.length > 1) return offered.find((op) => op === "isAnyOf");
		return (
			EQUALITY_OPERATORS.find((op) => offered.includes(op)) ??
			offered.find((op) => op === "isAnyOf")
		);
	}
	return offered.find((op) => WORD_OF[op] === filter.operator);
};

/** A URL filter as a grid item for this grid, or null where the grid cannot take it. */
export const filterToItem = (
	rules: GridRules,
	filter: UrlFilter,
	id: number,
): GridFilterItem | null => {
	const rule = rules.filters.get(filter.field);
	const operator = rule && operatorFor(rule, filter);
	const kind = operator ? rule.operators.get(operator) : undefined;
	if (!rule || !operator || !kind) return null;
	const accepts = acceptsFilterValue(rule, operator);
	const item: GridFilterItem = { id, field: filter.field, operator };

	if (kind === "none") return filter.values.length === 0 ? item : null;
	if (kind === "scalar") {
		const [value] = filter.values;
		return filter.values.length === 1 && accepts(value)
			? { ...item, value }
			: null;
	}
	if (kind === "list") {
		return filter.values.length > 0 && filter.values.every(accepts)
			? { ...item, value: filter.values }
			: null;
	}
	const bounds = filter.values.map((bound) => (bound === "" ? null : bound));
	return bounds.length === 2 &&
		bounds.every((bound) => bound === null || accepts(bound))
		? { ...item, value: bounds }
		: null;
};

/** Kept in the history entry: a patron's identity or words, or a filter the grammar cannot state. */
const staysInHistory = (filter: UrlFilter) =>
	isPrivateField(filter.field) || encodeFilter(filter) === null;

/** A row the URL cannot carry yet: kept on screen, unapplied, until it is finished or removed. */
export const hasDraftItems = (rules: GridRules, model: GridFilterModel) =>
	model.items.some((item) => itemToFilter(rules, item) === null);

export interface FilterPart {
	filters: UrlFilter[];
	logic?: "or";
	privateState?: PrivateGridState;
}

export const filterToView = (
	rules: GridRules,
	model: GridFilterModel,
): FilterPart => {
	const filters: UrlFilter[] = [];
	const privateItems: PrivateGridState["items"] = [];
	model.items.forEach((item, index) => {
		const filter = itemToFilter(rules, item);
		if (!filter) return;
		if (staysInHistory(filter)) privateItems.push({ index, item });
		else filters.push(filter);
	});
	const quickFilterValues = (model.quickFilterValues ?? [])
		.filter(isText)
		.filter((value) => value !== "")
		.slice(0, MAX_QUICK_FILTER_VALUES);
	const part: FilterPart = { filters };
	// MUI keeps OR after all but one filter is removed; with fewer than two it joins nothing
	if (
		model.logicOperator === GridLogicOperator.Or &&
		filters.length + privateItems.length > 1
	) {
		part.logic = "or";
	}
	if (privateItems.length > 0 || quickFilterValues.length > 0) {
		part.privateState = { items: privateItems, quickFilterValues };
	}
	return part;
};

export const filterFromView = (
	rules: GridRules,
	view: Pick<UrlView, "filters" | "logic">,
	privateState?: PrivateGridState,
): GridFilterModel => {
	const items = view.filters
		.filter((filter) => !isPrivateField(filter.field))
		.map((filter, index) => filterToItem(rules, filter, index))
		.filter((item): item is GridFilterItem => item !== null);
	const privateItems = [...(privateState?.items ?? [])].sort(
		(a, b) => a.index - b.index,
	);
	for (const { index, item } of privateItems) {
		items.splice(Math.min(index, items.length), 0, item);
	}
	const model: GridFilterModel = {
		// Ids are the panel's row keys: unique across the URL's rows and the history entry's
		items: items.map((item, position) => ({ ...item, id: position })),
	};
	if (view.logic === "or") model.logicOperator = GridLogicOperator.Or;
	if (privateState?.quickFilterValues.length) {
		model.quickFilterValues = privateState.quickFilterValues;
	}
	return model;
};

const sameSort = (a: GridSortModel, b: GridSortModel) =>
	a.length === b.length &&
	a.every(
		(entry, index) =>
			entry.field === b[index].field && entry.sort === b[index].sort,
	);

/** Undefined when the grid's default order is in force. */
export const sortToView = (
	spec: GridViewSpec,
	rules: GridRules,
	model: GridSortModel,
): UrlView["sort"] => {
	const sort = model.filter(
		(entry) => entry.sort && rules.sortable.has(entry.field),
	);
	if (sameSort(sort, spec.defaultSort)) return undefined;
	if (sort.length === 0) return "none";
	return sort.map((entry): UrlSort => ({
		field: entry.field,
		direction: entry.sort === "asc" ? "asc" : "desc",
	}));
};

export const sortFromView = (
	spec: GridViewSpec,
	rules: GridRules,
	sort: UrlView["sort"],
): GridSortModel => {
	if (sort === "none") return [];
	const allowed = (sort ?? []).filter((entry) =>
		rules.sortable.has(entry.field),
	);
	return allowed.length > 0
		? allowed.map((entry) => ({ field: entry.field, sort: entry.direction }))
		: spec.defaultSort;
};

export const paginationToView = (
	spec: GridViewSpec,
	model: GridPaginationModel,
): Pick<UrlView, "page" | "pageSize"> => ({
	page: model.page > 0 ? model.page : undefined,
	pageSize:
		model.pageSize !== spec.defaultPageSize &&
		spec.pageSizeOptions.includes(model.pageSize)
			? model.pageSize
			: undefined,
});

export const paginationFromView = (
	spec: GridViewSpec,
	view: Pick<UrlView, "page" | "pageSize">,
): GridPaginationModel => ({
	page: view.page ?? 0,
	pageSize:
		view.pageSize !== undefined && spec.pageSizeOptions.includes(view.pageSize)
			? view.pageSize
			: spec.defaultPageSize,
});

const visibleIn = (model: GridColumnVisibilityModel, field: string) =>
	model[field] !== false;

export const visibilityToView = (
	spec: GridViewSpec,
	rules: GridRules,
	model: GridColumnVisibilityModel,
): Pick<UrlView, "hide" | "show"> => {
	const hide: string[] = [];
	const show: string[] = [];
	for (const field of rules.fields) {
		const shown = visibleIn(model, field);
		if (shown === visibleIn(spec.defaultColumnVisibility, field)) continue;
		(shown ? show : hide).push(field);
	}
	return { hide, show };
};

export const visibilityFromView = (
	spec: GridViewSpec,
	rules: GridRules,
	view: Pick<UrlView, "hide" | "show">,
): GridColumnVisibilityModel => {
	const model: GridColumnVisibilityModel = {
		...spec.defaultColumnVisibility,
	};
	for (const field of view.hide)
		if (rules.fields.has(field)) model[field] = false;
	for (const field of view.show)
		if (rules.fields.has(field)) model[field] = true;
	return model;
};

const known = (rules: GridRules, fields: readonly string[] | undefined) =>
	(fields ?? []).filter((field) => rules.fields.has(field));

export const pinnedToView = (
	rules: GridRules,
	model: GridPinnedColumnFields,
): Pick<UrlView, "pinLeft" | "pinRight"> => {
	const pinLeft = known(rules, model.left);
	const pinRight = known(rules, model.right).filter(
		(field) => !pinLeft.includes(field),
	);
	return {
		pinLeft: pinLeft.length ? pinLeft : undefined,
		pinRight: pinRight.length ? pinRight : undefined,
	};
};

export const pinnedFromView = (
	rules: GridRules,
	view: Pick<UrlView, "pinLeft" | "pinRight">,
): GridPinnedColumnFields => ({
	left: known(rules, view.pinLeft),
	right: known(rules, view.pinRight),
});

/** The named fields first, without repeats, then the rest in the grid's default order. */
export const orderFromView = (
	rules: GridRules,
	order: readonly string[] | undefined,
): string[] => {
	const leading = [...new Set(known(rules, order))];
	return [
		...leading,
		...rules.order.filter((field) => !leading.includes(field)),
	];
};

/** The shortest run of leading fields that orderFromView turns back into this order: undefined for the default. */
export const orderToView = (
	rules: GridRules,
	order: readonly string[],
): string[] | undefined => {
	const full = orderFromView(rules, order);
	for (let length = 0; length <= full.length; length++) {
		const leading = full.slice(0, length);
		const rebuilt = orderFromView(rules, leading);
		if (rebuilt.every((field, index) => field === full[index])) {
			return length === 0 ? undefined : leading;
		}
	}
	return full;
};

/** Undefined for none, which is every grid's default; ignored where the grid does not aggregate. */
export const aggregationToView = (
	spec: GridViewSpec,
	rules: GridRules,
	model: GridAggregationModel,
): UrlView["agg"] => {
	if (!spec.aggregation) return undefined;
	const agg: UrlAggregate[] = Object.entries(model)
		.filter(([field, fn]) => rules.aggregates.get(field)?.has(fn))
		.map(([field, fn]) => ({ field, fn }));
	return agg.length ? agg : undefined;
};

export const aggregationFromView = (
	spec: GridViewSpec,
	rules: GridRules,
	agg: UrlView["agg"],
): GridAggregationModel =>
	!spec.aggregation || agg === undefined || agg === "none"
		? {}
		: Object.fromEntries(
				agg
					.filter(({ field, fn }) => rules.aggregates.get(field)?.has(fn))
					.map(({ field, fn }) => [field, fn]),
			);

/** The grid's models as a URL view, and what must stay out of it. */
export const modelsToView = (
	spec: GridViewSpec,
	rules: GridRules,
	models: GridModels,
): { view: UrlView; privateState: PrivateGridState | undefined } => {
	const { filters, logic, privateState } = filterToView(
		rules,
		models.filterModel,
	);
	const { page, pageSize } = paginationToView(spec, models.paginationModel);
	const view: UrlView = {
		filters,
		...visibilityToView(spec, rules, models.columnVisibilityModel),
	};
	const { pinLeft, pinRight } = pinnedToView(rules, models.pinnedColumns);
	if (pinLeft) view.pinLeft = pinLeft;
	if (pinRight) view.pinRight = pinRight;
	const order = orderToView(rules, models.columnOrder);
	if (order) view.order = order;
	const agg = aggregationToView(spec, rules, models.aggregationModel);
	if (agg) view.agg = agg;
	if (logic) view.logic = logic;
	const sort = sortToView(spec, rules, models.sortModel);
	if (sort) view.sort = sort;
	if (page !== undefined) view.page = page;
	if (pageSize !== undefined) view.pageSize = pageSize;
	return { view, privateState };
};

/** A URL view, plus the history entry's private values, as the grid's models. */
export const viewToModels = (
	spec: GridViewSpec,
	rules: GridRules,
	view: UrlView,
	privateState?: PrivateGridState,
): GridModels => ({
	filterModel: filterFromView(rules, view, privateState),
	sortModel: sortFromView(spec, rules, view.sort),
	paginationModel: paginationFromView(spec, view),
	columnVisibilityModel: visibilityFromView(spec, rules, view),
	pinnedColumns: pinnedFromView(rules, view),
	columnOrder: orderFromView(rules, view.order),
	aggregationModel: aggregationFromView(spec, rules, view.agg),
});

/** History state is written by this app but read back from the browser: checked like a URL. */
export const parsePrivateState = (
	rules: GridRules,
	raw: unknown,
): PrivateGridState | undefined => {
	if (!isRecord(raw)) return undefined;
	const items = (Array.isArray(raw.items) ? raw.items : [])
		.slice(0, MAX_PRIVATE_ITEMS)
		.flatMap((entry) => {
			if (!isRecord(entry) || !isRecord(entry.item)) return [];
			const { index } = entry;
			if (
				typeof index !== "number" ||
				!Number.isSafeInteger(index) ||
				index < 0
			)
				return [];
			const { field, operator, value } = entry.item;
			if (typeof field !== "string" || typeof operator !== "string") return [];
			const filter = itemToFilter(rules, { field, operator, value });
			if (!filter || !staysInHistory(filter)) return [];
			const item = filterToItem(rules, filter, index);
			return item ? [{ index, item }] : [];
		});
	const quickFilterValues = (
		Array.isArray(raw.quickFilterValues) ? raw.quickFilterValues : []
	)
		.filter(isText)
		.slice(0, MAX_QUICK_FILTER_VALUES);
	return items.length > 0 || quickFilterValues.length > 0
		? { items, quickFilterValues }
		: undefined;
};
