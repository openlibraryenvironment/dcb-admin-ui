import Box from "@mui/material/Box";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import { GridFilterInputValueProps, useGridRootProps } from "@mui/x-data-grid";
import { useEffect, useRef, useState } from "react";
import { CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
	getRangeLabels,
	getRangePlaceholders,
} from "@helpers/dataGrid/getRangeLabels";

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

	// Re-sync the local filter value from the incoming filter item during render
	// (when it changes) rather than via an effect.
	const [prevItemValue, setPrevItemValue] = useState(item.value);
	if (item.value !== prevItemValue) {
		setPrevItemValue(item.value);
		setFilterValueState(item.value ?? ["", ""]);
	}

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

	// Variant is left to the theme default (outlined) to match the panel's own
	// inputs. The previous hand-tuned height/padding box was aligning this
	// against a standard-variant panel that no longer exists.
	return (
		<Box sx={{ display: "flex", flexDirection: "row", gap: 2, width: "100%" }}>
			<TextField
				name="lower-bound-input"
				placeholder={fromPlaceholder}
				label={fromLabel}
				size="small"
				fullWidth
				value={filterValueState[0] ?? ""}
				onChange={handleLowerFilterChange}
				type="number"
				inputRef={focusElementRef}
			/>
			<TextField
				name="upper-bound-input"
				placeholder={toPlaceholder}
				label={toLabel}
				size="small"
				fullWidth
				value={filterValueState[1] ?? ""}
				onChange={handleUpperFilterChange}
				type="number"
				slotProps={{
					input: applying
						? { endAdornment: <CircularProgress size={20} /> }
						: {},
				}}
			/>
		</Box>
	);
}
