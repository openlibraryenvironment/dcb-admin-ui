import { GridFilterInputValueProps } from "@mui/x-data-grid-premium";
import { DateTimePicker } from "@mui/x-date-pickers-pro";
// import { useTranslation } from "react-i18next";

import dayjs, { Dayjs } from "dayjs";
import DateLocalization from "@components/DateLocalization/DateLocalization";

// For the "on or after" and "on or before" filters where a single value is the only one required.
export default function SingleDateTimeFilter(props: GridFilterInputValueProps) {
	const { item, applyValue, focusElementRef } = props;

	const value = item.value ? dayjs(item.value) : null;

	const handleChange = (newValue: Dayjs | null) => {
		applyValue({ ...item, value: newValue });
	};

	return (
		<DateLocalization>
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
		</DateLocalization>
	);
}
