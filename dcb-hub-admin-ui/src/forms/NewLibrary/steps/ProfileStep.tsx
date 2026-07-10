import { useTranslation } from "react-i18next";
import { useFormContext, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import {
	Autocomplete,
	createFilterOptions,
	Stack,
	TextField,
} from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getAgencies } from "@queries/getAgencies";

const filter = createFilterOptions<any>();
// needs lat/long
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
			gqlClient.request<any>(getAgencies, {
				order: "code",
				orderBy: "ASC",
				pageno: 0,
				pagesize: 1000,
				query: "",
			}),
		staleTime: 1000 * 60 * 5, // Just in case somebody is constantly going back and forth
	});

	const agencyOptions =
		agenciesData?.agencies?.content?.map((item: any) => ({
			label: item.name,
			value: item.code,
		})) || [];

	return (
		<Stack direction="column" spacing={2} sx={{ mt: 1 }}>
			<Controller
				name="fullName"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label={t("libraries.name")}
						variant="outlined"
						fullWidth
						required
						error={!!errors.fullName}
						helperText={errors.fullName?.message as string}
					/>
				)}
			/>
			<Controller
				name="shortName"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
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
						label={t("libraries.abbreviated_name")}
						variant="outlined"
						fullWidth
						required
						error={!!errors.abbreviatedName}
						helperText={errors.abbreviatedName?.message as string}
					/>
				)}
			/>
			<Controller
				name="agencyCode"
				control={control}
				render={({ field }) => (
					<Autocomplete
						{...field}
						freeSolo
						options={agencyOptions}
						loading={agenciesLoading}
						// 1. Dynamically inject the "Add..." option if no exact match exists
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
									label: t("libraries.new.add_agency", { code: inputValue }), // Or just `Add "${inputValue}"` if you lack translation
								});
							}
							return filtered;
						}}
						// 2. Safely extract the label based on what type of option it is
						getOptionLabel={(option: any) => {
							if (typeof option === "string") return option;
							if (option.inputValue) return option.inputValue;
							return option.label || option.value || "";
						}}
						// 3. Handle the selection cleanly without raw keystroke capture
						onChange={(_, newValue: any) => {
							if (typeof newValue === "string") {
								// User pressed enter on a raw string
								field.onChange(newValue);
							} else if (newValue && newValue.inputValue) {
								// User selected the dynamically generated "Add" option
								field.onChange(newValue.inputValue);
							} else {
								// User selected an existing agency option
								field.onChange(newValue?.value || "");
							}
						}}
						onBlur={field.onBlur} // Ensures RHF validation triggers when tabbing away
						value={
							agencyOptions.find((opt: any) => opt.value === field.value) ||
							field.value ||
							null
						}
						renderInput={(params) => (
							<TextField
								{...params}
								required
								label={t("libraries.new.agency")}
								error={!!errors.agencyCode}
								helperText={errors.agencyCode?.message as string}
							/>
						)}
					/>
				)}
			/>
			<Controller
				name="supportHours"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label={t("libraries.support_hours")}
						variant="outlined"
						fullWidth
						required
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
				name="type"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label={t("libraries.type")}
						variant="outlined"
						fullWidth
						required
						error={!!errors.type}
						helperText={errors.type?.message as string}
					/>
				)}
			/>

			<Controller
				name={"authProfile"}
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label={t("libraries.config.patronAuth.auth_profile")}
						variant="outlined"
						fullWidth
						required
						error={!!errors.authProfile}
						helperText={errors.authProfile?.message as string}
					/>
				)}
			/>
			<Controller
				name={"address"}
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label={t("libraries.primaryLocation.address")}
						variant="outlined"
						fullWidth
						required
						error={!!errors.address}
						helperText={errors.address?.message as string}
					/>
				)}
			/>

			<Controller
				name={"latitude"}
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label={t("libraries.primaryLocation.latitude")}
						variant="outlined"
						fullWidth
						required
						error={!!errors.latitude}
						helperText={errors.latitude?.message as string}
						onChange={(e) => {
							const value = e.target.value;
							field.onChange(value === "" ? undefined : Number(value));
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
						label={t("libraries.primaryLocation.longitude")}
						variant="outlined"
						fullWidth
						required
						error={!!errors.longitude}
						helperText={errors.longitude?.message as string}
						onChange={(e) => {
							const value = e.target.value;
							field.onChange(value === "" ? undefined : Number(value));
						}}
					/>
				)}
			/>

			<Controller
				name={"patronWebsite"}
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label={t("libraries.service.systems.patron_site")}
						variant="outlined"
						fullWidth
						error={!!errors.patronWebsite}
						helperText={errors.patronWebsite?.message as string}
					/>
				)}
			/>

			<Controller
				name={"hostLmsConfiguration"}
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
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

			<Controller
				name={"discoverySystem"}
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						label={t("libraries.service.systems.discovery")}
						variant="outlined"
						fullWidth
						error={!!errors.discoverySystem}
						helperText={errors.discoverySystem?.message as string}
					/>
				)}
			/>

			<Controller
				name={"reason"}
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
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
						fullWidth
						variant="outlined"
						label={t("data_change_log.reference_url")}
						error={!!errors.changeReferenceUrl}
						helperText={errors.changeReferenceUrl?.message as string}
					/>
				)}
			/>
		</Stack>
	);
}
