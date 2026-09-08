import {
	GridColDef,
	GridFilterItem,
	GridFilterModel,
	GridPaginationModel,
	GridSortDirection,
	GridSortModel,
} from "@mui/x-data-grid-premium";
import { buildFilterQuery } from "@helpers/dataGrid/buildFilterQuery";
import {
	getExportHeaderMap,
	getValueLabelMaps,
} from "@helpers/dataGrid/getExportColumns";
import i18n from "@/i18n";
import dayjs from "dayjs";

export const processGridFilterModel = (
	model: GridFilterModel,
	baseQuery: string,
	quickFilterFields: string[] = [],
): string => {
	const { items, logicOperator = "AND", quickFilterValues = [] } = model;

	const columnFilterQueries = items
		.map((item) => buildFilterQuery(item.field, item.operator, item.value))
		.filter(Boolean);

	let finalQuery = "";
	if (columnFilterQueries.length > 0) {
		finalQuery = `(${columnFilterQueries.join(` ${logicOperator.toUpperCase()} `)})`;
	}
	if (quickFilterValues.length > 0 && quickFilterFields.length > 0) {
		const quickFilterQuery = quickFilterValues
			.map((val) => {
				// Create an OR condition for every field provided in quickFilterFields
				// To be refined into a "universal search" at some point
				const fieldSearches = quickFilterFields.map(
					(field) => `${field}:*${val}*`,
				);
				return `(${fieldSearches.join(" OR ")})`;
			})
			.join(" AND ");

		if (finalQuery) {
			finalQuery += ` AND (${quickFilterQuery})`;
		} else {
			finalQuery = quickFilterQuery;
		}
	}
	if (baseQuery) {
		return finalQuery ? `${baseQuery} AND (${finalQuery})` : baseQuery;
	}
	return finalQuery;
};

export const normalizeSortModel = (sortModel: GridSortModel): GridSortModel => {
	return sortModel.map((sort) => ({
		...sort,
		sort: sort.sort?.toUpperCase() === "ASC" ? "asc" : "desc",
	}));
};

export const getSortOrderForServer = (sortOrder: GridSortDirection): string => {
	return sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";
};

export interface ServerGridQueryVars {
	query: string;
	pageno: number;
	pagesize: number;
	order: string;
	orderBy: string;
}

interface ServerGridQueryOptions {
	filterModel: GridFilterModel;
	sortModel: GridSortModel;
	paginationModel: GridPaginationModel;
	/** Fallback sort field used when the user has not chosen a sort column. */
	defaultOrder: string;
	/** Base Lucene query ANDed with the user's column filters (e.g. a tab/status clause). */
	baseQuery?: string;
	/** Fields the toolbar quick-filter searches across. */
	quickFilterFields?: string[];
	/** Fallback page size, mirroring the grid's own default. */
	defaultPageSize?: number;
}

/**
 * Single builder for the `{ query, pageno, pagesize, order, orderBy }` variables
 * every server-driven grid sends to the backend. Centralised so a grid CANNOT
 * silently forget to fold its filter model into the query - the exact omission
 * that broke patron request filtering after the grid migration.
 */
export const buildServerGridQueryVars = ({
	filterModel,
	sortModel,
	paginationModel,
	defaultOrder,
	baseQuery = "",
	quickFilterFields = [],
	defaultPageSize = 25,
}: ServerGridQueryOptions): ServerGridQueryVars => ({
	query: processGridFilterModel(filterModel, baseQuery, quickFilterFields),
	pageno: paginationModel.page ?? 0,
	pagesize: paginationModel.pageSize ?? defaultPageSize,
	order: sortModel[0]?.field ?? defaultOrder,
	orderBy: getSortOrderForServer(sortModel[0]?.sort),
});

export const checkIfFiltering = (
	filterModel: GridFilterModel,
	debouncedFilterModel: GridFilterModel,
): boolean => {
	const hasActiveFilters =
		filterModel.items.some(
			(item) => item.value && item.value !== "" && item.value !== null,
		) ||
		(filterModel.quickFilterValues && filterModel.quickFilterValues.length > 0);

	// We're filtering if there are active filters but they don't match debounced filters
	const isDifferent =
		JSON.stringify(filterModel) !== JSON.stringify(debouncedFilterModel);
	return !!hasActiveFilters && isDifferent;
};

/** A filter item counts as active only once the user has entered a value. */
const hasFilterValue = (item: GridFilterItem): boolean =>
	item.value !== undefined && item.value !== null && item.value !== "";

/** The active column filters, ignoring half-built ones with no value yet. */
export const getActiveFilterItems = (
	model?: GridFilterModel,
): GridFilterItem[] => (model?.items ?? []).filter(hasFilterValue);

/**
 * Renders one filter item's operator and value for humans. Shared so that a file
 * name, and the export wizard's summary of what it is about to export, can never
 * describe the same filter two different ways.
 */
const formatFilterOperand = (
	item: GridFilterItem,
): { operator: string; value: string } => {
	let val = item.value;
	let operator = item.operator || "=";

	// Smart handling for date ranges
	if (operator === "luceneDateRange" && Array.isArray(val)) {
		const [start, end] = val;
		const hasStart = start !== null && start !== undefined && start !== "";
		const hasEnd = end !== null && end !== undefined && end !== "";
		const formattedStart = hasStart
			? dayjs(start).format("YYYY-MM-DD HH:mm")
			: "";
		const formattedEnd = hasEnd ? dayjs(end).format("YYYY-MM-DD HH:mm") : "";

		if (hasStart && hasEnd) {
			operator = i18n
				.t("ui.data_grid.filters.between", { defaultValue: "between" })
				.toLowerCase();
			val = `${formattedStart} ${i18n.t("ui.data_grid.filters.and")} ${formattedEnd}`;
		} else if (hasStart) {
			operator = i18n
				.t("ui.data_grid.filters.after", { defaultValue: "after" })
				.toLowerCase();
			val = `${formattedStart}`;
		} else if (hasEnd) {
			operator = i18n
				.t("ui.data_grid.filters.before", { defaultValue: "before" })
				.toLowerCase();
			val = `${formattedEnd}`;
		}
	} else {
		// Fallback for any other arrays or objects
		if (Array.isArray(val)) {
			val = `(${val.join(", ")})`;
		} else if (typeof val === "object") {
			val = JSON.stringify(val);
		}
	}

	return { operator, value: `${val}` };
};

export const generateFilterDescription = (model?: GridFilterModel): string => {
	if (!model || !model.items || model.items.length === 0) return "Filters";

	const validItems = getActiveFilterItems(model);
	if (validItems.length === 0) return "Filters";

	const logicOperator = model.logicOperator || "AND";

	const descriptions = validItems.map((item) => {
		const { operator, value } = formatFilterOperand(item);
		return `${item.field} ${operator} ${value}`;
	});

	return i18n.t("ui.data_grid.filters.active_description", {
		length: validItems.length,
		description: descriptions.join(` ${logicOperator.toUpperCase()} `),
	});
};

/**
 * One human-readable line per active filter, for the export wizard's summary of
 * the rows a "current filters" export will cover.
 *
 * Unlike generateFilterDescription (which names raw fields, and feeds file
 * names), this speaks the grid's language: column headers and the same
 * singleSelect labels the user picked, not the underlying codes.
 *
 * `quickFilterFields` mirrors processGridFilterModel: the toolbar search term
 * only narrows the query when the grid declares fields for it to search, so it
 * is only described when it will actually be applied.
 */
export const describeActiveFilters = (
	model: GridFilterModel | undefined,
	columns: GridColDef[],
	quickFilterFields: string[] = [],
): string[] => {
	if (!model) return [];

	const headers = getExportHeaderMap(columns);
	const labels = getValueLabelMaps(columns);

	const lines = getActiveFilterItems(model).map((item) => {
		const { operator, value } = formatFilterOperand(item);
		const header = headers[item.field] ?? item.field;
		// Only scalars carry a valueOptions label; ranges are already formatted.
		const isScalar =
			!Array.isArray(item.value) && typeof item.value !== "object";
		const labelled = isScalar
			? (labels[item.field]?.[String(item.value)] ?? value)
			: value;
		return `${header} ${operator} ${labelled}`;
	});

	const searchTerms = (model.quickFilterValues ?? []).filter(
		(term) => term !== undefined && term !== null && `${term}`.trim() !== "",
	);
	if (searchTerms.length > 0 && quickFilterFields.length > 0) {
		lines.push(
			i18n.t("ui.data_grid.export.filter_search", {
				terms: searchTerms.join(" "),
			}),
		);
	}

	return lines;
};
