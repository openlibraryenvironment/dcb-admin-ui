/**
 * The readable URL grammar for a view's state: filters, sort, page, page size and columns.
 *
 * Framework-free and identical in every front end that uses it; each app carries a copy, and
 * url-view-state-fixtures.json holds the cases every copy must pass. docs/url-view-state.md.
 *
 * It works on DECODED query values, as a router hands them over, so its separators survive the
 * router's own percent-decoding: a comma inside a value is escaped with a backslash, never as %2C.
 */

export const OPERATOR_WORDS = [
	"is",
	"not",
	"contains",
	"phrase",
	"notContains",
	"startsWith",
	"endsWith",
	"from",
	"to",
	"after",
	"before",
	"between",
	"min",
	"max",
	"over",
	"under",
	"empty",
	"notEmpty",
	"last30Days",
	"last90Days",
] as const;

export type OperatorWord = (typeof OPERATOR_WORDS)[number];

const OPERATORS = new Set<string>(OPERATOR_WORDS);
const NO_VALUE = new Set<OperatorWord>([
	"empty",
	"notEmpty",
	"last30Days",
	"last90Days",
]);

const MAX_FILTERS = 20;
const MAX_LIST_VALUES = 50;
const MAX_TEXT = 256;
const MAX_SORT_KEYS = 5;
const MAX_COLUMNS = 100;
const MAX_PAGE = 100_000;

const FIELD = /^[A-Za-z][\w.]*$/;

export const isFieldName = (field: string): boolean => FIELD.test(field);
const NAMESPACE = /^[a-z][A-Za-z0-9]*$/;
const RANGE = "..";

/**
 * One filter. `values` holds one value; several for `is` (any of); two for `between`, either
 * of which may be "" for an open end; none for `empty` and `notEmpty`.
 */
export interface UrlFilter {
	field: string;
	operator: OperatorWord;
	values: string[];
}

export interface UrlSort {
	field: string;
	direction: "asc" | "desc";
}

/** One aggregated column: `field:function`, the function by the grid's own name for it. */
export interface UrlAggregate {
	field: string;
	fn: string;
}

/** A view as the URL states it. Absent means the view's default. */
export interface UrlView {
	filters: UrlFilter[];
	logic?: "or";
	/** "none" is an explicitly unsorted view, distinct from the default sort. */
	sort?: UrlSort[] | "none";
	/** Zero-based, as grids count; written one-based. */
	page?: number;
	pageSize?: number;
	hide: string[];
	show: string[];
	/** Pinned to the left, then the right, in pinned order. */
	pinLeft?: string[];
	pinRight?: string[];
	/** The leading columns of the reader's order; the rest follow in the grid's default order. */
	order?: string[];
	/** "none" is an explicitly unaggregated view, distinct from the grid's default aggregation. */
	agg?: UrlAggregate[] | "none";
}

export const emptyView = (): UrlView => ({ filters: [], hide: [], show: [] });

/** The search keys a view's state occupies, under its namespace. */
export const VIEW_PARAMS = [
	"filters",
	"logic",
	"sort",
	"page",
	"pageSize",
	"hide",
	"show",
	"pinLeft",
	"pinRight",
	"order",
	"agg",
] as const;

export type ViewParam = (typeof VIEW_PARAMS)[number];

export const paramName = (param: ViewParam, namespace?: string): string => {
	if (namespace !== undefined && !NAMESPACE.test(namespace)) {
		throw new Error(`Not a view namespace: ${namespace}`);
	}
	return namespace ? `${namespace}.${param}` : param;
};

const isText = (value: unknown): value is string =>
	typeof value === "string" && value.length <= MAX_TEXT;

const escapeListValue = (value: string) =>
	value.replace(/\\/g, "\\\\").replace(/,/g, "\\,");

/** Splits on commas no backslash escapes, and unescapes each part. */
const splitList = (raw: string): string[] => {
	const parts: string[] = [];
	let current = "";
	for (let i = 0; i < raw.length; i++) {
		const char = raw[i];
		if (char === "\\" && i + 1 < raw.length) {
			current += raw[++i];
		} else if (char === ",") {
			parts.push(current);
			current = "";
		} else {
			current += char;
		}
	}
	parts.push(current);
	return parts;
};

const sameFilter = (a: UrlFilter, b: UrlFilter) =>
	a.field === b.field &&
	a.operator === b.operator &&
	a.values.length === b.values.length &&
	a.values.every((value, index) => value === b.values[index]);

const validValues = (operator: OperatorWord, values: string[]) => {
	if (!values.every(isText)) return false;
	if (NO_VALUE.has(operator)) return values.length === 0;
	if (operator === "between") {
		return (
			values.length === 2 &&
			values.some((bound) => bound !== "") &&
			values.every((bound) => !bound.includes(RANGE))
		);
	}
	if (operator === "is") {
		return (
			values.length > 0 &&
			values.length <= MAX_LIST_VALUES &&
			values.every((value) => value !== "")
		);
	}
	return values.length === 1 && values[0] !== "";
};

/** `field[:operator]:value`, or null when the text is not a filter this grammar can state. */
export const decodeFilter = (raw: unknown): UrlFilter | null => {
	if (typeof raw !== "string" || raw.length > MAX_TEXT * 4) return null;
	const colon = raw.indexOf(":");
	if (colon <= 0) return null;
	const field = raw.slice(0, colon);
	if (!FIELD.test(field)) return null;
	const rest = raw.slice(colon + 1);

	let operator: OperatorWord = "is";
	let value = rest;
	if (NO_VALUE.has(rest as OperatorWord)) {
		operator = rest as OperatorWord;
		value = "";
	} else {
		const next = rest.indexOf(":");
		const word = next > 0 ? rest.slice(0, next) : "";
		if (OPERATORS.has(word) && !NO_VALUE.has(word as OperatorWord)) {
			operator = word as OperatorWord;
			value = rest.slice(next + 1);
		}
	}

	let values: string[];
	if (NO_VALUE.has(operator)) values = [];
	else if (operator === "between") {
		const at = value.indexOf(RANGE);
		values = at < 0 ? [] : [value.slice(0, at), value.slice(at + RANGE.length)];
	} else if (operator === "is") values = splitList(value);
	else values = [value];

	const filter = { field, operator, values };
	return validValues(operator, values) ? filter : null;
};

/**
 * The shortest text that decodes back to this filter: the operator is left out for equality,
 * and written as `is` only when leaving it out would read as something else.
 */
export const encodeFilter = (filter: UrlFilter): string | null => {
	if (
		!FIELD.test(filter.field) ||
		!validValues(filter.operator, filter.values)
	) {
		return null;
	}
	const { field, operator, values } = filter;
	if (NO_VALUE.has(operator)) return `${field}:${operator}`;
	if (operator === "between") {
		return `${field}:between:${values[0]}${RANGE}${values[1]}`;
	}
	if (operator === "is") {
		const list = values.map(escapeListValue).join(",");
		const bare = `${field}:${list}`;
		const decoded = decodeFilter(bare);
		return decoded && sameFilter(decoded, filter)
			? bare
			: `${field}:is:${list}`;
	}
	return `${field}:${operator}:${values[0]}`;
};

/** `field:asc,other:desc`, `none`, or null. */
export const decodeSort = (raw: unknown): UrlSort[] | "none" | null => {
	if (typeof raw !== "string" || raw === "") return null;
	if (raw === "none") return "none";
	const keys = raw.split(",");
	if (keys.length > MAX_SORT_KEYS) return null;
	const sort: UrlSort[] = [];
	for (const key of keys) {
		const [field, direction, ...rest] = key.split(":");
		if (
			rest.length > 0 ||
			!FIELD.test(field ?? "") ||
			(direction !== "asc" && direction !== "desc")
		) {
			return null;
		}
		sort.push({ field, direction });
	}
	return sort;
};

export const encodeSort = (sort: UrlSort[] | "none"): string =>
	sort === "none"
		? "none"
		: sort.map(({ field, direction }) => `${field}:${direction}`).join(",");

const toInteger = (raw: unknown): number | null => {
	const number =
		typeof raw === "number"
			? raw
			: typeof raw === "string" && /^\d{1,6}$/.test(raw)
				? Number(raw)
				: NaN;
	return Number.isSafeInteger(number) ? number : null;
};

/**
 * A page from the URL, zero-based. The URL is one-based; a link written before that change is
 * zero-based, and `legacy` says the caller recognised one.
 */
export const decodePage = (
	raw: unknown,
	legacy = false,
): number | undefined => {
	const page = toInteger(raw);
	if (page === null || page > MAX_PAGE) return undefined;
	const zeroBased = legacy ? page : page - 1;
	return zeroBased >= 0 ? zeroBased : undefined;
};

/** The URL's one-based page, or undefined for the first page, which is never written. */
export const encodePage = (zeroBased: number): string | undefined =>
	Number.isSafeInteger(zeroBased) && zeroBased > 0 && zeroBased <= MAX_PAGE
		? String(zeroBased + 1)
		: undefined;

export const decodePageSize = (raw: unknown): number | undefined => {
	const size = toInteger(raw);
	return size !== null && size > 0 ? size : undefined;
};

const decodeFieldList = (raw: unknown): string[] => {
	const text = Array.isArray(raw) ? raw.join(",") : raw;
	if (typeof text !== "string" || text === "") return [];
	return [
		...new Set(text.split(",").filter((field) => FIELD.test(field))),
	].slice(0, MAX_COLUMNS);
};

const AGGREGATE_FN = /^[a-z][A-Za-z]*$/;

/** `field:fn,other:fn`, `none`, or null. */
export const decodeAggregation = (
	raw: unknown,
): UrlAggregate[] | "none" | null => {
	if (typeof raw !== "string" || raw === "") return null;
	if (raw === "none") return "none";
	const entries = raw.split(",");
	if (entries.length > MAX_COLUMNS) return null;
	const aggregates: UrlAggregate[] = [];
	for (const entry of entries) {
		const [field, fn, ...rest] = entry.split(":");
		if (
			rest.length > 0 ||
			!FIELD.test(field ?? "") ||
			!AGGREGATE_FN.test(fn ?? "") ||
			aggregates.some((aggregate) => aggregate.field === field)
		) {
			return null;
		}
		aggregates.push({ field, fn });
	}
	return aggregates;
};

export const encodeAggregation = (agg: UrlAggregate[] | "none"): string =>
	agg === "none"
		? "none"
		: agg.map(({ field, fn }) => `${field}:${fn}`).join(",");

const asList = (raw: unknown): unknown[] =>
	raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];

/**
 * A view from a router's search object. What cannot be read is left out rather than thrown, so a
 * hand-edited link opens with its valid part. Old forms are not this function's business: the
 * caller recognises them, and passes `legacyPage` when it has.
 */
export const decodeView = (
	search: Readonly<Record<string, unknown>>,
	namespace?: string,
	legacyPage = false,
): UrlView => {
	const get = (param: ViewParam) => search[paramName(param, namespace)];
	const view = emptyView();

	view.filters = asList(get("filters"))
		.slice(0, MAX_FILTERS)
		.map(decodeFilter)
		.filter((filter): filter is UrlFilter => filter !== null);
	if (get("logic") === "or") view.logic = "or";

	const sort = decodeSort(get("sort"));
	if (sort !== null) view.sort = sort;

	const page = decodePage(get("page"), legacyPage);
	if (page !== undefined) view.page = page;
	const pageSize = decodePageSize(get("pageSize"));
	if (pageSize !== undefined) view.pageSize = pageSize;

	view.hide = decodeFieldList(get("hide"));
	view.show = decodeFieldList(get("show")).filter(
		(field) => !view.hide.includes(field),
	);

	const pinLeft = decodeFieldList(get("pinLeft"));
	if (pinLeft.length) view.pinLeft = pinLeft;
	const pinRight = decodeFieldList(get("pinRight")).filter(
		(field) => !pinLeft.includes(field),
	);
	if (pinRight.length) view.pinRight = pinRight;
	const order = decodeFieldList(get("order"));
	if (order.length) view.order = order;
	const agg = decodeAggregation(get("agg"));
	if (agg !== null) view.agg = agg;
	return view;
};

/**
 * A view as search entries, only what it states: an empty view writes nothing. A filter the
 * grammar cannot state is dropped, as decodeView would drop it.
 */
export const encodeView = (
	view: UrlView,
	namespace?: string,
): Record<string, string | number | string[]> => {
	const search: Record<string, string | number | string[]> = {};
	const set = (
		param: ViewParam,
		value: string | number | string[] | undefined,
	) => {
		if (value === undefined || (Array.isArray(value) && value.length === 0))
			return;
		search[paramName(param, namespace)] = value;
	};

	set(
		"filters",
		view.filters
			.slice(0, MAX_FILTERS)
			.map(encodeFilter)
			.filter((filter): filter is string => filter !== null),
	);
	if (view.logic === "or") set("logic", "or");
	if (view.sort !== undefined) {
		set(
			"sort",
			view.sort === "none" || view.sort.length
				? encodeSort(view.sort)
				: undefined,
		);
	}
	if (view.page !== undefined) {
		const page = encodePage(view.page);
		if (page !== undefined) set("page", Number(page));
	}
	if (view.pageSize !== undefined) set("pageSize", view.pageSize);
	if (view.hide.length) set("hide", view.hide.join(","));
	if (view.show.length) set("show", view.show.join(","));
	if (view.pinLeft?.length) set("pinLeft", view.pinLeft.join(","));
	if (view.pinRight?.length) set("pinRight", view.pinRight.join(","));
	if (view.order?.length) set("order", view.order.join(","));
	if (view.agg !== undefined && (view.agg === "none" || view.agg.length)) {
		set("agg", encodeAggregation(view.agg));
	}
	return search;
};
