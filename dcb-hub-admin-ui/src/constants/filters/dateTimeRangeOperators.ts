import DateTimeRangeFilter from "@components/DataGrid/components/DateTimeRangeFilter";
import SingleDateTimeFilter from "@components/DataGrid/components/SingleDateTimeFilter";
import { getGridDateOperators } from "@mui/x-data-grid-premium";
import { t } from "i18next";

export const dateTimeRangeOperators = [
	{
		label: t("ui.data_grid.filters.between"),
		value: "luceneDateRange",
		getApplyFilterFn: () => null,
		InputComponent: DateTimeRangeFilter,
	},
	{
		label: t("ui.data_grid.filters.on_or_after"),
		value: "onOrAfter",
		getApplyFilterFn: () => null,
		InputComponent: SingleDateTimeFilter,
	},
	{
		label: t("ui.data_grid.filters.on_or_before"),
		value: "onOrBefore",
		getApplyFilterFn: () => null,
		InputComponent: SingleDateTimeFilter,
	},
	{
		label: t("ui.data_grid.filters.last_thirty_days"),
		value: "last30Days",
		getApplyFilterFn: () => null,
	},
	{
		label: t("ui.data_grid.filters.last_ninety_days"),
		value: "last90Days",
		getApplyFilterFn: () => null,
	},
	...getGridDateOperators().filter(
		(op) =>
			![
				"is",
				"not",
				"after",
				"onOrAfter",
				"before",
				"onOrBefore",
				"isEmpty",
				"isNotEmpty",
			].includes(op.value)
	),
];
