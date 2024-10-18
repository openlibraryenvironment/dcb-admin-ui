import useCode from "@hooks/useCode";
import { Autocomplete, TextField } from "@mui/material";
import { getHostLms } from "src/queries/queries";
import { useQuery } from "@apollo/client/react";

type SelectorType = {
	optionsType: string;
};

type HostLmsOption = {
	label: string;
	value: string;
};

// Host LMS Selector: Provides the drop-down selection menu for Host LMS for mappings import

export default function Selector({ optionsType }: SelectorType) {
	const { code, updateCode } = useCode();
	const { data, loading, fetchMore } = useQuery(getHostLms, {
		variables: {
			query: "name: *",
			order: "name",
			orderBy: "ASC",
			pagesize: 100,
			pageno: 0,
		},
		fetchPolicy: "cache-and-network", // This is needed to stop the selector getting out-of-date info, as it has no polling ability.
		onCompleted: (data) => {
			// Check if we have all the hostLms
			if (data.hostLms.content.length < data.hostLms.totalSize) {
				// Calculate how many pages we need to fetch - must match page size.
				const totalPages = Math.ceil(data.hostLms.totalSize / 100);
				// Create an array of promises for each additional page
				// This ensures we get all the pages - when using standard fetchmore we were only getting a max of 2 additional pages.
				const fetchPromises = Array.from(
					{ length: totalPages - 1 },
					(_, index) =>
						fetchMore({
							variables: {
								pageno: index + 1,
							},
							updateQuery: (prev, { fetchMoreResult }) => {
								if (!fetchMoreResult) return prev;
								return {
									hostLms: {
										...fetchMoreResult.hostLms,
										content: [
											...prev.hostLms.content,
											...fetchMoreResult.hostLms.content,
										],
									},
								};
							},
						}),
				);
				// Execute all fetch promises
				Promise.all(fetchPromises).catch((error) =>
					console.error("Error fetching additional Host LMS:", error),
				);
			}
		},
	});

	// To extend this component further consider principles from https://mui.com/material-ui/react-autocomplete/#load-on-open
	const hostLmsData = data?.hostLms?.content;
	const options: HostLmsOption[] =
		hostLmsData?.map((item: { code: string; id: string }) => ({
			label: item.code,
			value: item.id,
		})) || [];

	// Find the currently selected option based on the code in the Zustand store
	const selectedOption =
		options.find((option) => option.label === code) || null;

	return (
		<Autocomplete
			value={selectedOption}
			onChange={(event, newValue: HostLmsOption | null) => {
				updateCode(newValue?.label || "");
			}}
			disablePortal
			loading={loading}
			id="selector-combo-box"
			options={options}
			getOptionLabel={(option: HostLmsOption) => option.label}
			fullWidth
			renderInput={(params: any) => (
				<TextField {...params} required label={optionsType} />
			)}
			isOptionEqualToValue={(option, value) => option.value === value.value}
		/>
	);
}
