import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";

import Link from "@components/Link/Link";
import { Location } from "@models/Location";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getLocationForPatronRequestGrid } from "@queries/getLocationForPatronRequestGrid";

interface LocationCellProps {
	locationId: string;
	linkable: boolean;
}

export const LocationCell = ({ locationId, linkable }: LocationCellProps) => {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();

	const { data, isLoading, isError } = useQuery({
		queryKey: ["locationForGrid", locationId],
		queryFn: async () => {
			return gqlClient.request<any>(getLocationForPatronRequestGrid, {
				query: `id:${locationId}`,
				pageno: 0,
				pagesize: 1,
				orderBy: "DESC",
				order: "name",
			});
		},
		enabled: !!locationId, // Skip query execution if ID is blank
	});

	if (isLoading) return <Box component="span">{t("common.loading")}</Box>;

	const locationsList = data?.locations?.content;
	if (isError || !locationsList || locationsList.length === 0) {
		return (
			<Box component="span" sx={{ color: "error.main" }}>
				{t("locations.not_found")}
			</Box>
		);
	}

	const location: Location = locationsList[0];

	return location && linkable ? (
		<Link href={`/locations/${locationId}`}>{location.name}</Link>
	) : (
		<Box component="span">{location?.name}</Box>
	);
};
