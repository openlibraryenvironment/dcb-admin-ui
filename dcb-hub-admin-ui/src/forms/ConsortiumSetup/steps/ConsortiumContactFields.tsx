import { useTranslation } from "react-i18next";
import { Controller, useFormContext } from "react-hook-form";
import {
	Autocomplete,
	Checkbox,
	FormControlLabel,
	Stack,
	TextField,
	Typography,
} from "@mui/material";

import {
	CONTACT_ROLE_OPTIONS,
	contactRoleLabelKey,
} from "@constants/contactRoles";
import type { NewConsortiumFormValues } from "@schemas/newConsortiumSchema";

interface ConsortiumContactFieldsProps {
	showExplanation?: boolean;
}

/**
 * Who to contact about the consortium — extracted from `NewConsortium.tsx` for W-7.
 *
 * `autoComplete` is set on every field a browser or password manager could fill. That is
 * WCAG 1.3.5 (identify input purpose) and 3.3.7 (redundant entry): somebody entering their
 * own details should not be made to type what their browser already knows.
 */
export default function ConsortiumContactFields({
	showExplanation = true,
}: ConsortiumContactFieldsProps) {
	const { t } = useTranslation();
	const {
		control,
		formState: { errors },
	} = useFormContext<NewConsortiumFormValues>();
	const contactErrors = errors.contacts as any;

	return (
		<Stack spacing={2} sx={{ mt: 1 }}>
			{showExplanation && (
				<Typography>{t("consortium.new.contact_explanation")}</Typography>
			)}

			<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
				<Controller
					name="contacts.0.firstName"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="consortium-contact-first-name"
							label={t("libraries.contacts.first_name")}
							required
							fullWidth
							autoComplete="given-name"
							error={!!contactErrors?.[0]?.firstName}
							helperText={contactErrors?.[0]?.firstName?.message}
						/>
					)}
				/>
				<Controller
					name="contacts.0.lastName"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="consortium-contact-last-name"
							label={t("libraries.contacts.last_name")}
							required
							fullWidth
							autoComplete="family-name"
							error={!!contactErrors?.[0]?.lastName}
							helperText={contactErrors?.[0]?.lastName?.message}
						/>
					)}
				/>
			</Stack>
			<Controller
				name="contacts.0.email"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="consortium-contact-email"
						label={t("libraries.contacts.email")}
						type="email"
						required
						fullWidth
						autoComplete="email"
						error={!!contactErrors?.[0]?.email}
						helperText={contactErrors?.[0]?.email?.message}
					/>
				)}
			/>
			<Controller
				name="contacts.0.role"
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
								id="consortium-contact-role"
								required
								label={t("libraries.contacts.role")}
								error={!!contactErrors?.[0]?.role}
								helperText={contactErrors?.[0]?.role?.message}
							/>
						)}
					/>
				)}
			/>
			<Controller
				name="contacts.0.isPrimaryContact"
				control={control}
				render={({ field }) => (
					<FormControlLabel
						control={<Checkbox {...field} checked={field.value === true} />}
						label={t("libraries.contacts.primary")}
					/>
				)}
			/>
		</Stack>
	);
}
