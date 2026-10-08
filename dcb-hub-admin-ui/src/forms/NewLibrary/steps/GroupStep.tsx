import { useTranslation } from "react-i18next";
import { useFormContext, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import {
	Alert,
	Autocomplete,
	Stack,
	TextField,
	Typography,
} from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getGroupsSelection } from "@queries/getGroupsSelection";
import type { LoadGroupsSelectionQueryVariables } from "@generated/graphql";
import { nonCriticalQuery } from "@helpers/queryPolicy";

interface GroupStepProps {
	/**
	 * The consortium's own group. The library is added to it automatically when
	 * it is created, so it is named here and excluded from the picker rather
	 * than offered as a choice the user has already had made for them.
	 *
	 * Id only - the consortium query cannot safely return the group's name (see
	 * getConsortiumBasics), so the name is resolved below from the groups list
	 * this step already loads.
	 */
	consortiumGroup?: { id: string } | null;
	/**
	 * Whether the library is actually in that group yet.
	 *
	 * This step used to infer the membership from the group merely EXISTING, so a
	 * failed add was announced as a success on the very next screen and the group
	 * was hidden from the picker - the user was told it was done and given no way
	 * to do it. Resuming a library that was created before the wizard added
	 * membership, or by the importer, hit that every time.
	 */
	isInConsortiumGroup?: boolean;
}

export default function GroupStep({
	consortiumGroup,
	isInConsortiumGroup = false,
}: GroupStepProps) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const {
		control,
		formState: { errors },
	} = useFormContext();

	const { data: groupsData, isLoading } = useQuery({
		...nonCriticalQuery,
		queryKey: ["groupsSelection"],
		queryFn: () =>
			gqlClient.request<any, LoadGroupsSelectionQueryVariables>(
				getGroupsSelection,
				{
					order: "name",
					orderBy: "ASC",
					pageno: 0,
					pagesize: 1000,
				},
			),
		staleTime: 1000 * 60 * 5, // Just in case somebody is constantly going back and forth
	});

	const allGroups = groupsData?.libraryGroups?.content ?? [];

	const groupOptions = allGroups
		// Hidden only once the membership exists - re-adding it is pointless.
		// While it does not, it is the one group the user most needs offered.
		.filter(
			(item: any) => !(isInConsortiumGroup && item.id === consortiumGroup?.id),
		)
		.map((item: any) => ({
			label: item.name,
			value: item.id,
		}));

	// Named where we can name it; the generic wording covers the moment before
	// the list arrives rather than flashing an empty name into a sentence.
	const consortiumGroupName = consortiumGroup
		? allGroups.find((item: any) => item.id === consortiumGroup.id)?.name
		: undefined;

	return (
		<Stack spacing={3} sx={{ mt: 1 }}>
			{consortiumGroup &&
				(isInConsortiumGroup ? (
					<Alert severity="success">
						{consortiumGroupName
							? t("libraries.new.consortium_group_added", {
									group: consortiumGroupName,
								})
							: t("libraries.new.consortium_group_added_generic")}
					</Alert>
				) : (
					<Alert severity="info">
						{t("libraries.new.consortium_group_pending")}
					</Alert>
				))}

			<Typography>{t("libraries.new.group_explanation")}</Typography>

			<Controller
				name="groupId"
				control={control}
				render={({ field }) => (
					<Autocomplete
						{...field}
						options={groupOptions}
						loading={isLoading}
						onChange={(_, newValue: any) =>
							field.onChange(newValue?.value || "")
						}
						value={
							groupOptions.find((opt: any) => opt.value === field.value) || null
						}
						getOptionLabel={(option: any) => option.label || ""}
						isOptionEqualToValue={(option, value) =>
							option.value === value.value
						}
						noOptionsText={t("libraries.new.no_other_groups")}
						renderInput={(params) => (
							<TextField
								{...params}
								id="library-group"
								label={t("libraries.new.other_group")}
								error={!!errors.groupId}
								helperText={
									(errors.groupId?.message as string) ??
									t("libraries.new.other_group_helper")
								}
							/>
						)}
					/>
				)}
			/>
		</Stack>
	);
}
