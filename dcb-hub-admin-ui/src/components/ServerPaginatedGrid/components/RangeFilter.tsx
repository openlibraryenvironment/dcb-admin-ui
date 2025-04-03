import Box from "@mui/material/Box";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import { GridFilterInputValueProps, useGridRootProps } from "@mui/x-data-grid";
import { useEffect, useRef, useState } from "react";
import { CircularProgress } from "@mui/material";
import { useTranslation } from "next-i18next";
import {
	getRangeLabels,
	getRangePlaceholders,
} from "src/helpers/DataGrid/getRangeLabels";

export default function RangeFilter(props: GridFilterInputValueProps) {
	const rootProps = useGridRootProps(); // warning about this line not sure why
	// Should also prevent less than 0
	const { item, applyValue, focusElementRef = null } = props;
	const { t } = useTranslation();

	const labels = getRangeLabels(item.field ?? "");
	const placeholders = getRangePlaceholders(item.field ?? "");
	const fromLabel = t(labels.from);
	const toLabel = t(labels.to);
	const fromPlaceholder = t(placeholders.from);
	const toPlaceholder = t(placeholders.to);

	const filterTimeout = useRef<any>(undefined);

	const [filterValueState, setFilterValueState] = useState<[string, string]>(
		item.value ?? ["", ""],
	);
	const [applying, setIsApplying] = useState(false);

	useEffect(() => {
		return () => {
			clearTimeout(filterTimeout.current);
		};
	}, []);

	useEffect(() => {
		const itemValue = item.value ?? ["", ""];
		setFilterValueState(itemValue);
	}, [item.value]);

	const updateFilterValue = (lowerBound: string, upperBound: string) => {
		clearTimeout(filterTimeout.current);
		setFilterValueState([lowerBound, upperBound]);

		setIsApplying(true);
		filterTimeout.current = setTimeout(() => {
			setIsApplying(false);

			applyValue({
				...item,
				value: [lowerBound, upperBound],
			});
		}, rootProps.filterDebounceMs);
	};

	const handleUpperFilterChange: TextFieldProps["onChange"] = (event) => {
		const newUpperBound = event.target.value;
		updateFilterValue(filterValueState[0], newUpperBound);
	};

	const handleLowerFilterChange: TextFieldProps["onChange"] = (event) => {
		const newLowerBound = event.target.value;
		updateFilterValue(newLowerBound, filterValueState[1]);
	};

	return (
		<Box
			sx={{
				display: "inline-flex",
				flexDirection: "row",
				alignItems: "end",
				height: 48,
				pl: "20px",
			}}
		>
			<TextField
				name="lower-bound-input"
				placeholder={fromPlaceholder}
				label={fromLabel}
				variant="standard"
				value={filterValueState[0] ?? ""}
				onChange={handleLowerFilterChange}
				type="number"
				inputRef={focusElementRef}
				sx={{ mr: 2 }}
			/>
			<TextField
				name="upper-bound-input"
				placeholder={toPlaceholder}
				label={toLabel}
				variant="standard"
				value={filterValueState[1] ?? ""}
				onChange={handleUpperFilterChange}
				type="number"
				InputProps={
					applying ? { endAdornment: <CircularProgress size={"sm"} /> } : {}
				}
			/>
		</Box>
	);
}
