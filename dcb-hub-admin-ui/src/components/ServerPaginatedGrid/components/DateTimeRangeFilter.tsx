import {
	GridFilterInputValueProps,
	getGridDateOperators,
} from "@mui/x-data-grid-premium";
import { DateTimeRangePicker } from "@mui/x-date-pickers-pro/DateTimeRangePicker";
import { LocalizationProvider } from "@mui/x-date-pickers-pro/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers-pro/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { MultiInputDateTimeRangeField } from "@mui/x-date-pickers-pro/MultiInputDateTimeRangeField";
import { DateTimePicker } from "@mui/x-date-pickers-pro";

// For date time ranges
function DateRangeFilterInput(props: GridFilterInputValueProps) {
	const { item, applyValue, focusElementRef } = props;

	const [rawStart, rawEnd] = Array.isArray(item.value)
		? item.value
		: [null, null];
	const startDate = rawStart ? dayjs(rawStart) : null;
	const endDate = rawEnd ? dayjs(rawEnd) : null;

	const handleChange = (newValue: [Dayjs | null, Dayjs | null]) => {
		applyValue({ ...item, value: newValue });
	};

	// See if we can lift the provider up to app.tsx

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<DateTimeRangePicker
				value={[startDate, endDate]}
				onChange={handleChange}
				inputRef={focusElementRef}
				slots={{ field: MultiInputDateTimeRangeField }}
				// localeText={{
				//     start: t("ui.data_grid.filters.from"),
				//     end: t("ui.data_grid.filters.to"),
				// }}
				slotProps={{
					textField: {
						size: "small",
						variant: "standard",
						// helperText: t("ui.data_grid.filters.local_time"),
					},
					actionBar: { actions: ["clear", "nextOrAccept"] }, // can we add custom actions. today applies to both - maybe it's better to keep it separate?
				}}
			/>
		</LocalizationProvider>
	);
}

// For the "on or after" and "on or before" filters where a single value is the only one required.
function SingleDateFilterInput(props: GridFilterInputValueProps) {
	const { item, applyValue, focusElementRef } = props;

	const value = item.value ? dayjs(item.value) : null;

	const handleChange = (newValue: Dayjs | null) => {
		applyValue({ ...item, value: newValue });
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<DateTimePicker
				value={value}
				onChange={handleChange}
				inputRef={focusElementRef}
				slotProps={{
					textField: {
						size: "small",
						variant: "standard",
						helperText: "Local Time", // Needs translation key. and think about what else we can do here!
					},
					actionBar: { actions: ["clear", "today"] },
				}}
			/>
		</LocalizationProvider>
	);
}

// Defined as such, so that we know to translate the input into a format the backend will understand
export const luceneDateRangeOperators = [
	{
		label: "Between",
		value: "luceneDateRange",
		getApplyFilterFn: () => null,
		InputComponent: DateRangeFilterInput,
	},
	{
		label: "On or after",
		value: "onOrAfter",
		getApplyFilterFn: () => null,
		InputComponent: SingleDateFilterInput,
	},
	{
		label: "On or before",
		value: "onOrBefore",
		getApplyFilterFn: () => null,
		InputComponent: SingleDateFilterInput,
	},
	// Need to see which operators we actually want. Might be scope to include "is" as well.
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
			].includes(op.value),
	),
];

// LEGACY IMPLEMENTATION OF DATE TIME RANGE
// Preserved for if the new MUI X DateTimeRangePicker ever becomes unreliable or unavailable
// return (
// 	<LocalizationProvider dateAdapter={AdapterDayjs}>
// 		{/* <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}> */}
// 		<Stack direction="row" spacing={1}>
// 			<DateTimePicker
// 				label="From"
// 				value={startDate}
// 				onChange={handleStartChange}
// 				inputRef={focusElementRef}
// 				slots={{ field: MultiInputDateTimeRangeField }}
// 				slotProps={{
// 					textField: {
// 						size: "small",
// 						variant: "standard",
// 						helperText: "Local Time",
// 					},
// 					actionBar: { actions: ["clear", "today"] },
// 				}}
// 			/>
// 			<DateTimePicker
// 				label="To"
// 				value={endDate}
// 				onChange={handleEndChange}
// 				slots={{ field: MultiInputDateTimeRangeField }}
// 				slotProps={{
// 					textField: {
// 						size: "small",
// 						variant: "standard",
// 						helperText: "Local Time",
// 					},
// 					actionBar: { actions: ["clear", "today"] }, // Look at what else we can do with this
// 				}}
// 			/>
// 		</Stack>
// 	</LocalizationProvider>
// );
