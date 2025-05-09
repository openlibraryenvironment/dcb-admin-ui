import { NewLibraryFormData } from "@models/NewLibraryFormData";
import { Button, Stack } from "@mui/material";
import TextField from "@mui/material/TextField";
import { TFunction } from "next-i18next";
import { Control, Controller, FieldErrors } from "react-hook-form";

type LocationAndServiceStep = {
	control: Control<NewLibraryFormData, any>;
	errors: FieldErrors<NewLibraryFormData>;
	t: TFunction;
	handleClose: () => void;
	handleNext: () => void;
	isValid: boolean;
};
export const LocationAndServiceStep = ({
	control,
	errors,
	t,
	handleClose,
	handleNext,
	isValid,
}: LocationAndServiceStep) => (
	<Stack spacing={1} direction="column">
		{/* 		/* Location info */}

		<Controller
			name="address"
			control={control}
			render={({ field }) => (
				<TextField
					{...field}
					label={t("libraries.primaryLocation.address")}
					variant="outlined"
					fullWidth
					required
					error={!!errors.address}
					helperText={errors.address?.message}
				/>
			)}
		/>
		<Controller
			name="latitude"
			control={control}
			render={({ field }) => (
				<TextField
					{...field}
					label={t("libraries.primaryLocation.latitude")}
					variant="outlined"
					fullWidth
					required
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
					required
					error={!!errors.longitude}
					helperText={errors.longitude?.message}
					onChange={(e) => {
						const value = e.target.value;
						field.onChange(value === "" ? undefined : Number(value));
					}}
				/>
			)}
		/>

		{/* 		/* Service info */}

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
			name="reason"
			control={control}
			render={({ field }) => (
				<TextField
					{...field}
					label={t("data_change_log.reason_addition")}
					variant="outlined"
					fullWidth
					required
					error={!!errors.reason}
					helperText={errors.reason?.message}
				/>
			)}
		/>

		<Controller
			name="changeReferenceUrl"
			control={control}
			render={({ field }) => (
				<TextField
					{...field}
					fullWidth
					variant="outlined"
					label={t("data_change_log.reference_url")}
					error={!!errors.changeReferenceUrl}
					helperText={errors.changeReferenceUrl?.message}
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
