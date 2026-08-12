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
}

export default function GroupStep({ consortiumGroup }: GroupStepProps) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const {
		control,
		formState: { errors },
	} = useFormContext();

	const { data: groupsData, isLoading } = useQuery({
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
		// Offering the consortium group would let the user re-add a membership
		// the wizard has already created.
		.filter((item: any) => item.id !== consortiumGroup?.id)
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
			{consortiumGroup && (
				<Alert severity="success">
					{consortiumGroupName
						? t("libraries.new.consortium_group_added", {
								group: consortiumGroupName,
							})
						: t("libraries.new.consortium_group_added_generic")}
				</Alert>
			)}

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
