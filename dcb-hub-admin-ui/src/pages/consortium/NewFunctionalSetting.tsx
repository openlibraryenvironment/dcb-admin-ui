import { useMutation } from "@apollo/client";
import TimedAlert from "@components/TimedAlert/TimedAlert";
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
import { useTranslation } from "next-i18next";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
	addFunctionalSettingQuery,
	getConsortiaFunctionalSettings,
} from "src/queries/queries";
import * as Yup from "yup";

interface NewFunctionalSettingFormData {
	description: string;
	name: string;
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
				t("ui.validation.required", {
					field: t("consortium.settings.name"),
				}),
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
			name: "",
			reason: "",
			changeCategory: "",
			changeReferenceUrl: "",
		},
		resolver: yupResolver(validationSchema),
		mode: "onChange",
	});

	const [createFunctionalSetting, { loading }] = useMutation(
		addFunctionalSettingQuery,
		{
			refetchQueries: [getConsortiaFunctionalSettings],
		},
	);

	const [alert, setAlert] = useState<{
		open: boolean;
		severity: "success" | "error";
		text: string | null;
	}>({
		open: false,
		severity: "success",
		text: null,
	});

	const onSubmit = async (data: NewFunctionalSettingFormData) => {
		try {
			const result = await createFunctionalSetting({
				variables: { input: { ...data, consortiumName } },
			});

			if (result.data) {
				setAlert({
					open: true,
					severity: "success",
					text: t("consortium.new_functional_setting.success", {
						consortium: consortiumDisplayName,
					}),
				});

				// Delay the modal closing and form reset to ensure the alert is visible
				setTimeout(() => {
					reset();
					onClose();
				}, 1000);
			}
		} catch (error) {
			console.error("Error creating new functional setting:", error);
			setAlert({
				open: true,
				severity: "error",
				text: t("consortium.new_functional_setting.error", {
					consortium: consortiumDisplayName,
				}),
			});
		}
	};

	return (
		<>
			<Dialog
				open={show}
				onClose={onClose}
				fullWidth
				maxWidth="sm"
				aria-labelledby="new-functional-setting-modal"
			>
				<DialogTitle variant="modalTitle">
					{t("consortium.new_functional_setting.title")}
				</DialogTitle>
				<Divider aria-hidden="true" />
				<DialogContent>
					<Box
						component="form"
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
									{...field}
									value={field.value || null}
									onChange={(_, newValue) => {
										field.onChange(newValue);
									}}
									options={[
										"PICKUP_ANYWHERE",
										"RE_RESOLUTION",
										"SELECT_UNAVAILABLE_ITEMS",
									]}
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
								<InputLabel>
									{t("consortium.settings.enabled_header")}
								</InputLabel>
								<Controller
									name="enabled"
									control={control}
									render={({ field }) => (
										<Select
											{...field}
											label={t("consortium.settings.enabled_header")}
											value={field.value?.toString() ?? "false"}
											onChange={(e) => {
												field.onChange(e.target.value === "true");
											}}
											variant="outlined"
										>
											<MenuItem value="true">Yes</MenuItem>
											<MenuItem value="false">No</MenuItem>
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
							name={t("data_change_log.reference_url")}
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
						variant="contained"
						color="primary"
						disabled={!isValid || !isDirty || loading}
						onClick={handleSubmit(onSubmit)}
					>
						{loading
							? t("ui.action.submitting")
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
