import { useQuery } from "@apollo/client";
import Link from "@components/Link/Link";
import { Location } from "@models/Location";
import { useTranslation } from "next-i18next";
import { getLocationForPatronRequestGrid } from "src/queries/queries";

export const LocationCell = ({ locationId }: { locationId: string }) => {
	const { t } = useTranslation();
	const { loading, error, data } = useQuery(getLocationForPatronRequestGrid, {
		variables: { query: `id:${locationId}` },
		skip: !locationId,
	});

	if (loading) return t("common.loading");
	if (error) return "Error";

	const location: Location = data?.locations?.content?.[0];
	return location ? (
		<Link href={`/locations/${locationId}`}>{location.name}</Link>
	) : (
		<>{locationId}</>
	);
};
