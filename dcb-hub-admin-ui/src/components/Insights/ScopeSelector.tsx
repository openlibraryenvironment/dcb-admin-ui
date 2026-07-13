import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Autocomplete, TextField, Chip } from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getLibraries } from "@queries/getLibraries";

export type ScopeOption = {
	kind: "group" | "library";
	id: string;
	label: string;
	codes: string[]; // Host LMS codes this option resolves to
};

// Lets a consortium admin scope the whole dashboard to any set of libraries, or to a
// library group (e.g. "all Polaris libraries") which expands to its members' Host LMS
// codes. Emits the resolved, de-duplicated code list; empty = whole consortium.
export default function ScopeSelector({
	value,
	onChange,
}: {
	value: ScopeOption[];
	onChange: (selected: ScopeOption[]) => void;
}) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();

	const { data } = useQuery({
		queryKey: ["insights-scope-libraries"],
		queryFn: () =>
			gqlClient.request<any>(getLibraries, {
				pageno: 0,
				pagesize: 1000,
				order: "fullName",
				orderBy: "ASC",
				query: "",
			}),
		staleTime: 5 * 60 * 1000,
	});

	const options = useMemo<ScopeOption[]>(() => {
		const libs = data?.libraries?.content ?? [];

		const libraryOptions: ScopeOption[] = libs
			.filter((l: any) => l.agency?.hostLms?.code)
			.map((l: any) => ({
				kind: "library" as const,
				id: l.id,
				label: l.fullName,
				codes: [l.agency.hostLms.code],
			}));

		// Derive groups from library membership, collecting each group's member codes.
		const groupMap = new Map<string, { label: string; codes: Set<string> }>();
		for (const l of libs) {
			const code = l.agency?.hostLms?.code;
			for (const m of l.membership ?? []) {
				const g = m.libraryGroup;
				if (!g) continue;
				if (!groupMap.has(g.id)) {
					groupMap.set(g.id, { label: g.name, codes: new Set() });
				}
				if (code) groupMap.get(g.id)!.codes.add(code);
			}
		}
		const groupOptions: ScopeOption[] = Array.from(groupMap.entries()).map(
			([id, g]) => ({
				kind: "group" as const,
				id,
				label: g.label,
				codes: Array.from(g.codes),
			}),
		);

		return [...groupOptions, ...libraryOptions];
	}, [data]);

	return (
		<Autocomplete<ScopeOption, true>
			multiple
			options={options}
			value={value}
			onChange={(_e, selected) => onChange(selected)}
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
				/>
			)}
			sx={{ minWidth: 320, maxWidth: 640 }}
		/>
	);
}
