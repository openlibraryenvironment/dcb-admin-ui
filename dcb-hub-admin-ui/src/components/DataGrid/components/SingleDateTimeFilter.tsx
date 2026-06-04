import { GridFilterInputValueProps } from "@mui/x-data-grid-premium";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import { useTranslation } from "react-i18next";

import dayjs, { Dayjs } from "dayjs";

// For the "on or after" and "on or before" filters where a single value is the only one required.
export default function SingleDateTimeFilter(props: GridFilterInputValueProps) {
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
						// helperText: "Local Time",// Should be unnecessary but do time zone testing
					},
					actionBar: { actions: ["clear", "today"] }, // the data grid MIGHT auto translate this but check
				}}
			/>
		</LocalizationProvider>
	);
}
