import { useTranslation } from "react-i18next";
import { Controller, useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import {
	Alert,
	Autocomplete,
	Skeleton,
	Stack,
	TextField,
	Typography,
} from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getHostLmsSelection } from "@queries/getHostLmsSelection";
import { getILS } from "@helpers/getILS";
import type { LoadHostLmsSelectionQueryVariables } from "@generated/graphql";

/**
 * Picks the existing Host LMS a new library belongs to.
 *
 * "Use existing system" had no step at all: the wizard went straight to the
 * profile, so `hostLmsCode` - which LibraryInput declares `String!` - was still
 * the empty string when createLibrary ran, and the mapping and location steps
 * were handed an empty code to import against. Every library added through that
 * branch was attached to nothing.
 */
export default function HostLmsSelectStep() {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const {
		control,
		setValue,
		formState: { errors },
	} = useFormContext();

	const { data, isLoading, isError } = useQuery({
		queryKey: ["hostLmsSelection"],
		queryFn: () =>
			gqlClient.request<any, LoadHostLmsSelectionQueryVariables>(
				getHostLmsSelection,
				{ pagesize: 1000 },
			),
		staleTime: 1000 * 60 * 5,
	});

	const options = (data?.hostLms?.content ?? []) as {
		id: string;
		code: string;
		name: string;
		lmsClientClass: string;
	}[];

	if (isLoading)
		return (
			<Stack spacing={2} sx={{ mt: 1 }}>
				{/* Matches the rendered height of the paragraph plus the input, so
				    the step does not jump when the list arrives. */}
				<Skeleton variant="text" height={24} />
				<Skeleton variant="rounded" height={56} />
			</Stack>
		);

	if (isError)
		return (
			<Alert severity="error" sx={{ mt: 1 }}>
				{t("hostlms.alert_text")}
			</Alert>
		);

	if (options.length === 0)
		return (
			<Alert severity="warning" sx={{ mt: 1 }}>
				{t("hostlms.none_to_select")}
			</Alert>
		);

	return (
		<Stack spacing={3} sx={{ mt: 1 }}>
			<Typography>{t("hostlms.select_existing_explanation")}</Typography>

			<Controller
				name="hostLmsCode"
				control={control}
				render={({ field }) => (
					<Autocomplete
						options={options}
						getOptionLabel={(option) => `${option.code} - ${option.name}`}
						isOptionEqualToValue={(option, value) =>
							option.code === value?.code
						}
						value={
							options.find((option) => option.code === field.value) ?? null
						}
						onChange={(_, selected) => {
							field.onChange(selected?.code ?? "");
							// The client class drives whether numeric range mappings are
							// needed and which ILS the locations step imports for, so it
							// has to travel with the code rather than be inferred later.
							setValue("lmsClientClass", selected?.lmsClientClass ?? "");
							setValue("hostLmsName", selected?.name ?? "");
						}}
						onBlur={field.onBlur}
						renderInput={(params) => (
							<TextField
								{...params}
								id="existing-host-lms"
								required
								label={t("hostlms.hostlms_one")}
								error={!!errors.hostLmsCode}
								helperText={
									(errors.hostLmsCode?.message as string) ??
									t("hostlms.select_existing_helper")
								}
							/>
						)}
						renderOption={(props, option) => {
							const { key, ...optionProps } = props as any;
							return (
								<li key={key} {...optionProps}>
									<Stack>
										<Typography variant="body1">
											{option.code} - {option.name}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{getILS(option.lmsClientClass)}
										</Typography>
									</Stack>
								</li>
							);
						}}
					/>
				)}
			/>
		</Stack>
	);
}
