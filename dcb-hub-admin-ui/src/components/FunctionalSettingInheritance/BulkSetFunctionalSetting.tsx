import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Alert,
	Autocomplete,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	FormControl,
	FormControlLabel,
	FormLabel,
	MenuItem,
	Radio,
	RadioGroup,
	Stack,
	TextField,
} from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import {
	libraryOptionsQuery,
	type LibraryAutocompleteOption,
} from "@/queryOptions/libraries";
import {
	revertFunctionalSettingToInherited,
	setFunctionalSettingAtScopes,
} from "@mutations/functionalSettingScopes";
import { SETTING_LABEL_KEYS } from "@constants/functionalSettings";
import type {
	SetFunctionalSettingAtScopesMutation,
	SetFunctionalSettingAtScopesMutationVariables,
	RevertFunctionalSettingToInheritedMutation,
	RevertFunctionalSettingToInheritedMutationVariables,
} from "@generated/graphql";

/**
 * Revert sits beside set because writing the parent's value into each library is not the
 * same as inheriting it: a library that chose and one that never chose become
 * indistinguishable, and the parent's next change is silently wrong for one of them.
 *
 * The reason is required here but generated for a single toggle: a bulk change is the one
 * somebody will need to account for later, and the audit rows carry this text.
 */
export interface BulkSetFunctionalSettingProps {
	open: boolean;
	onClose: () => void;
}

/** The scale constant dcb-service enforces; refused above it, so say so before sending. */
const MAX_LIBRARIES = 500;

export default function BulkSetFunctionalSetting({
	open,
	onClose,
}: BulkSetFunctionalSettingProps) {
	const { t } = useTranslation();
	const client = useGraphQLClient();
	const queryClient = useQueryClient();
	const titleId = useId();
	const modeLabelId = useId();

	const [name, setName] = useState<string>("PICKUP_ANYWHERE");
	const [mode, setMode] = useState<"enable" | "disable" | "inherit">("enable");
	const [libraries, setLibraries] = useState<LibraryAutocompleteOption[]>([]);
	const [reason, setReason] = useState("");
	const [lastResult, setLastResult] = useState<{
		changed: number;
		asked: number;
	} | null>(null);

	const libraryOptions = useQuery(libraryOptionsQuery(client));

	const scopeIds = libraries
		.map((library) => library.id)
		.filter((id): id is string => Boolean(id));

	const tooMany = scopeIds.length > MAX_LIBRARIES;
	const ready = scopeIds.length > 0 && reason.trim().length > 0 && !tooMany;

	const apply = useMutation({
		mutationFn: async (): Promise<number> => {
			const input = {
				scopeType: "LIBRARY",
				scopeIds,
				name: name as never,
				reason: reason.trim(),
				changeCategory: "Functional setting",
			};

			if (mode === "inherit") {
				const result = await client.request<
					RevertFunctionalSettingToInheritedMutation,
					RevertFunctionalSettingToInheritedMutationVariables
				>(revertFunctionalSettingToInherited(), { input });

				return result.revertFunctionalSettingToInherited.changed;
			}

			const result = await client.request<
				SetFunctionalSettingAtScopesMutation,
				SetFunctionalSettingAtScopesMutationVariables
			>(setFunctionalSettingAtScopes(), {
				input: { ...input, enabled: mode === "enable" },
			});

			return result.setFunctionalSettingAtScopes.changed;
		},
		onSuccess: async (changed) => {
			// What actually moved, not what was asked for. A revert names libraries that may
			// have had no override, and "reverted 12 of 40" is the difference between a
			// report and a receipt.
			setLastResult({ changed, asked: scopeIds.length });
			setLibraries([]);
			// Every affected library's panel is now stale, and nothing else is. The prefix
			// matches this scope type's entries only, so the consortium grid above is left
			// alone.
			await queryClient.invalidateQueries({
				queryKey: ["resolvedFunctionalSettings", "LIBRARY"],
			});
		},
	});

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullWidth
			maxWidth="sm"
			aria-labelledby={titleId}
		>
			<DialogTitle id={titleId}>{t("settings_inheritance.bulk.title")}</DialogTitle>
			<DialogContent>
				<DialogContentText sx={{ mb: 2 }}>
					{t("settings_inheritance.bulk.introduction")}
				</DialogContentText>

				{lastResult ? (
					<Alert severity="success" role="status" sx={{ mb: 2 }}>
						{t("settings_inheritance.bulk.applied", {
							changed: lastResult.changed,
							asked: lastResult.asked,
						})}
					</Alert>
				) : null}

				{apply.isError ? (
					<Alert severity="error" sx={{ mb: 2 }}>
						{String(apply.error)}
					</Alert>
				) : null}

				<Stack spacing={3} sx={{ mt: 1 }}>
					<TextField
						select
						label={t("consortium.settings.one")}
						value={name}
						onChange={(event) => setName(event.target.value)}
					>
						{Object.entries(SETTING_LABEL_KEYS).map(([value, labelKey]) => (
							<MenuItem key={value} value={value}>
								{t(labelKey)}
							</MenuItem>
						))}
					</TextField>

					<FormControl>
						<FormLabel id={modeLabelId}>
							{t("settings_inheritance.bulk.what")}
						</FormLabel>
						<RadioGroup
							aria-labelledby={modeLabelId}
							value={mode}
							onChange={(event) =>
								setMode(event.target.value as "enable" | "disable" | "inherit")
							}
						>
							<FormControlLabel
								value="enable"
								control={<Radio />}
								label={t("settings_inheritance.bulk.enable")}
							/>
							<FormControlLabel
								value="disable"
								control={<Radio />}
								label={t("settings_inheritance.bulk.disable")}
							/>
							<FormControlLabel
								value="inherit"
								control={<Radio />}
								label={t("settings_inheritance.bulk.inherit")}
							/>
						</RadioGroup>
					</FormControl>

					<Autocomplete
						multiple
						options={libraryOptions.data ?? []}
						value={libraries}
						loading={libraryOptions.isLoading}
						onChange={(_event, chosen) => setLibraries(chosen)}
						isOptionEqualToValue={(option, value) => option.id === value.id}
						renderInput={(params) => (
							<TextField
								{...params}
								label={t("settings_inheritance.bulk.libraries")}
								helperText={
									tooMany
										? t("settings_inheritance.bulk.too_many", { max: MAX_LIBRARIES })
										: t("settings_inheritance.bulk.libraries_help")
								}
								error={tooMany}
								required
							/>
						)}
					/>

					<TextField
						label={t("settings_inheritance.bulk.reason")}
						helperText={t("settings_inheritance.bulk.reason_help")}
						value={reason}
						onChange={(event) => setReason(event.target.value)}
						slotProps={{ htmlInput: { maxLength: 100 } }}
						required
					/>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>
					{lastResult ? t("ui.actions.close") : t("ui.actions.cancel")}
				</Button>
				<Button
					variant="contained"
					disabled={!ready || apply.isPending}
					onClick={() => apply.mutate()}
				>
					{t("settings_inheritance.bulk.apply", { count: scopeIds.length })}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
