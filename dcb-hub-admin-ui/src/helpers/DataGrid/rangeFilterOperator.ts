import RangeFilter from "@components/ServerPaginatedGrid/components/RangeFilter";
import { GridFilterOperator } from "@mui/x-data-grid-premium";

export const betweenFilterOperator: GridFilterOperator = {
	label: "Between",
	value: "between",
	getApplyFilterFn: () => {
		return () => true;
	},
	InputComponent: RangeFilter,
};
