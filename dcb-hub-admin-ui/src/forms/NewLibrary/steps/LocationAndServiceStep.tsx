import { useTranslation } from "react-i18next"; // 1. Import the hook locally
import {
	Control,
	Controller,
	FieldErrors,
	FieldValues,
	Path,
} from "react-hook-form";
import { Button, Stack, TextField, Box } from "@mui/material";

type LocationAndServiceStepProps<TFieldValues extends FieldValues> = {
	control: Control<TFieldValues>;
	errors: FieldErrors<TFieldValues>;
	handleClose: () => void;
	handleNext: () => void;
	isValid: boolean;
};

export const LocationAndServiceStep = <TFieldValues extends FieldValues>({
	control,
	errors,
	handleClose,
	handleNext,
	isValid,
}: LocationAndServiceStepProps<TFieldValues>) => {
	// 2. Initialize it directly inside the component lifecycle
	const { t } = useTranslation();

	return (
		<Stack spacing={2} direction="column" sx={{ mt: 1 }}>
			<Controller
				name={"address" as Path<TFieldValues>}
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label={t("libraries.primaryLocation.address")}
						variant="outlined"
						fullWidth
						required
						error={!!errors["address" as keyof FieldErrors<TFieldValues>]}
						helperText={
							errors["address" as keyof FieldErrors<TFieldValues>]
								?.message as string
						}
					/>
				)}
			/>

			<Controller
				name={"latitude" as Path<TFieldValues>}
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label={t("libraries.primaryLocation.latitude")}
						variant="outlined"
						fullWidth
						required
						error={!!errors["latitude" as keyof FieldErrors<TFieldValues>]}
						helperText={
							errors["latitude" as keyof FieldErrors<TFieldValues>]
								?.message as string
						}
						onChange={(e) => {
							const value = e.target.value;
							field.onChange(value === "" ? undefined : Number(value));
						}}
					/>
				)}
			/>

			<Controller
				name={"longitude" as Path<TFieldValues>}
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label={t("libraries.primaryLocation.longitude")}
						variant="outlined"
						fullWidth
						required
						error={!!errors["longitude" as keyof FieldErrors<TFieldValues>]}
						helperText={
							errors["longitude" as keyof FieldErrors<TFieldValues>]
								?.message as string
						}
						onChange={(e) => {
							const value = e.target.value;
							field.onChange(value === "" ? undefined : Number(value));
						}}
					/>
				)}
			/>

			<Controller
				name={"patronWebsite" as Path<TFieldValues>}
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label={t("libraries.service.systems.patron_site")}
						variant="outlined"
						fullWidth
						error={!!errors["patronWebsite" as keyof FieldErrors<TFieldValues>]}
						helperText={
							errors["patronWebsite" as keyof FieldErrors<TFieldValues>]
								?.message as string
						}
					/>
				)}
			/>

			<Controller
				name={"hostLmsConfiguration" as Path<TFieldValues>}
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label={t("hostlms.configuration")}
						variant="outlined"
						fullWidth
						multiline
						rows={3}
						error={
							!!errors[
								"hostLmsConfiguration" as keyof FieldErrors<TFieldValues>
							]
						}
						helperText={
							errors["hostLmsConfiguration" as keyof FieldErrors<TFieldValues>]
								?.message as string
						}
					/>
				)}
			/>

			<Controller
				name={"discoverySystem" as Path<TFieldValues>}
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label={t("libraries.service.systems.discovery")}
						variant="outlined"
						fullWidth
						error={
							!!errors["discoverySystem" as keyof FieldErrors<TFieldValues>]
						}
						helperText={
							errors["discoverySystem" as keyof FieldErrors<TFieldValues>]
								?.message as string
						}
					/>
				)}
			/>

			<Controller
				name={"reason" as Path<TFieldValues>}
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label={t("data_change_log.reason_addition")}
						variant="outlined"
						fullWidth
						required
						error={!!errors["reason" as keyof FieldErrors<TFieldValues>]}
						helperText={
							errors["reason" as keyof FieldErrors<TFieldValues>]
								?.message as string
						}
					/>
				)}
			/>

			<Controller
				name={"changeReferenceUrl" as Path<TFieldValues>}
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						fullWidth
						variant="outlined"
						label={t("data_change_log.reference_url")}
						error={
							!!errors["changeReferenceUrl" as keyof FieldErrors<TFieldValues>]
						}
						helperText={
							errors["changeReferenceUrl" as keyof FieldErrors<TFieldValues>]
								?.message as string
						}
					/>
				)}
			/>

			<Stack spacing={2} direction="row" sx={{ pt: 2 }}>
				<Button variant="outlined" onClick={handleClose}>
					{t("mappings.cancel")}
				</Button>
				<Box sx={{ flex: "1 0 0" }} />
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
};
