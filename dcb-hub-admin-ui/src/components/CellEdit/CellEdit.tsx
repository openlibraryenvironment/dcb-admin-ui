import React, { useEffect, useRef, useState } from "react";
import {
	Autocomplete,
	Box,
	MenuItem,
	Select,
	TextField,
	useTheme,
} from "@mui/material";
import { GridRenderEditCellParams } from "@mui/x-data-grid-premium";
import { useLazyQuery } from "@apollo/client";
import { getRoles } from "src/queries/queries";
import { useTranslation } from "next-i18next";

export const CellEdit = (params: GridRenderEditCellParams) => {
	const { id, field, value, api, colDef, hasFocus } = params;
	const { t } = useTranslation();

	const theme = useTheme();
	const inputRef = useRef<HTMLInputElement>(null);
	const [selectedRole, setSelectedRole] = useState<any>(null);
	const [autocompleteLoading, setAutocompleteLoading] = useState(true);

	// Set initial value based on grid's existing value
	useEffect(() => {
		if (value) {
			setSelectedRole(
				typeof value === "object" && value.name ? value : { name: value },
			);
		}
	}, [value]);
	const [availableOptions, setAvailableOptions] = useState<any>([]);

	const [optionsData] = useLazyQuery(getRoles, {
		variables: {
			order: "name",
			orderBy: "ASC",
			pagesize: 100,
		},
		onCompleted: (data) => {
			setAvailableOptions(data?.roles?.content);
			setAutocompleteLoading(false);
		},
	});

	useEffect(() => {
		if (hasFocus) {
			inputRef.current?.focus();
		}
	}, [hasFocus]);
	if (colDef?.field === "role") {
		return (
			<Autocomplete
				options={availableOptions}
				loading={autocompleteLoading}
				value={selectedRole}
				onOpen={() => {
					optionsData();
				}}
				getOptionLabel={(option: any) => option?.displayName || value || ""}
				isOptionEqualToValue={(option, currentValue) =>
					option?.name === (currentValue?.name || currentValue)
				}
				onChange={(event, newValue) => {
					setSelectedRole(newValue);
					api.setEditCellValue({
						id,
						field,
						value: newValue || null,
						debounceMs: 100,
					});
				}}
				renderInput={(params) => (
					<TextField
						{...params}
						variant="outlined"
						fullWidth
						helperText={autocompleteLoading ? t("common.loading") : ""}
						inputProps={{
							...params.inputProps, // So we don't lose the previous input props
							"aria-label": "role-autocomplete",
						}}
					/>
				)}
				disableClearable
				fullWidth
			/>
		);
	}

	if (
		colDef?.type === "singleSelect" &&
		(colDef.field == "isPrimaryContact" || colDef.field == "enabled")
	) {
		return (
			<Box style={{ height: "100%", display: "flex", alignItems: "center" }}>
				<Select
					title={colDef?.field ?? "Select"}
					value={value.toString()}
					onChange={(event: any) => {
						api.setEditCellValue(
							{
								id,
								field,
								value: event.target.value === "true",
								debounceMs: 100,
							},
							event,
						);
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
				title={colDef?.field ?? "Data grid cell edit text field"}
				inputRef={inputRef}
				value={value}
				onChange={(event) => {
					api.setEditCellValue(
						{ id, field, value: event.target.value, debounceMs: 100 },
						event,
					);
				}}
				size="medium"
				variant="outlined"
				inputProps={{
					"aria-label": colDef?.headerName,
				}}
				fullWidth
				sx={{
					height: "100%",
					backgroundColor: theme.palette.primary.editableFieldBackground,
				}}
			/>
		</Box>
	);
};
