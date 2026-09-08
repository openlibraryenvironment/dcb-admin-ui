import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import {
	Alert,
	Autocomplete,
	createFilterOptions,
	Divider,
	FormControlLabel,
	Stack,
	Switch,
	TextField,
	Typography,
} from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getAgencies } from "@queries/getAgencies";
import type { LoadAgenciesQueryVariables } from "@generated/graphql";

type AgencyOption = { label: string; value: string; inputValue?: string };

const filter = createFilterOptions<AgencyOption>();

/**
 * One heading per group of fields.
 *
 * The step is sixteen inputs long. As one flat column it reads as a wall, and
 * somebody adding their tenth library has to re-scan it every time to find the
 * three fields that differ. Grouping is the only change here that costs
 * nothing and is felt on every single use.
 */
const Section = ({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) => (
	<Stack spacing={2}>
		<Divider textAlign="left">
			<Typography variant="subtitle2" component="h3" color="text.secondary">
				{title}
			</Typography>
		</Divider>
		{children}
	</Stack>
);

export function ProfileStep() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const {
		control,
		formState: { errors },
	} = useFormContext();

	const { data: agenciesData, isLoading: agenciesLoading } = useQuery({
		queryKey: ["agenciesSelection"],
		queryFn: () =>
			gqlClient.request<any, LoadAgenciesQueryVariables>(getAgencies, {
				order: "code",
				orderBy: "ASC",
				pageno: 0,
				pagesize: 1000,
				query: "",
			}),
		staleTime: 1000 * 60 * 5, // Just in case somebody is constantly going back and forth
	});

	const agencyOptions: AgencyOption[] =
		agenciesData?.agencies?.content?.map((item: any) => ({
			label: item.name,
			value: item.code,
		})) || [];

	const agencyCode = useWatch({ control, name: "agencyCode" });
	// Whether the code in the box is one that already exists decides whether
	// saving this library also creates an agency. That is a consequential,
	// irreversible-ish side effect, so it is stated on the step rather than left
	// to be inferred from a dropdown entry the user may never have opened.
	const isNewAgency =
		!!agencyCode &&
		!agencyOptions.some((option) => option.value === agencyCode) &&
		!agenciesLoading;

	return (
		<Stack direction="column" spacing={3} sx={{ mt: 1 }}>
			<Section title={t("libraries.new.section_identity")}>
				<Controller
					name="fullName"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="library-full-name"
							label={t("libraries.name")}
							variant="outlined"
							fullWidth
							required
							error={!!errors.fullName}
							helperText={errors.fullName?.message as string}
						/>
					)}
				/>
				<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
					<Controller
						name="shortName"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								id="library-short-name"
								label={t("libraries.short_name")}
								variant="outlined"
								fullWidth
								required
								error={!!errors.shortName}
								helperText={errors.shortName?.message as string}
							/>
						)}
					/>
					<Controller
						name="abbreviatedName"
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								id="library-abbreviated-name"
								label={t("libraries.abbreviated_name")}
								variant="outlined"
								fullWidth
								required
								error={!!errors.abbreviatedName}
								helperText={errors.abbreviatedName?.message as string}
							/>
						)}
					/>
				</Stack>
				<Controller
					name="type"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="library-type"
							label={t("libraries.type")}
							variant="outlined"
							fullWidth
							required
							error={!!errors.type}
							helperText={errors.type?.message as string}
						/>
					)}
				/>
			</Section>

			<Section title={t("libraries.new.section_agency")}>
				<Controller
					name="agencyCode"
					control={control}
					render={({ field }) => (
						<Autocomplete
							freeSolo
							options={agencyOptions}
							loading={agenciesLoading}
							// Dynamically inject the "Add..." option if no exact match exists
							filterOptions={(options, params) => {
								const filtered = filter(options, params);
								const { inputValue } = params;

								const isExisting = options.some(
									(option) =>
										inputValue === option.label || inputValue === option.value,
								);

								if (inputValue !== "" && !isExisting) {
									filtered.push({
										inputValue,
										value: inputValue,
										label: t("libraries.new.add_agency", { code: inputValue }),
									});
								}
								return filtered;
							}}
							getOptionLabel={(option) => {
								if (typeof option === "string") return option;
								if (option.inputValue) return option.inputValue;
								return option.label || option.value || "";
							}}
							// Handle the selection cleanly without raw keystroke capture
							onChange={(_, newValue) => {
								if (typeof newValue === "string") {
									// User pressed enter on a raw string
									field.onChange(newValue);
								} else if (newValue?.inputValue) {
									// User selected the dynamically generated "Add" option
									field.onChange(newValue.inputValue);
								} else {
									// User selected an existing agency option
									field.onChange(newValue?.value || "");
								}
							}}
							onInputChange={(_, inputValue, changeReason) => {
								// freeSolo means typing without picking anything is a valid
								// way to name a new agency; without this the typed code was
								// only committed when the user happened to select the "Add"
								// entry, and was otherwise silently discarded on blur.
								if (changeReason === "input") field.onChange(inputValue);
							}}
							onBlur={field.onBlur} // Ensures RHF validation triggers when tabbing away
							value={
								agencyOptions.find((opt) => opt.value === field.value) ||
								field.value ||
								null
							}
							renderOption={(props, option) => {
								const { key, ...optionProps } = props as any;
								return (
									<li key={key} {...optionProps}>
										{option.inputValue ? (
											option.label
										) : (
											<Stack>
												<Typography variant="body1">{option.value}</Typography>
												<Typography variant="body2" color="text.secondary">
													{option.label}
												</Typography>
											</Stack>
										)}
									</li>
								);
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									id="library-agency-code"
									required
									label={t("libraries.new.agency")}
									error={!!errors.agencyCode}
									helperText={
										(errors.agencyCode?.message as string) ??
										t("libraries.new.agency_helper")
									}
								/>
							)}
						/>
					)}
				/>
				{isNewAgency && (
					<Alert severity="info">
						{t("libraries.new.agency_will_be_created", { code: agencyCode })}
					</Alert>
				)}
				<Controller
					name={"authProfile"}
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="library-auth-profile"
							label={t("libraries.config.patronAuth.auth_profile")}
							variant="outlined"
							fullWidth
							required
							error={!!errors.authProfile}
							helperText={errors.authProfile?.message as string}
						/>
					)}
				/>
			</Section>

			<Section title={t("libraries.new.section_location")}>
				<Controller
					name={"address"}
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="library-address"
							label={t("libraries.primaryLocation.address")}
							variant="outlined"
							fullWidth
							required
							error={!!errors.address}
							helperText={errors.address?.message as string}
						/>
					)}
				/>

				<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
					{/*
					 * Plain text fields. They used to coerce with Number() on every
					 * keystroke, so pasting anything non-numeric wrote NaN into the
					 * form, rendered the literal string "NaN" back into the box, and
					 * left it uncorrectable by typing. The value is text; it is parsed
					 * once, at the mutation boundary.
					 */}
					<Controller
						name={"latitude"}
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								id="library-latitude"
								label={t("libraries.primaryLocation.latitude")}
								variant="outlined"
								fullWidth
								required
								error={!!errors.latitude}
								helperText={
									(errors.latitude?.message as string) ??
									t("libraries.new.latitude_helper")
								}
								placeholder="53.4808"
								slotProps={{
									htmlInput: { inputMode: "decimal", autoComplete: "off" },
								}}
							/>
						)}
					/>

					<Controller
						name={"longitude"}
						control={control}
						render={({ field }) => (
							<TextField
								{...field}
								id="library-longitude"
								label={t("libraries.primaryLocation.longitude")}
								variant="outlined"
								fullWidth
								required
								error={!!errors.longitude}
								helperText={
									(errors.longitude?.message as string) ??
									t("libraries.new.longitude_helper")
								}
								placeholder="-2.2426"
								slotProps={{
									htmlInput: { inputMode: "decimal", autoComplete: "off" },
								}}
							/>
						)}
					/>
				</Stack>
			</Section>

			{/*
			 * Participation used to be settable only afterwards, on the library
			 * settings page, so every new library started with both flags null.
			 * Null is "nobody has said", not "yes" - and the onboarding grid reads
			 * a library with no traffic and no answer as dormant.
			 */}
			<Section title={t("libraries.new.section_participation")}>
				<Controller
					name="isBorrowingAgency"
					control={control}
					render={({ field }) => (
						<FormControlLabel
							control={
								<Switch
									{...field}
									id="library-is-borrowing-agency"
									checked={field.value === true}
									onChange={(event) => field.onChange(event.target.checked)}
								/>
							}
							label={
								<Stack>
									<Typography variant="body1">
										{t("libraries.circulation.borrowing_status")}
									</Typography>
									<Typography variant="body2" color="text.secondary">
										{t("libraries.new.borrowing_helper")}
									</Typography>
								</Stack>
							}
							sx={{ alignItems: "flex-start" }}
						/>
					)}
				/>
				<Controller
					name="isSupplyingAgency"
					control={control}
					render={({ field }) => (
						<FormControlLabel
							control={
								<Switch
									{...field}
									id="library-is-supplying-agency"
									checked={field.value === true}
									onChange={(event) => field.onChange(event.target.checked)}
								/>
							}
							label={
								<Stack>
									<Typography variant="body1">
										{t("libraries.circulation.supplying_status")}
									</Typography>
									<Typography variant="body2" color="text.secondary">
										{t("libraries.new.supplying_helper")}
									</Typography>
								</Stack>
							}
							sx={{ alignItems: "flex-start" }}
						/>
					)}
				/>
				<Controller
					name="maxConsortialLoans"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="library-max-consortial-loans"
							label={t("libraries.max_consortial_loans")}
							variant="outlined"
							fullWidth
							error={!!errors.maxConsortialLoans}
							helperText={
								(errors.maxConsortialLoans?.message as string) ??
								t("libraries.new.max_consortial_loans_helper")
							}
							slotProps={{
								htmlInput: { inputMode: "numeric", autoComplete: "off" },
							}}
						/>
					)}
				/>
			</Section>

			<Section title={t("libraries.new.section_service")}>
				<Controller
					name="supportHours"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="library-support-hours"
							label={t("libraries.support_hours")}
							variant="outlined"
							fullWidth
							error={!!errors.supportHours}
							helperText={errors.supportHours?.message as string}
						/>
					)}
				/>
				<Controller
					name="backupDowntimeSchedule"
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="library-backup-schedule"
							label={t("libraries.service.environments.backup_schedule")}
							variant="outlined"
							fullWidth
							multiline
							rows={2}
							error={!!errors.backupDowntimeSchedule}
							helperText={errors.backupDowntimeSchedule?.message as string}
						/>
					)}
				/>
				<Controller
					name={"patronWebsite"}
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="library-patron-website"
							label={t("libraries.service.systems.patron_site")}
							variant="outlined"
							fullWidth
							error={!!errors.patronWebsite}
							helperText={errors.patronWebsite?.message as string}
						/>
					)}
				/>
				<Controller
					name={"discoverySystem"}
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="library-discovery-system"
							label={t("libraries.service.systems.discovery")}
							variant="outlined"
							fullWidth
							error={!!errors.discoverySystem}
							helperText={errors.discoverySystem?.message as string}
						/>
					)}
				/>
				<Controller
					name={"hostLmsConfiguration"}
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="library-host-lms-configuration"
							label={t("hostlms.configuration")}
							variant="outlined"
							fullWidth
							multiline
							rows={3}
							error={!!errors.hostLmsConfiguration}
							helperText={errors.hostLmsConfiguration?.message as string}
						/>
					)}
				/>
			</Section>

			<Section title={t("libraries.new.section_change_record")}>
				<Controller
					name={"reason"}
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="library-reason"
							label={t("data_change_log.reason_addition")}
							variant="outlined"
							fullWidth
							required
							error={!!errors.reason}
							helperText={errors.reason?.message as string}
						/>
					)}
				/>

				<Controller
					name={"changeReferenceUrl"}
					control={control}
					render={({ field }) => (
						<TextField
							{...field}
							id="library-change-reference-url"
							fullWidth
							variant="outlined"
							label={t("data_change_log.reference_url")}
							error={!!errors.changeReferenceUrl}
							helperText={errors.changeReferenceUrl?.message as string}
						/>
					)}
				/>
			</Section>
		</Stack>
	);
}
