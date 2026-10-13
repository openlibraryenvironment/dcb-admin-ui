import { useTranslation } from "react-i18next";
import { Controller, useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Autocomplete, TextField } from "@mui/material";

import { useDcbRestClient } from "@hooks/useDcbRestClient";

/** A consortium keeps tens of rulesets; one page of 100 holds them all. */
const RULESET_PAGE_SIZE = 100;

const rulesetKeys = {
	names: () => ["objectRulesets", "names"] as const,
};

/**
 * A suppression ruleset name, picked from the rulesets dcb-service holds. A name that
 * matches none of them is a ruleset that silently suppresses nothing, so the list is
 * offered; free entry stays allowed for a ruleset about to be created.
 */
export default function RulesetNameField({
	name,
	id,
	label,
	defaultName,
	disabled = false,
}: {
	name: string;
	id: string;
	label: string;
	/** What dcb-service applies when this is left blank, where it applies one. */
	defaultName?: string;
	disabled?: boolean;
}) {
	const { t } = useTranslation();
	const { control } = useFormContext();
	const client = useDcbRestClient();

	const { data: rulesetNames = [], isLoading } = useQuery({
		queryKey: rulesetKeys.names(),
		queryFn: async () => {
			const response = await client.get("/object-rules", {
				params: { size: RULESET_PAGE_SIZE },
			});
			return ((response.data?.content ?? []) as { name?: string }[])
				.map((ruleset) => ruleset.name)
				.filter((rulesetName): rulesetName is string => !!rulesetName)
				.sort();
		},
		// Rulesets change when an administrator edits one, not while a form is open
		staleTime: 10 * 60 * 1000,
	});

	return (
		<Controller
			name={name}
			control={control}
			render={({ field }) => {
				const value = field.value ?? "";
				const unknown =
					value !== "" && !isLoading && !rulesetNames.includes(value);

				return (
					<Autocomplete
						freeSolo
						fullWidth
						disabled={disabled}
						loading={isLoading}
						options={rulesetNames}
						value={value}
						onChange={(_event, chosen) => field.onChange(chosen ?? "")}
						onInputChange={(_event, typed, reason) => {
							if (reason === "input" || reason === "clear")
								field.onChange(typed);
						}}
						onBlur={field.onBlur}
						renderInput={(params) => (
							<TextField
								{...params}
								id={id}
								label={label}
								placeholder={defaultName}
								helperText={
									unknown
										? t("hostlms.ruleset_not_found", { name: value })
										: defaultName
											? t("hostlms.ruleset_default", { name: defaultName })
											: undefined
								}
							/>
						)}
					/>
				);
			}}
		/>
	);
}
