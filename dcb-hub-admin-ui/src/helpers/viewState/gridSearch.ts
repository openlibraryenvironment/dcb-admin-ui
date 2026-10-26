import { paramName, VIEW_PARAMS } from "./urlViewCodec";

type ParamValue = string | number | string[];

/** A grid's parameters as they arrive: shapes only. useGridView reads them against the grid's columns. */
export interface GridSearch {
	filters?: string | string[];
	logic?: string;
	sort?: string;
	page?: number | string;
	pageSize?: number | string;
	hide?: string | string[];
	show?: string | string[];
}

/** A second grid's parameters, under its namespace: `secondary.filters`. */
export type NamespacedGridSearch = {
	[key: `${string}.${string}`]: ParamValue | undefined;
};

const MAX_REPEATS = 20;

const shape = (value: unknown): ParamValue | undefined => {
	if (typeof value === "string" || typeof value === "number") return value;
	if (!Array.isArray(value)) return undefined;
	const strings = value
		.filter((entry): entry is string => typeof entry === "string")
		.slice(0, MAX_REPEATS);
	return strings.length > 0 ? strings : undefined;
};

/**
 * For a route's `validateSearch`, beside the route's own parameters: the page's main grid, and
 * any other grid on the page by its namespace.
 */
export const validateGridSearch = (
	search: Record<string, unknown>,
	namespaces: readonly string[] = [],
): GridSearch & NamespacedGridSearch => {
	const valid: Record<string, ParamValue> = {};
	for (const namespace of [undefined, ...namespaces]) {
		for (const param of VIEW_PARAMS) {
			const key = paramName(param, namespace);
			const value = shape(search[key]);
			if (value !== undefined) valid[key] = value;
		}
	}
	return valid as GridSearch & NamespacedGridSearch;
};
