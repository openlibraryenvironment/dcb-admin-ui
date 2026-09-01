import { useTranslation } from "react-i18next";
import { Controller, useFormContext } from "react-hook-form";
import { Alert, Stack, TextField, Typography } from "@mui/material";

import type { NewConsortiumFormValues } from "@schemas/newConsortiumSchema";

interface ConsortiumDetailsFieldsProps {
	/**
	 * Whether to show the change-log fields.
	 *
	 * `reason` and `changeCategory` are String! on ConsortiumInput, so something must
	 * fill them - but asking a first-time user for a change reference URL, before they
	 * have made a single change, is asking them to document an event that has not
	 * happened. The setup flow fills them in ("Initial setup") and hides the fields; the
	 * dialog, which is also used to correct an existing instance, keeps them.
	 */
	showChangeLogFields?: boolean;
	/** The setup flow states its own purpose in the chapter subtitle. */
	showExplanation?: boolean;
}

/**
 * The consortium's own details — extracted for W-7 from what was then the
 * NewConsortium modal, and shared with the setup flow that replaced it.
 *
 * Rendered by BOTH the New Consortium dialog and the setup flow's chapter 2. It reads its
 * values through `useFormContext`, so each host owns the form instance, the resolver and
 * the submit; this owns only the fields and their validation wiring.
 *
 * There is exactly one copy of these fields on purpose. Two copies of a form whose schema
 * lives somewhere else is how one of them quietly stops matching the mutation.
 */
export default function ConsortiumDetailsFields({
	showChangeLogFields = true,
	showExplanation = true,
}: ConsortiumDetailsFieldsProps) {
	const { t } = useTranslation();
	const {
		control,
		formState: { errors },
	} = useFormContext<NewConsortiumFormValues>();

	return (
		<Stack spacing={2} sx={{ mt: 1 }}>
			{showExplanation && (
				<Typography>{t("consortium.new.details_explanation")}</Typography>
			)}

			<Controller
				name="name"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="consortium-name"
						label={t("consortium.name")}
						required
						fullWidth
						error={!!errors.name}
						helperText={errors.name?.message ?? t("consortium.new.name_helper")}
					/>
				)}
			/>
			<Controller
				name="displayName"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="consortium-display-name"
						label={t("consortium.display_name")}
						required
						fullWidth
						error={!!errors.displayName}
						helperText={
							errors.displayName?.message ??
							t("consortium.new.display_name_helper")
						}
					/>
				)}
			/>

			<Alert severity="info">{t("consortium.new.group_explanation")}</Alert>

			<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
				<Controller
					name="groupName"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="consortium-group-name"
							label={t("groups.name")}
							required
							fullWidth
							error={!!errors.groupName}
							helperText={errors.groupName?.message}
						/>
					)}
				/>
				<Controller
					name="groupCode"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="consortium-group-code"
							label={t("groups.code")}
							required
							fullWidth
							error={!!errors.groupCode}
							helperText={errors.groupCode?.message}
						/>
					)}
				/>
			</Stack>

			<Controller
				name="dateOfLaunch"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="consortium-date-of-launch"
						type="date"
						label={t("consortium.date_of_launch")}
						required
						fullWidth
						error={!!errors.dateOfLaunch}
						helperText={errors.dateOfLaunch?.message}
						slotProps={{ inputLabel: { shrink: true } }}
					/>
				)}
			/>

			<Controller
				name="websiteUrl"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="consortium-website-url"
						label={t("consortium.url")}
						fullWidth
						error={!!errors.websiteUrl}
						helperText={errors.websiteUrl?.message}
					/>
				)}
			/>
			<Controller
				name="catalogueSearchUrl"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="consortium-catalogue-search-url"
						label={t("consortium.search_url")}
						fullWidth
						error={!!errors.catalogueSearchUrl}
						helperText={errors.catalogueSearchUrl?.message}
					/>
				)}
			/>
			<Controller
				name="description"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						id="consortium-description"
						label={t("consortium.description_title")}
						fullWidth
						multiline
						rows={3}
						error={!!errors.description}
						helperText={errors.description?.message}
					/>
				)}
			/>

			{showChangeLogFields && (
				<>
					<Controller
						name="reason"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								id="consortium-reason"
								label={t("data_change_log.reason_addition")}
								required
								fullWidth
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
								id="consortium-change-reference-url"
								label={t("data_change_log.reference_url")}
								fullWidth
								error={!!errors.changeReferenceUrl}
								helperText={errors.changeReferenceUrl?.message}
							/>
						)}
					/>
				</>
			)}
		</Stack>
	);
}
