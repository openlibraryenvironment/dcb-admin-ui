import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Autocomplete, TextField } from "@mui/material";

import useCode from "@hooks/useCode";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getHostLms } from "@queries/getHostLms";
import type { LoadHostLmsQueryVariables } from "@generated/graphql";

type SelectorType = {
	optionsType: string;
};

type HostLmsOption = {
	label: string;
	value: string;
};

export default function Selector({ optionsType }: SelectorType) {
	const { code, updateCode } = useCode();
	const gqlClient = useGraphQLClient();

	// Modernized Host LMS Lookup with automatic complete pagination
	const { data: options = [], isLoading } = useQuery({
		queryKey: ["hostLmsDropdownOptions"],
		queryFn: async () => {
			const variables = {
				query: "name: *",
				order: "name",
				orderBy: "ASC",
				pagesize: 100,
				pageno: 0,
			};

			// Fetch page 0
			const firstPage = await gqlClient.request<any, LoadHostLmsQueryVariables>(
				getHostLms,
				variables,
			);
			let allHostLms = [...(firstPage?.hostLms?.content || [])];
			const totalSize = firstPage?.hostLms?.totalSize || 0;

			// If more pages exist, fetch them in parallel natively
			if (allHostLms.length < totalSize) {
				const totalPages = Math.ceil(totalSize / 100);
				const promises = [];

				for (let i = 1; i < totalPages; i++) {
					promises.push(
						gqlClient.request<any, LoadHostLmsQueryVariables>(getHostLms, {
							...variables,
							pageno: i,
						}),
					);
				}

				const results = await Promise.all(promises);
				results.forEach((res) => {
					allHostLms = [...allHostLms, ...(res?.hostLms?.content || [])];
				});
			}

			// Format the complete dataset directly inside the query execution thread
			return allHostLms.map((item: { code: string; id: string }) => ({
				label: item.code,
				value: item.id,
			}));
		},
	});

	// Dynamic store element mapping
	const selectedOption = useMemo(() => {
		return options.find((option) => option.label === code) || null;
	}, [options, code]);

	return (
		<Autocomplete
			value={selectedOption}
			onChange={(_event, newValue: HostLmsOption | null) => {
				updateCode(newValue?.label || "");
			}}
			disablePortal
			loading={isLoading}
			id="selector-combo-box"
			options={options}
			getOptionLabel={(option: HostLmsOption) => option.label}
			fullWidth
			renderInput={(params) => (
				<TextField {...params} required label={optionsType} />
			)}
			isOptionEqualToValue={(option, value) => option.value === value.value}
		/>
	);
}
