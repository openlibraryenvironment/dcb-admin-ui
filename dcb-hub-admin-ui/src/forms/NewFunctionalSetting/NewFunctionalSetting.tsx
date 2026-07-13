import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller, Resolver } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import {
	Autocomplete,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	FormHelperText,
	InputLabel,
	MenuItem,
	Select,
	TextField,
} from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { addFunctionalSettingMutation } from "@mutations/addFunctionalSetting";
import type {
	AddFunctionalSettingMutationVariables,
	FunctionalSettingType,
} from "@generated/graphql";

// Typed against the schema enum rather than left as a bare string[], so that a value
// added, removed or renamed in schema.graphqls fails the build here instead of being
// rejected at runtime by the server.
const FUNCTIONAL_SETTING_TYPES: FunctionalSettingType[] = [
	"OWN_LIBRARY_BORROWING",
	"PICKUP_ANYWHERE",
	"RE_RESOLUTION",
	"SELECT_UNAVAILABLE_ITEMS",
	"TRIGGER_SUPPLIER_RENEWAL",
	"DENY_LIBRARY_MAPPING_EDIT",
	"VIRTUAL_PATRON_NAMES_VISIBLE",
	"VIRTUAL_PATRON_NAMES_POLARIS",
];

interface NewFunctionalSettingFormData {
	description: string;
	// null until the user picks one; yup's .required() enforces it on submit.
	name: FunctionalSettingType | null;
	enabled: boolean;
	reason?: string;
	changeCategory?: string;
	changeReferenceUrl?: string;
}

type NewFunctionalSettingType = {
	show: boolean;
	onClose: () => void;
	consortiumDisplayName: string;
	consortiumName: string;
};

export default function NewFunctionalSetting({
	show,
	onClose,
	consortiumDisplayName,
	consortiumName,
}: NewFunctionalSettingType) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();

	const [alert, setAlert] = useState<{
		open: boolean;
		severity: "success" | "error";
		text: string | null;
	}>({
		open: false,
		severity: "success",
		text: null,
	});

	const validationSchema = Yup.object().shape({
		description: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", {
					field: t("consortium.settings.description"),
				}),
			)
			.max(128, t("ui.validation.max_length", { length: 128 })),
		name: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", { field: t("consortium.settings.name") }),
			)
			.max(128, t("ui.validation.max_length", { length: 128 })),
		enabled: Yup.boolean().required(
			t("ui.validation.required", { field: t("consortium.settings.enabled") }),
		),
	});

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isValid, isDirty },
		register,
	} = useForm<NewFunctionalSettingFormData>({
		defaultValues: {
			description: "",
			name: null,
			enabled: false,
			reason: "",
			changeCategory: "",
			changeReferenceUrl: "",
		},
		// yup infers `name` as a plain string, which no longer unifies with the schema
		// enum on the form type. The shapes match at runtime; pin it to the form type.
		resolver: yupResolver(
			validationSchema,
		) as unknown as Resolver<NewFunctionalSettingFormData>,
		mode: "onChange",
	});

	const settingMutation = useMutation({
		mutationFn: async ({
			name,
			...rest
		}: NewFunctionalSettingFormData & { name: FunctionalSettingType }) => {
			return gqlClient.request<any, AddFunctionalSettingMutationVariables>(
				addFunctionalSettingMutation,
				{ input: { ...rest, name, consortiumName } },
			);
		},
		onSuccess: (responseData) => {
			if (responseData) {
				queryClient.invalidateQueries({
					queryKey: ["getConsortiaFunctionalSettings"],
				});

				setAlert({
					open: true,
					severity: "success",
					text: t("consortium.new_functional_setting.success", {
						consortium: consortiumDisplayName,
					}),
				});

				setTimeout(() => {
					reset();
					onClose();
				}, 1000);
			}
		},
		onError: (error) => {
			console.error("Error creating new functional setting:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("consortium.new_functional_setting.error", {
					consortium: consortiumDisplayName,
				}),
			});
		},
	});

	const onSubmit = (data: NewFunctionalSettingFormData) => {
		// Guaranteed non-null by the yup schema, but narrow it for the mutation input.
		if (!data.name) return;
		settingMutation.mutate({ ...data, name: data.name });
	};

	return (
		<>
			<Dialog
				open={show}
				onClose={onClose}
				fullWidth
				maxWidth="sm"
				aria-labelledby="new-functional-setting-modal-title"
			>
				<DialogTitle
					id="new-functional-setting-modal-title"
					variant="modalTitle"
				>
					{t("consortium.new_functional_setting.title")}
				</DialogTitle>
				<Divider aria-hidden="true" />
				<DialogContent>
					<Box
						component="form"
						id="new-functional-setting-form"
						onSubmit={handleSubmit(onSubmit)}
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 2,
							mt: 2,
						}}
					>
						<Controller
							name="name"
							control={control}
							render={({ field }) => (
								<Autocomplete
									options={FUNCTIONAL_SETTING_TYPES}
									value={field.value || null}
									onChange={(_, newValue) => {
										field.onChange(newValue);
									}}
									renderInput={(params) => (
										<TextField
											{...params}
											required
											label={t("consortium.settings.name")}
											error={!!errors.name}
											helperText={errors.name?.message}
										/>
									)}
									isOptionEqualToValue={(option, value) =>
										option === value || (!option && !value)
									}
								/>
							)}
						/>
						<Box>
							<FormControl fullWidth error={!!errors.enabled} required>
								<InputLabel id="enabled-select-label">
									{t("consortium.settings.enabled_header")}
								</InputLabel>
								<Controller
									name="enabled"
									control={control}
									render={({ field }) => (
										<Select
											labelId="enabled-select-label"
											{...field}
											label={t("consortium.settings.enabled_header")}
											value={field.value?.toString() ?? "false"}
											onChange={(e) => {
												field.onChange(e.target.value === "true");
											}}
											variant="outlined"
										>
											<MenuItem value="true">{t("ui.actions.yes")}</MenuItem>
											<MenuItem value="false">{t("ui.actions.no")}</MenuItem>
										</Select>
									)}
								/>
								{errors.enabled && (
									<FormHelperText>{errors.enabled.message}</FormHelperText>
								)}
							</FormControl>
						</Box>
						<Controller
							name="description"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("consortium.settings.description")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.description}
									helperText={errors.description?.message}
								/>
							)}
						/>

						<Controller
							name="reason"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("data_change_log.reason_addition")}
									variant="outlined"
									fullWidth
									error={!!errors.reason}
									helperText={errors.reason?.message}
								/>
							)}
						/>

						<TextField
							{...register("changeReferenceUrl")}
							fullWidth
							variant="outlined"
							label={t("data_change_log.reference_url")}
							error={!!errors.changeReferenceUrl}
							helperText={errors.changeReferenceUrl?.message}
						/>
					</Box>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button onClick={onClose} variant="outlined" color="primary">
						{t("mappings.cancel")}
					</Button>
					<div style={{ flex: "1 0 0" }} />
					<Button
						type="submit"
						form="new-functional-setting-form"
						variant="contained"
						color="primary"
						disabled={!isValid || !isDirty || settingMutation.isPending}
					>
						{settingMutation.isPending
							? t("ui.actions.submitting")
							: t("consortium.new_functional_setting.title")}
					</Button>
				</DialogActions>
			</Dialog>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				autoHideDuration={6000}
				alertText={alert.text}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
			/>
		</>
	);
}
