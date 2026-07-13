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

// The `value` MUST be the backend RoleName enum constant - CreateLibraryDataFetcher
// upper-cases and matches it against RoleName. Sending the translated label breaks
// for anything the naive coercion can't reconstruct (e.g. LIBRARY_SERVICES_ADMINISTRATOR).
const ROLE_OPTIONS = [
	{
		value: "IMPLEMENTATION_CONTACT",
		labelKey: "libraries.contacts.roles.implementation",
	},
	{
		value: "LIBRARY_SERVICES_ADMINISTRATOR",
		labelKey: "libraries.contacts.roles.library_service_admin",
	},
	{
		value: "OPERATIONS_CONTACT",
		labelKey: "libraries.contacts.roles.operations",
	},
	{
		value: "SIGN_OFF_AUTHORITY",
		labelKey: "libraries.contacts.roles.sign_off",
	},
	{ value: "SUPPORT", labelKey: "libraries.contacts.roles.support" },
	{
		value: "TECHNICAL_CONTACT",
		labelKey: "libraries.contacts.roles.technical",
	},
] as const;

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
									options={ROLE_OPTIONS.map((option) => option.value)}
									getOptionLabel={(value) =>
										t(
											ROLE_OPTIONS.find((option) => option.value === value)
												?.labelKey ?? "",
										)
									}
									onChange={(_, newValue) => field.onChange(newValue ?? "")}
									onBlur={field.onBlur}
									value={field.value || null}
									isOptionEqualToValue={(option, value) => option === value}
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
