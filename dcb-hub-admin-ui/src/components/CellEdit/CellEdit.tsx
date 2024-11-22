import React, { useEffect, useRef } from "react";
import { Box, MenuItem, Select, TextField, useTheme } from "@mui/material";
import { GridRenderEditCellParams } from "@mui/x-data-grid-pro";

export const CellEdit = (params: GridRenderEditCellParams) => {
	const { id, field, value, api, colDef, hasFocus } = params;
	const theme = useTheme();
	const inputRef = useRef<HTMLInputElement>(null);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = event.target.value;
		api.setEditCellValue(
			{ id, field, value: newValue, debounceMs: 100 },
			event,
		);
	};

	useEffect(() => {
		if (hasFocus) {
			inputRef.current?.focus();
		}
	}, [hasFocus]);

	if (colDef?.type === "singleSelect") {
		return (
			<Box style={{ height: "100%", display: "flex", alignItems: "center" }}>
				<Select
					value={value.toString()} // Convert boolean to string
					onChange={(event: any) => {
						// Convert string back to boolean
						handleChange({
							...event,
							target: {
								...event.target,
								value: event.target.value === "true",
							},
						});
					}}
					fullWidth
					inputProps={{
						"aria-label": colDef?.headerName,
					}}
					sx={{
						height: "100%",
						backgroundColor: theme.palette.primary.editableFieldBackground,
					}}
				>
					<MenuItem value="true">Yes</MenuItem>
					<MenuItem value="false">No</MenuItem>
				</Select>
			</Box>
		);
	}

	return (
		<Box
			style={{
				height: "100%",
				display: "flex",
				alignItems: "center",
			}}
		>
			<TextField
				inputRef={inputRef}
				value={value}
				onChange={handleChange}
				size="medium"
				aria-labelledby={colDef?.headerName}
				variant="outlined"
				fullWidth
				inputProps={{
					"aria-label": colDef?.headerName,
				}}
				sx={{
					height: "100%",
					backgroundColor: theme.palette.primary.editableFieldBackground,
					"& .MuiOutlinedInput-root": {
						height: "100%",
						"& fieldset": {
							borderColor: theme.palette.primary.main,
						},
						"&:hover fieldset": {
							borderColor: theme.palette.primary.dark,
						},
						"&.Mui-focused fieldset": {
							borderColor: theme.palette.primary.main,
						},
					},
				}}
			/>
		</Box>
	);
};
