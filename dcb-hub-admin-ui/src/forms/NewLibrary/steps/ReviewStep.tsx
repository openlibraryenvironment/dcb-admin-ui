import { NewLibraryFormData } from "@models/NewLibraryFormData";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { TFunction } from "next-i18next";
import { Control, Controller, FieldErrors } from "react-hook-form";

type ReviewStepType = {
	control: Control<NewLibraryFormData, any>;
	errors: FieldErrors<NewLibraryFormData>;
	t: TFunction;
	formValues: any;
	register: any;
	handleSubmit: any;
	isValid: boolean;
	loading: boolean;
};

export default function ReviewStep({
	control,
	errors,
	t,
	formValues,
	register,
	handleSubmit,
	isValid,
	loading,
}: ReviewStepType) {
	return (
		<>
			<Paper sx={{ p: 2 }}>
				<Typography variant="h6" gutterBottom>
					{t("library.review.basic_info")}
				</Typography>
				<Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
					<Typography>
						<strong>{t("libraries.details.fullName")}:</strong>{" "}
						{formValues.fullName}
					</Typography>
					<Typography>
						<strong>{t("libraries.details.shortName")}:</strong>{" "}
						{formValues.shortName}
					</Typography>
					<Typography>
						<strong>{t("libraries.details.abbreviatedName")}:</strong>{" "}
						{formValues.abbreviatedName}
					</Typography>
					<Typography>
						<strong>{t("libraries.details.agencyCode")}:</strong>{" "}
						{formValues.agencyCode}
					</Typography>
					<Typography>
						<strong>{t("libraries.details.supportHours")}:</strong>{" "}
						{formValues.supportHours}
					</Typography>
					<Typography>
						<strong>{t("libraries.type")}:</strong> {formValues.type}
					</Typography>
					<Typography sx={{ gridColumn: "1 / 3" }}>
						<strong>{t("libraries.details.address")}:</strong>{" "}
						{formValues.address}
					</Typography>
				</Box>
			</Paper>

			<Paper sx={{ p: 2 }}>
				<Typography variant="h6" gutterBottom>
					{t("library.review.technical_details")}
				</Typography>
				<Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
					<Typography>
						<strong>{t("libraries.details.latitude")}:</strong>{" "}
						{formValues.latitude || "-"}
					</Typography>
					<Typography>
						<strong>{t("libraries.details.longitude")}:</strong>{" "}
						{formValues.longitude || "-"}
					</Typography>
					<Typography>
						<strong>{t("libraries.details.patronWebsite")}:</strong>{" "}
						{formValues.patronWebsite || "-"}
					</Typography>
					<Typography>
						<strong>{t("libraries.details.discoverySystem")}:</strong>{" "}
						{formValues.discoverySystem || "-"}
					</Typography>
					<Typography sx={{ gridColumn: "1 / 3" }}>
						<strong>{t("libraries.details.hostLmsConfiguration")}:</strong>{" "}
						{formValues.hostLmsConfiguration || "-"}
					</Typography>
					<Typography sx={{ gridColumn: "1 / 3" }}>
						<strong>{t("libraries.details.backupDowntimeSchedule")}:</strong>{" "}
						{formValues.backupDowntimeSchedule || "-"}
					</Typography>
				</Box>
			</Paper>

			<Paper sx={{ p: 2 }}>
				<Typography variant="h6" gutterBottom>
					{t("library.review.contacts")}
				</Typography>
				{formValues.contacts.map((contact, index) => (
					<Box
						key={index}
						sx={{ mb: 2, p: 1, border: "1px solid #eee", borderRadius: 1 }}
					>
						<Typography variant="subtitle1">
							{t("libraries.contacts.contact")} #{index + 1}
							{contact.isPrimaryContact
								? ` (${t("libraries.contacts.primary")})`
								: ""}
						</Typography>
						<Box
							sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}
						>
							<Typography>
								<strong>{t("libraries.contacts.name")}:</strong>{" "}
								{contact.firstName} {contact.lastName}
							</Typography>
							<Typography>
								<strong>{t("libraries.contacts.email")}:</strong>{" "}
								{contact.email}
							</Typography>
							<Typography>
								<strong>{t("libraries.contacts.role")}:</strong> {contact.role}
							</Typography>
						</Box>
					</Box>
				))}
			</Paper>

			<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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

				<TextField
					{...register("changeReferenceUrl")}
					fullWidth
					variant="outlined"
					label={t("data_change_log.reference_url")}
					error={!!errors.changeReferenceUrl}
					helperText={errors.changeReferenceUrl?.message}
				/>
			</Box>
			<Button
				type="submit"
				variant="contained"
				color="primary"
				disabled={!isValid || loading}
				onClick={handleSubmit}
			>
				{loading
					? t("ui.action.submitting")
					: t("consortium.new_library.submit")}
			</Button>
		</>
	);
}
