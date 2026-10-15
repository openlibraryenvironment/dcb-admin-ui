import { useTranslation } from "react-i18next";
import { Autocomplete, TextField, Chip } from "@mui/material";

import type { ScopeOption } from "@helpers/insightsScope";

/**
 * Narrows the whole dashboard to any set of libraries, or to a library group (e.g. "all
 * Polaris libraries") which expands to its members' Host LMS codes.
 *
 * It does not fetch. The page it sits on needs the same list to resolve the scope a URL
 * carries BEFORE the first query goes out, so the list is loaded there and the options
 * arrive as a prop - see insightsScopeOptionsQuery.
 */
export default function ScopeSelector({
	options,
	value,
	onChange,
	loading = false,
	failed = false,
}: {
	options: ScopeOption[];
	value: ScopeOption[];
	onChange: (selected: ScopeOption[]) => void;
	loading?: boolean;
	/** Says so, rather than offering an empty list that reads as "no libraries". */
	failed?: boolean;
}) {
	const { t } = useTranslation();

	return (
		<Autocomplete<ScopeOption, true>
			multiple
			options={options}
			value={value}
			onChange={(_e, selected) => onChange(selected)}
			loading={loading}
			disabled={failed}
			getOptionLabel={(o) => o.label}
			isOptionEqualToValue={(a, b) => a.kind === b.kind && a.id === b.id}
			groupBy={(o) =>
				o.kind === "group"
					? t("insights.scope.groups")
					: t("insights.scope.libraries")
			}
			renderValue={(selected, getItemProps) =>
				selected.map((option, index) => {
					const { key, ...itemProps } = getItemProps({ index });
					return (
						<Chip
							key={key}
							label={option.label}
							size="small"
							color={option.kind === "group" ? "primary" : "default"}
							{...itemProps}
						/>
					);
				})
			}
			renderInput={(params) => (
				<TextField
					{...params}
					size="small"
					label={t("insights.scope.label")}
					placeholder={t("insights.scope.placeholder")}
					error={failed}
					helperText={failed ? t("insights.scope.failed") : undefined}
				/>
			)}
			sx={{ minWidth: 320, maxWidth: 640 }}
		/>
	);
}
