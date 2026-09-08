import { equalsOnly } from "@filters/equalsOnly";
import { standardFilters } from "@filters/standardFilters";
import { getILS } from "@helpers/getILS";
import { GridColDef } from "@mui/x-data-grid-premium";
import i18n from "@/i18n";

export const libraryColumns: GridColDef[] = [
	{
		field: "abbreviatedName",
		headerName: "Abbreviated name",
		flex: 0.4,
		filterOperators: standardFilters,
		editable: true,
	},
	{
		field: "fullName",
		headerName: "Full name",
		flex: 0.6,
		filterOperators: standardFilters,
		editable: true,
	},
	{
		field: "ils",
		headerName: "ILS",
		flex: 0.5,
		filterable: false,
		sortable: false,
		valueGetter: (value, row) => getILS(row?.agency?.hostLms?.lmsClientClass),
		// This defaults to the ILS of the first Host LMS
	},
	{
		field: "authProfile",
		headerName: "Auth profile",
		flex: 0.5,
		sortable: false,
		filterable: false,
		valueGetter: (value, row) => row?.agency?.authProfile,
	},
	{
		field: "id",
		headerName: "Library UUID",
		flex: 0.6,
		filterOperators: equalsOnly,
	},
	{
		field: "agencyCode",
		headerName: "Agency code",
		flex: 0.4,
		filterOperators: standardFilters,
	},
	{
		field: "clientConfigIngest",
		headerName: "Ingest enabled",
		minWidth: 50,
		flex: 0.3,
		filterable: false,
		sortable: false,
		valueGetter: (value, row) => {
			return row?.agency?.hostLms?.clientConfig?.ingest;
		},
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
				Object.prototype.hasOwnProperty.call(agency, "isSupplyingAgency") &&
				agency?.isSupplyingAgency == null
			) {
				// Returns "Not set" only for libraries where an agency with the property exists, but is set to null
				// Does not return "Not set" for libraries without an agency
				return i18n.t("libraries.circulation.not_set");
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
				Object.prototype.hasOwnProperty.call(agency, "isBorrowingAgency") &&
				agency?.isBorrowingAgency == null
			) {
				// Returns "Not set" only for libraries where an agency with the property exists, but is set to null
				// Does not return "Not set" for libraries without an agency
				return i18n.t("libraries.circulation.not_set");
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
];
