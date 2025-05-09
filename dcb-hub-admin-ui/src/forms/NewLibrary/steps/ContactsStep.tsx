import { NewLibraryFormData } from "@models/NewLibraryFormData";
import { Add, Delete } from "@mui/icons-material";
import {
	Autocomplete,
	Box,
	Button,
	Checkbox,
	FormControlLabel,
	IconButton,
	Paper,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { TFunction } from "next-i18next";
import {
	Control,
	Controller,
	FieldErrors,
	useFieldArray,
} from "react-hook-form";

type ContactsStepType = {
	control: Control<NewLibraryFormData, any>;
	errors: FieldErrors<NewLibraryFormData>;
	t: TFunction;
	handleClose: () => void;
	handleSubmit: () => void;
	isValid: boolean;
	loading: boolean;
};

export default function ContactsStep({
	control,
	errors,
	t,
	handleClose,
	handleSubmit,
	loading,
	isValid,
}: ContactsStepType) {
	const { fields, append, remove } = useFieldArray({
		control,
		name: "contacts",
	});

	const handleAddContact = () => {
		if (fields.length < 2) {
			append({
				firstName: "",
				lastName: "",
				email: "",
				role: "",
				isPrimaryContact: false,
			});
		}
	};

	const handleRemoveContact = (index: number) => {
		if (fields.length > 1) {
			remove(index);
		}
	};
	return (
		<>
			{fields.map((field, index) => (
				<Paper key={field.id} sx={{ p: 2 }}>
					<Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
						<Typography variant="h6">
							{t("libraries.contacts.one")} #{index + 1}
						</Typography>
						{fields.length > 1 && (
							<IconButton
								onClick={() => handleRemoveContact(index)}
								aria-label={t("libraries.contacts.remove")}
							>
								<Delete />
							</IconButton>
						)}
					</Box>
					<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
						<Controller
							name={`contacts.${index}.firstName`}
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("libraries.contacts.first_name")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.contacts?.[index]?.firstName}
									helperText={errors.contacts?.[index]?.firstName?.message}
								/>
							)}
						/>
						<Controller
							name={`contacts.${index}.lastName`}
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("libraries.contacts.last_name")}
									variant="outlined"
									fullWidth
									required
									error={!!errors.contacts?.[index]?.lastName}
									helperText={errors.contacts?.[index]?.lastName?.message}
								/>
							)}
						/>
						<Controller
							name={`contacts.${index}.email`}
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("libraries.contacts.email")}
									variant="outlined"
									type="email"
									fullWidth
									required
									error={!!errors.contacts?.[index]?.email}
									helperText={errors.contacts?.[index]?.email?.message}
								/>
							)}
						/>
						<Controller
							name={`contacts.${index}.role`}
							control={control}
							render={({ field }) => (
								<Autocomplete
									{...field}
									value={field.value || null}
									onChange={(_, newValue) => {
										field.onChange(newValue);
									}}
									options={[
										t("libraries.contacts.roles.implementation"),
										t("libraries.contacts.roles.library_service_admin"),
										t("libraries.contacts.roles.operations"),
										t("libraries.contacts.roles.sign_off"),
										t("libraries.contacts.roles.support"),
										t("libraries.contacts.roles.technical"),
									]}
									renderInput={(params) => (
										<TextField
											{...params}
											required
											label={t("libraries.contacts.role")}
											error={!!errors.contacts?.[index]?.role}
											helperText={errors.contacts?.[index]?.role?.message}
										/>
									)}
									isOptionEqualToValue={(option, value) =>
										option === value || (!option && !value)
									}
								/>
							)}
						/>
						<Controller
							name={`contacts.${index}.isPrimaryContact`}
							control={control}
							render={({ field }) => (
								<FormControlLabel
									control={<Checkbox {...field} checked={field.value} />}
									label={t("libraries.contacts.primary")}
								/>
							)}
						/>
					</Box>
				</Paper>
			))}

			{fields.length < 2 && (
				<Button
					startIcon={<Add />}
					onClick={handleAddContact}
					variant="outlined"
					color="primary"
					sx={{ alignSelf: "flex-start" }}
				>
					{t("consortium.new_contact.title")}
				</Button>
			)}

			{errors.contacts &&
				typeof errors.contacts === "object" &&
				"message" in errors.contacts && (
					<Typography color="error">{errors.contacts.message}</Typography>
				)}
			<Stack spacing={1} direction={"row"}>
				<Button variant="outlined" onClick={handleClose}>
					{t("mappings.cancel")}
				</Button>
				<div style={{ flex: "1 0 0" }} />
				<Button
					type="submit"
					variant="contained"
					color="primary"
					disabled={!isValid || loading}
					onClick={handleSubmit}
				>
					{loading ? t("ui.action.submitting") : t("libraries.new.title")}
				</Button>
			</Stack>
		</>
	);
}
