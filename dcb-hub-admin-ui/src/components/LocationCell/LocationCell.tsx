import { useQuery } from "@apollo/client";
import Link from "@components/Link/Link";
import { Location } from "@models/Location";
import { useTranslation } from "next-i18next";
import { getLocationForPatronRequestGrid } from "src/queries/queries";

export const LocationCell = ({
	locationId,
	linkable,
}: {
	locationId: string;
	linkable: boolean;
}) => {
	const { t } = useTranslation();
	const { data, fetchMore, loading, error } = useQuery(
		getLocationForPatronRequestGrid,
		{
			variables: {
				query: "",
				order: "name",
				orderBy: "ASC",
				pagesize: 100,
				pageno: 0,
			},
			skip: !locationId,
			// Adjust the query as needed to get all locations
			onCompleted: (data) => {
				if (data.locations.content.length < data.locations.totalSize) {
					// Calculate how many pages we need to fetch - must match page size above^^.
					const totalPages = Math.ceil(data.locations.totalSize / 100);
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
										locations: {
											...fetchMoreResult.locations,
											content: [
												...prev.locations.content,
												...fetchMoreResult.locations.content,
											],
										},
									};
								},
							}),
					);
					// Execute all fetch promises
					Promise.all(fetchPromises).catch((error) =>
						console.error("Error fetching additional locations:", error),
					);
				}
			},
		},
	);

	if (loading) return t("common.loading");
	if (error) return "Error";

	const location: Location = data?.locations?.content?.[0];
	return location && linkable ? (
		<Link href={`/locations/${locationId}`}>{location.name}</Link>
	) : (
		<>{location?.name}</>
	);
};
