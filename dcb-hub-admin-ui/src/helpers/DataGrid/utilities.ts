import {
	GridFilterModel,
	GridSortDirection,
	GridSortModel,
} from "@mui/x-data-grid-premium";
import { buildFilterQuery } from "@helpers/dataGrid/buildFilterQuery";
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

export const generateFilterDescription = (model?: GridFilterModel): string => {
	if (!model || !model.items || model.items.length === 0) return "Filters";

	// Only count filters that actually have a value entered
	const validItems = model.items.filter(
		(item) =>
			item.value !== undefined && item.value !== null && item.value !== "",
	);

	if (validItems.length === 0) return "Filters";

	const logicOperator = model.logicOperator || "AND";

	const descriptions = validItems.map((item) => {
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
				val = `${formattedStart} ${i18n.t("general.and", { defaultValue: "and" })} ${formattedEnd}`;
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

		return `${item.field} ${operator} ${val}`;
	});

	return i18n.t("ui.data_grid.filters.active_description", {
		length: validItems.length,
		description: descriptions.join(` ${logicOperator.toUpperCase()} `),
	});
};
