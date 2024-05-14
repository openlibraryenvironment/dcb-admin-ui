import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { getGridStringOperators } from "@mui/x-data-grid-pro";
import { useTranslation } from "next-i18next";
import { getILS } from "src/helpers/getILS";
import { getLibraries } from "src/queries/queries";

// This is the unique content for the 'welcome' page for when a consortium is operational
export default function OperatingWelcome() {
	const { t } = useTranslation();
	const filterOperators = getGridStringOperators().filter(({ value }) =>
		[
			"equals",
			"contains" /* add more over time as we build in support for them */,
		].includes(value),
	);

	return (
		<ServerPaginationGrid
			query={getLibraries}
			coreType="libraries"
			type="libraries"
			columnVisibilityModel={{
				id: false,
				hostLmsCatalogue: false,
				hostLmsCirculation: false,
				authProfile: false,
			}}
			columns={[
				{
					field: "abbreviatedName",
					headerName: "Abbreviated name",
					flex: 0.3,
					filterOperators,
				},
				{
					field: "fullName",
					headerName: "Full name",
					flex: 0.5,
					filterOperators,
				},
				{
					field: "agencyCode",
					headerName: "Agency code",
					flex: 0.3,
					filterOperators,
				},
				{
					field: "ils",
					headerName: "ILS",
					flex: 0.3,
					filterOperators,
					valueGetter: (params: {
						row: { agency: { hostLms: { lmsClientClass: string } } };
					}) => getILS(params?.row?.agency?.hostLms?.lmsClientClass),
					// These default to the ILS and ingest of the first Host LMS
				},
				{
					field: "clientConfigIngest",
					headerName: "Ingest enabled",
					minWidth: 50,
					flex: 0.3,
					filterOperators,
					valueGetter: (params: {
						row: { agency: { hostLms: { clientConfig: { ingest: boolean } } } };
					}) => params?.row?.agency?.hostLms?.clientConfig?.ingest,
				},
				// Hidden by default
				{
					field: "authProfile",
					headerName: "Auth profile",
					flex: 0.5,
					filterOperators,
					valueGetter: (params: { row: { agency: { authProfile: string } } }) =>
						params?.row?.agency?.authProfile,
				},
				{
					field: "id",
					headerName: "Library ID",
					flex: 0.5,
					filterOperators,
				},
				{
					field: "hostLmsCirculation",
					headerName: "Host LMS (circulation)",
					flex: 0.5,
					filterOperators,
					valueGetter: (params: {
						row: { agency: { hostLms: { code: string } } };
					}) => params?.row?.agency?.hostLms?.code,
				},
				{
					field: "hostLmsCatalogue",
					headerName: "Host LMS (catalogue)",
					flex: 0.5,
					filterOperators,
					valueGetter: (params: { row: { secondHostLms: { code: string } } }) =>
						params?.row?.secondHostLms?.code,
				},
			]}
			selectable={true}
			pageSize={20}
			noDataMessage={t("libraries.none_available")}
			noResultsMessage={t("libraries.none_found")}
			searchPlaceholder={t("libraries.search_placeholder")}
			sortDirection="ASC"
			sortAttribute="fullName"
			sortModel={[{ field: "fullName", sort: "asc" }]}
		/>
	);
}
