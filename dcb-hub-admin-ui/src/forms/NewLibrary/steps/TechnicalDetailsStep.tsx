import { NewLibraryFormData } from "@models/NewLibraryFormData";
import { Button, Stack } from "@mui/material";
import TextField from "@mui/material/TextField";
import { TFunction } from "next-i18next";
import { Control, Controller, FieldErrors } from "react-hook-form";

type TechnicalDetailsStep = {
	control: Control<NewLibraryFormData, any>;
	errors: FieldErrors<NewLibraryFormData>;
	t: TFunction;
	handleClose: () => void;
	handleNext: () => void;
};
export const TechnicalDetailsStep = ({
	control,
	errors,
	t,
	handleClose,
	handleNext,
}: TechnicalDetailsStep) => (
	<Stack spacing={1} direction="column">
		<Controller
			name="latitude"
			control={control}
			render={({ field }) => (
				<TextField
					{...field}
					label={t("libraries.primaryLocation.latitude")}
					variant="outlined"
					fullWidth
					error={!!errors.latitude}
					helperText={errors.latitude?.message}
					onChange={(e) => {
						const value = e.target.value;
						field.onChange(value === "" ? undefined : Number(value));
					}}
				/>
			)}
		/>
		<Controller
			name="longitude"
			control={control}
			render={({ field }) => (
				<TextField
					{...field}
					label={t("libraries.primaryLocation.longitude")}
					variant="outlined"
					fullWidth
					error={!!errors.longitude}
					helperText={errors.longitude?.message}
					onChange={(e) => {
						const value = e.target.value;
						field.onChange(value === "" ? undefined : Number(value));
					}}
				/>
			)}
		/>
		<Controller
			name="patronWebsite"
			control={control}
			render={({ field }) => (
				<TextField
					{...field}
					label={t("libraries.service.systems.patron_site")}
					variant="outlined"
					fullWidth
					error={!!errors.patronWebsite}
					helperText={errors.patronWebsite?.message}
				/>
			)}
		/>
		<Controller
			name="hostLmsConfiguration"
			control={control}
			render={({ field }) => (
				<TextField
					{...field}
					label={t("hostlms.configuration")}
					variant="outlined"
					fullWidth
					multiline
					rows={2}
					error={!!errors.hostLmsConfiguration}
					helperText={errors.hostLmsConfiguration?.message}
				/>
			)}
		/>
		<Controller
			name="discoverySystem"
			control={control}
			render={({ field }) => (
				<TextField
					{...field}
					label={t("libraries.service.systems.discovery")}
					variant="outlined"
					fullWidth
					error={!!errors.discoverySystem}
					helperText={errors.discoverySystem?.message}
				/>
			)}
		/>
		<Controller
			name="backupDowntimeSchedule"
			control={control}
			render={({ field }) => (
				<TextField
					{...field}
					label={t("libraries.service.environments.backup_schedule")}
					variant="outlined"
					fullWidth
					multiline
					rows={2}
					error={!!errors.backupDowntimeSchedule}
					helperText={errors.backupDowntimeSchedule?.message}
				/>
			)}
		/>
		<Stack spacing={1} direction={"row"}>
			<Button variant="outlined" onClick={handleClose}>
				{t("mappings.cancel")}
			</Button>
			<div style={{ flex: "1 0 0" }} />
			<Button color="primary" variant="contained" onClick={handleNext}>
				{t("ui.action.next")}
			</Button>
		</Stack>
	</Stack>
);
