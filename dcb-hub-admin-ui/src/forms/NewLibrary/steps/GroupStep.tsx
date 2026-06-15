import { useTranslation } from "react-i18next";
import { useFormContext, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Autocomplete, Stack, TextField, Typography } from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getGroupsSelection } from "@queries/getGroupsSelection";

export default function GroupStep({ libraryId }: { libraryId?: string }) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const {
		control,
		formState: { errors },
	} = useFormContext();

	const { data: groupsData, isLoading } = useQuery({
		queryKey: ["groupsSelection"],
		queryFn: () =>
			gqlClient.request<any>(getGroupsSelection, {
				order: "name",
				orderBy: "ASC",
				pageno: 0,
				pagesize: 1000,
				query: "",
			}),
	});

	const groupOptions =
		groupsData?.libraryGroups?.content?.map((item: any) => ({
			label: item.name,
			value: item.id,
		})) || [];

	return (
		<Stack spacing={3} sx={{ mt: 1 }}>
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
						renderInput={(params) => (
							<TextField
								{...params}
								label={t("groups.name")}
								error={!!errors.groupId}
								helperText={errors.groupId?.message as string}
							/>
						)}
					/>
				)}
			/>
		</Stack>
	);
}
