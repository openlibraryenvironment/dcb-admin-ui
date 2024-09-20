import React, { useEffect, useRef } from "react";
import { Box, TextField, useTheme } from "@mui/material";
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
