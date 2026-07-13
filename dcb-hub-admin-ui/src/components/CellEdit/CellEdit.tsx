import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	GridRenderEditCellParams,
	useGridApiContext,
} from "@mui/x-data-grid-premium";
import {
	Autocomplete,
	Box,
	MenuItem,
	Select,
	TextField,
	SelectChangeEvent,
} from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getRoles } from "@queries/getRoles";

interface RoleOption {
	name: string;
	displayName?: string;
}

export const CellEdit = (params: GridRenderEditCellParams) => {
	const { id, field, value, colDef, hasFocus } = params;
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();

	// MUI V7 standard: retrieve mutable grid control reference via context
	const apiRef = useGridApiContext();
	const inputRef = useRef<HTMLInputElement>(null);

	const roleFromValue = (v: unknown): RoleOption | undefined =>
		v
			? typeof v === "object" && "name" in v
				? (v as RoleOption)
				: { name: String(v) }
			: undefined;

	// Derive the edit buffer from the incoming cell value, adjusting it during
	// render when the value changes rather than syncing via an effect.
	const [selectedRole, setSelectedRole] = useState<RoleOption | undefined>(() =>
		roleFromValue(value),
	);
	const [prevValue, setPrevValue] = useState(value);
	if (value !== prevValue) {
		setPrevValue(value);
		if (value) {
			setSelectedRole(roleFromValue(value));
		}
	}
	const [shouldFetchRoles, setShouldFetchRoles] = useState(false);

	useEffect(() => {
		if (hasFocus) {
			inputRef.current?.focus();
		}
	}, [hasFocus]);

	// Modernized role lookup using TanStack Query instead of Apollo GraphQL
	const { data: optionsData, isLoading: autocompleteLoading } = useQuery({
		queryKey: ["availableGridRoles"],
		queryFn: async () => {
			const response = await gqlClient.request<{
				roles: { content: RoleOption[] };
			}>(getRoles, {
				order: "name",
				orderBy: "ASC",
				pagesize: 100,
			});
			return response?.roles?.content || [];
		},
		enabled: shouldFetchRoles,
	});

	if (colDef?.field === "role") {
		return (
			<Autocomplete
				options={optionsData || []}
				loading={autocompleteLoading && shouldFetchRoles}
				value={selectedRole}
				// value={selectedRole ?? undefined}
				onOpen={() => setShouldFetchRoles(true)}
				getOptionLabel={(option: RoleOption) =>
					option?.displayName || option?.name || ""
				}
				isOptionEqualToValue={(option, currentValue) =>
					option?.name === (currentValue?.name || currentValue)
				}
				onChange={(_event, newValue) => {
					setSelectedRole(newValue);
					apiRef.current.setEditCellValue({
						id,
						field,
						value: newValue || null,
					});
				}}
				renderInput={(inputParams) => (
					<TextField
						{...inputParams}
						variant="outlined"
						fullWidth
						helperText={
							autocompleteLoading && shouldFetchRoles ? t("common.loading") : ""
						}
						slotProps={{
							...inputParams.slotProps,

							htmlInput: {
								...inputParams.slotProps.htmlInput,
								"aria-label": "role-autocomplete",
							},
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
		(colDef.field === "isPrimaryContact" || colDef.field === "enabled")
	) {
		const selectValue =
			value !== undefined && value !== null ? value.toString() : "false";

		return (
			<Box
				sx={{
					height: "100%",
					width: "100%",
					display: "flex",
					alignItems: "center",
				}}
			>
				<Select
					title={colDef?.field ?? "Select"}
					value={selectValue}
					onChange={(event: SelectChangeEvent<string>) => {
						apiRef.current.setEditCellValue({
							id,
							field,
							value: event.target.value === "true",
						});
					}}
					fullWidth
					inputProps={{ "aria-label": colDef?.headerName }}
					sx={{
						height: "100%",
						backgroundColor: "primary.editableFieldBackground",
					}}
				>
					<MenuItem value="true">{t("ui.actions.yes")}</MenuItem>
					<MenuItem value="false">{t("ui.actions.no")}</MenuItem>
				</Select>
			</Box>
		);
	}

	return (
		<Box
			sx={{
				height: "100%",
				width: "100%",
				display: "flex",
				alignItems: "center",
			}}
		>
			<TextField
				title={colDef?.field ?? "Data grid cell edit text field"}
				inputRef={inputRef}
				value={value || ""}
				onChange={(event) => {
					apiRef.current.setEditCellValue({
						id,
						field,
						value: event.target.value,
					});
				}}
				size="medium"
				variant="outlined"
				fullWidth
				sx={{
					height: "100%",
					backgroundColor: "primary.editableFieldBackground",
				}}
				slotProps={{
					htmlInput: { "aria-label": colDef?.headerName },
				}}
			/>
		</Box>
	);
};
