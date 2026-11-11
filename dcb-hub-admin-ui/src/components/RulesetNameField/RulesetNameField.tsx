import { useTranslation } from "react-i18next";
import { Controller, useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Autocomplete, TextField } from "@mui/material";
import { useAuth } from "react-oidc-context";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { nonCriticalQuery } from "@helpers/queryPolicy";
import { serverAdmits } from "@constants/serverRoles";
import { RULESET_STALE_TIME, rulesetKeys } from "@/queryOptions/rulesets";

/** A consortium keeps tens of rulesets; one page of 100 holds them all. */
const RULESET_PAGE_SIZE = 100;

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
	const auth = useAuth();
	// Without the list the field is free entry; a consortium administrator may create a Host
	// LMS, and a 403 here must not replace the page they are creating it on
	const canListRulesets = serverAdmits(
		"readRulesets",
		auth?.user?.profile?.roles as string[] | undefined,
	);

	const { data: rulesetNames = [], isLoading } = useQuery({
		...nonCriticalQuery,
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
		staleTime: RULESET_STALE_TIME,
		enabled: canListRulesets,
	});

	return (
		<Controller
			name={name}
			control={control}
			render={({ field }) => {
				const value = field.value ?? "";
				const unknown =
					canListRulesets &&
					value !== "" &&
					!isLoading &&
					!rulesetNames.includes(value);

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
