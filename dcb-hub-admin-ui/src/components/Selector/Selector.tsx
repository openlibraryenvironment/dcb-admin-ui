import useCode from "@hooks/useCode";
import { Autocomplete, TextField } from "@mui/material";
import { getHostLms } from "src/queries/queries";
import { useQuery } from "@apollo/client/react";

type SelectorType = {
	optionsType?: string;
	options?: any;
};

// This is a selector of HostLMS present on the DCB instance.
// It can also be further genericised to support selecting any value -
// for example requests, locations etc

export default function Selector({ optionsType }: SelectorType) {
	const updateCode = useCode((state) => state.updateCode);
	const { data, loading, fetchMore } = useQuery(getHostLms, {
		variables: {
			query: "name: *",
			order: "name",
			orderBy: "ASC",
			pagesize: 100,
			pageno: 0,
		},
		fetchPolicy: "network-only", // This is needed to stop the selector getting out-of-date info, as it has no polling ability.
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
	const codes = hostLmsData?.map((item: { code: string; id: string }) => ({
		label: item.code,
		value: item.id,
	}));
	// Here, we map across the names and associated IDs for each HostLMS option.
	// This means that the ID will be available for us when we need to import for a specific HostLMS.
	return (
		<Autocomplete
			onChange={(event, value) => {
				updateCode(value?.label);
			}}
			// Here we can store the value to be used for import, and supply the necessary hostlms ID
			disablePortal
			loading={loading}
			id="selector-combo-box"
			options={codes ?? []}
			getOptionLabel={(option: any) => option.label}
			fullWidth
			renderInput={(params: any) => (
				<TextField {...params} required label={optionsType} />
			)}
			isOptionEqualToValue={(option, value) => option.id === value.id}
		/>
	);
}
