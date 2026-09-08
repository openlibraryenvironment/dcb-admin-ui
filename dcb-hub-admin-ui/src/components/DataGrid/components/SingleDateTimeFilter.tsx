import { GridFilterInputValueProps } from "@mui/x-data-grid-premium";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers-pro";
import { AdapterDayjs } from "@mui/x-date-pickers-pro/AdapterDayjs";
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
					// Variant is left to the theme default (outlined) so this lines up
					// with the panel's column/operator selects.
					textField: { size: "small", fullWidth: true },
					actionBar: { actions: ["clear", "today"] }, // the data grid MIGHT auto translate this but check
				}}
			/>
		</LocalizationProvider>
	);
}
