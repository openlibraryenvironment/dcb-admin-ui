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
	const { loading, error, data } = useQuery(getLocationForPatronRequestGrid, {
		variables: {
			query: `id:${locationId}`,
			pageno: 0,
			pagesize: 100,
			orderBy: "DESC",
			order: "name",
			errorPolicy: "all",
		},
		skip: !locationId,
	});

	if (loading) return t("common.loading");
	if (error || data.locations.totalSize == 0) return t("locations.not_found");

	const location: Location = data?.locations?.content?.[0];
	return location && linkable ? (
		<Link href={`/locations/${locationId}`}>{location.name}</Link>
	) : (
		<>{location?.name}</>
	);
};
