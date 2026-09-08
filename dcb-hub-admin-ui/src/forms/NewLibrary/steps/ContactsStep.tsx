import { useTranslation } from "react-i18next";
import {
	useFormContext,
	Controller,
	useFieldArray,
	FieldErrors,
} from "react-hook-form";
import { Add, Delete } from "@mui/icons-material";
import {
	Alert,
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
import {
	CONTACT_ROLE_OPTIONS,
	contactRoleLabelKey,
} from "@constants/contactRoles";

type LibraryFormValues = z.infer<typeof newLibrarySchema>;

const EMPTY_CONTACT = {
	firstName: "",
	lastName: "",
	email: "",
	role: "",
	isPrimaryContact: false,
};

export default function ContactsStep() {
	const { t } = useTranslation();
	const {
		control,
		setValue,
		getValues,
		formState: { errors },
	} = useFormContext();

	const { fields, append, remove } = useFieldArray({
		control,
		name: "contacts",
	});

	const contactErrors = errors.contacts as unknown as FieldErrors<
		LibraryFormValues["contacts"]
	>;

	// Exactly one contact can be the primary one - it is who DCB writes to first.
	// Letting two be ticked stores an ambiguity the backend has no way to settle.
	const selectPrimary = (index: number, checked: boolean) => {
		const contacts = getValues("contacts") ?? [];
		contacts.forEach((_: unknown, position: number) => {
			setValue(
				`contacts.${position}.isPrimaryContact`,
				checked && position === index,
				{ shouldDirty: true },
			);
		});
	};

	return (
		<Stack spacing={3} sx={{ mt: 1 }}>
			{/* The schema requires at least one, and the library cannot be created
			    without it - say so before the user hits Next rather than after. */}
			<Alert severity="info">
				{t("libraries.contacts.minimum_explanation")}
			</Alert>

			{fields.map((field, index) => (
				<Paper key={field.id} sx={{ p: 3 }} variant="outlined">
					<Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
						<Typography variant="h6" component="h3">
							{t("libraries.contacts.numbered", { number: index + 1 })}
						</Typography>
						{fields.length > 1 && (
							<IconButton
								onClick={() => remove(index)}
								aria-label={t("libraries.contacts.remove_numbered", {
									number: index + 1,
								})}
							>
								<Delete color="error" />
							</IconButton>
						)}
					</Box>
					<Stack spacing={2} direction="column">
						<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
							<Controller
								name={`contacts.${index}.firstName`}
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										id={`contact-${index}-first-name`}
										label={t("libraries.contacts.first_name")}
										required
										fullWidth
										autoComplete="given-name"
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
										id={`contact-${index}-last-name`}
										label={t("libraries.contacts.last_name")}
										required
										fullWidth
										autoComplete="family-name"
										error={!!contactErrors?.[index]?.lastName}
										helperText={contactErrors?.[index]?.lastName?.message}
									/>
								)}
							/>
						</Stack>
						<Controller
							name={`contacts.${index}.email`}
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									id={`contact-${index}-email`}
									label={t("libraries.contacts.email")}
									type="email"
									required
									fullWidth
									autoComplete="email"
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
									options={CONTACT_ROLE_OPTIONS.map((option) => option.value)}
									getOptionLabel={(value) => t(contactRoleLabelKey(value))}
									onChange={(_, newValue) => field.onChange(newValue ?? "")}
									onBlur={field.onBlur}
									value={field.value || null}
									isOptionEqualToValue={(option, value) => option === value}
									renderInput={(params) => (
										<TextField
											{...params}
											id={`contact-${index}-role`}
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
									control={
										<Checkbox
											{...field}
											checked={field.value === true}
											onChange={(event) =>
												selectPrimary(index, event.target.checked)
											}
										/>
									}
									label={t("libraries.contacts.primary")}
								/>
							)}
						/>
					</Stack>
				</Paper>
			))}

			{/* The cap used to be two, for no reason the code gave. A library with a
			    technical, an operations and a sign-off contact is normal. */}
			<Button
				startIcon={<Add />}
				onClick={() => append({ ...EMPTY_CONTACT })}
				variant="outlined"
				sx={{ alignSelf: "flex-start" }}
			>
				{t("consortium.new_contact.title")}
			</Button>

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
