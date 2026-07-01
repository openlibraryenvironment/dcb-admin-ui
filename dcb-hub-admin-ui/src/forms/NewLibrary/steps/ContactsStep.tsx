import { useTranslation } from "react-i18next";
import {
	useFormContext,
	Controller,
	useFieldArray,
	FieldErrors,
} from "react-hook-form";
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
import { newLibrarySchema } from "@schemas/newLibrarySchema";
import { z } from "zod";

type LibraryFormValues = z.infer<typeof newLibrarySchema>;

export default function ContactsStep() {
	const { t } = useTranslation();
	const {
		control,
		formState: { errors },
	} = useFormContext();

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

	const contactErrors = errors.contacts as unknown as FieldErrors<
		LibraryFormValues["contacts"]
	>;

	return (
		<Stack spacing={3} sx={{ mt: 1 }}>
			{fields.map((field, index) => (
				<Paper key={field.id} sx={{ p: 3 }} variant="outlined">
					<Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
						<Typography variant="h6">
							{t("libraries.contacts.one")} #{index + 1}
						</Typography>
						{fields.length > 1 && (
							<IconButton
								onClick={() => remove(index)}
								aria-label={t("libraries.contacts.remove")}
							>
								<Delete color="error" />
							</IconButton>
						)}
					</Box>
					<Stack spacing={2} direction="column">
						<Controller
							name={`contacts.${index}.firstName`}
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									label={t("libraries.contacts.first_name")}
									required
									fullWidth
									error={!!contactErrors?.[index]?.firstName}
									helperText={contactErrors?.[index]?.firstName?.message}
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
									required
									fullWidth
									error={!!contactErrors?.[index]?.lastName}
									helperText={contactErrors?.[index]?.lastName?.message}
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
									type="email"
									required
									fullWidth
									error={!!contactErrors?.[index]?.email}
									helperText={contactErrors?.[index]?.email?.message}
								/>
							)}
						/>
						<Controller
							name={`contacts.${index}.role`}
							control={control}
							render={({ field }) => (
								<Autocomplete
									{...field}
									options={[
										t("libraries.contacts.roles.implementation"),
										t("libraries.contacts.roles.library_service_admin"),
										t("libraries.contacts.roles.operations"),
										t("libraries.contacts.roles.sign_off"),
										t("libraries.contacts.roles.support"),
										t("libraries.contacts.roles.technical"),
									]}
									onChange={(_, newValue) => field.onChange(newValue || "")}
									value={field.value || null}
									renderInput={(params) => (
										<TextField
											{...params}
											required
											label={t("libraries.contacts.role")}
											error={!!contactErrors?.[index]?.role}
											helperText={contactErrors?.[index]?.role?.message}
										/>
									)}
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
					</Stack>
				</Paper>
			))}

			{fields.length < 2 && (
				<Button
					startIcon={<Add />}
					onClick={handleAddContact}
					variant="outlined"
					sx={{ alignSelf: "flex-start" }}
				>
					{t("consortium.new_contact.title")}
				</Button>
			)}

			{errors.contacts &&
				typeof errors.contacts === "object" &&
				"message" in errors.contacts && (
					<Typography color="error" role="alert" aria-live="assertive">
						{errors.contacts.message as string}
					</Typography>
				)}
		</Stack>
	);
}
