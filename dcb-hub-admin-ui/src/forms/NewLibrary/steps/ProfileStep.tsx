import { useTranslation } from "react-i18next";
import { useFormContext, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Autocomplete, Stack, TextField } from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getAgencies } from "@queries/getAgencies";

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
						getOptionLabel={(option: any) => option.label || option}
						onChange={(_, newValue: any) =>
							field.onChange(newValue?.value || newValue || "")
						}
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
		</Stack>
	);
}
