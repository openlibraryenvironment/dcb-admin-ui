import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { useTranslation } from "next-i18next";
import { equalsOnly, standardFilters } from "src/helpers/filters";
import { getILS } from "src/helpers/getILS";
import { getLibraries } from "src/queries/queries";

// This is the unique content for the 'welcome' page for when a consortium is operational
export default function OperatingWelcome() {
	const { t } = useTranslation();

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
					filterOperators: standardFilters,
				},
				{
					field: "fullName",
					headerName: "Full name",
					flex: 0.5,
					filterOperators: standardFilters,
				},
				{
					field: "agencyCode",
					headerName: "Agency code",
					flex: 0.3,
					filterOperators: standardFilters,
				},
				{
					field: "ils",
					headerName: "ILS",
					flex: 0.3,
					filterable: false,
					sortable: false,
					valueGetter: (value, row) =>
						getILS(row?.agency?.hostLms?.lmsClientClass),
					// These default to the ILS and ingest of the first Host LMS
				},
				{
					field: "clientConfigIngest",
					headerName: "Ingest enabled",
					minWidth: 50,
					flex: 0.3,
					filterable: false,
					sortable: false,
					valueGetter: (value, row) =>
						row?.agency?.hostLms?.clientConfig?.ingest,
				},
				// Hidden by default
				{
					field: "authProfile",
					headerName: "Auth profile",
					flex: 0.5,
					filterable: false,
					sortable: false,
					valueGetter: (value, row) => row?.agency?.authProfile,
				},
				{
					field: "isSupplyingAgency",
					headerName: "Supplying",
					flex: 0.25,
					filterable: false,
					sortable: false,
					valueGetter: (value, row) => {
						const agency = row?.agency;
						if (
							agency &&
							Object.prototype.hasOwnProperty.call(
								agency,
								"isSupplyingAgency",
							) &&
							agency?.isSupplyingAgency == null
						) {
							// Returns "Not set" only for libraries where an agency with the property exists, but is set to null
							// Does not return "Not set" for libraries without an agency
							return t("libraries.circulation.not_set");
						}

						return row?.agency?.isSupplyingAgency;
					},
				},
				{
					field: "isBorrowingAgency",
					headerName: "Borrowing",
					flex: 0.25,
					filterable: false,
					sortable: false,
					valueGetter: (value, row) => {
						const agency = row?.agency;
						if (
							agency &&
							Object.prototype.hasOwnProperty.call(
								agency,
								"isBorrowingAgency",
							) &&
							agency?.isBorrowingAgency == null
						) {
							// Returns "Not set" only for libraries where an agency with the property exists, but is set to null
							// Does not return "Not set" for libraries without an agency
							return t("libraries.circulation.not_set");
						}

						return row?.agency?.isBorrowingAgency;
					},
				},
				{
					field: "hostLmsCirculation",
					headerName: "Host LMS (circulation)",
					flex: 0.5,
					filterable: false,
					sortable: false,
					valueGetter: (value, row) => row?.agency?.hostLms?.code,
				},
				{
					field: "hostLmsCatalogue",
					headerName: "Host LMS (catalogue)",
					flex: 0.5,
					filterable: false,
					sortable: false,
					valueGetter: (value, row) => row?.secondHostLms?.code,
				},
				{
					field: "id",
					headerName: "Library UUID",
					flex: 0.5,
					filterOperators: equalsOnly,
				},
			]}
			selectable={true}
			pageSize={10}
			noDataMessage={t("libraries.none_available")}
			noResultsMessage={t("libraries.none_found")}
			searchPlaceholder={t("libraries.search_placeholder")}
			sortDirection="ASC"
			sortAttribute="fullName"
			sortModel={[{ field: "fullName", sort: "asc" }]}
		/>
	);
}
