import { NewLibraryFormData } from "@models/NewLibraryFormData";
import { Autocomplete, Button, Stack, TextField } from "@mui/material";
import { TFunction } from "next-i18next";
import { Control, Controller, FieldErrors } from "react-hook-form";

type AgencyOption = {
	value: string;
	code: string;
	label: string;
};

type ProfileStepType = {
	control: Control<NewLibraryFormData, any>;
	agencyOptions: AgencyOption[];
	agenciesLoading: boolean;
	errors: FieldErrors<NewLibraryFormData>;
	t: TFunction;
	handleClose: () => void;
	handleNext: () => void;
	isValid: boolean;
};
export const ProfileStep = ({
	control,
	errors,
	agencyOptions,
	agenciesLoading,
	t,
	handleClose,
	handleNext,
	isValid,
}: ProfileStepType) => (
	<Stack direction="column" spacing={1}>
		<Controller
			name="fullName"
			control={control}
			render={({ field }) => (
				<TextField
					{...field}
					label={t("libraries.name")}
					variant="outlined"
					fullWidth
					required
					error={!!errors.fullName}
					helperText={errors.fullName?.message}
				/>
			)}
		/>
		<Controller
			name="shortName"
			control={control}
			render={({ field }) => (
				<TextField
					{...field}
					label={t("libraries.short_name")}
					variant="outlined"
					fullWidth
					required
					error={!!errors.shortName}
					helperText={errors.shortName?.message}
				/>
			)}
		/>
		<Controller
			name="abbreviatedName"
			control={control}
			render={({ field }) => (
				<TextField
					{...field}
					label={t("libraries.abbreviated_name")}
					variant="outlined"
					fullWidth
					required
					error={!!errors.abbreviatedName}
					helperText={errors.abbreviatedName?.message}
				/>
			)}
		/>
		<Controller
			name="agencyCode"
			control={control}
			render={({ field: { onChange, value } }) => (
				<Autocomplete
					value={
						value
							? agencyOptions.find(
									(option: AgencyOption) => option.value === value,
								) || null
							: null
					}
					onChange={(_, newValue) => {
						onChange(newValue?.value || "");
					}}
					options={agencyOptions}
					loading={agenciesLoading}
					getOptionLabel={(option) => option.label}
					renderInput={(params) => (
						<TextField
							{...params}
							margin="normal"
							required
							label={t("libraries.new.agency")}
							error={!!errors.agencyCode}
							helperText={errors.agencyCode?.message}
						/>
					)}
					isOptionEqualToValue={(option, value) => option.value === value.value}
				/>
			)}
		/>
		<Controller
			name="supportHours"
			control={control}
			render={({ field }) => (
				<TextField
					{...field}
					label={t("libraries.support_hours")}
					variant="outlined"
					fullWidth
					required
					error={!!errors.supportHours}
					helperText={errors.supportHours?.message}
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
		<Controller
			name="type"
			control={control}
			render={({ field }) => (
				<TextField
					{...field}
					label={t("libraries.type")}
					variant="outlined"
					fullWidth
					required
					error={!!errors.type}
					helperText={errors.type?.message}
				/>
			)}
		/>
		<Stack spacing={1} direction={"row"}>
			<Button variant="outlined" onClick={handleClose}>
				{t("mappings.cancel")}
			</Button>
			<div style={{ flex: "1 0 0" }} />
			<Button
				color="primary"
				variant="contained"
				onClick={handleNext}
				disabled={!isValid}
			>
				{t("ui.action.next")}
			</Button>
		</Stack>
	</Stack>
);
