import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { AdminLayout } from "@layout";
//localisation
import { useTranslation } from "next-i18next";
import { getPatronRequests } from "src/queries/queries";
import dayjs from "dayjs";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { getGridStringOperators } from "@mui/x-data-grid";

const PatronRequests: NextPage = () => {
	const { t } = useTranslation();
	const filterOperators = getGridStringOperators().filter(({ value }) =>
		[
			"equals",
			"contains" /* add more over time as we build in support for them */,
		].includes(value),
	);

	return (
		<AdminLayout title={t("nav.patronRequests")}>
			<ServerPaginationGrid
				query={getPatronRequests}
				type="patronRequests"
				coreType="patronRequests"
				columns={[
					{
						field: "dateCreated",
						headerName: "Request created",
						minWidth: 75,
						flex: 0.3,
						filterOperators,
						valueGetter: (params: { row: { dateCreated: any } }) => {
							const requestCreated = params.row.dateCreated;
							return dayjs(requestCreated).format("YYYY-MM-DD HH:mm");
						},
					},
					{
						field: "dateUpdated",
						headerName: "Request updated",
						minWidth: 75,
						flex: 0.3,
						filterOperators,
						valueGetter: (params: { row: { dateUpdated: any } }) => {
							const requestUpdated = params.row.dateUpdated;
							return dayjs(requestUpdated).format("YYYY-MM-DD HH:mm");
						},
					},
					{
						field: "description",
						headerName: "Description",
						minWidth: 100,
						flex: 0.5,
						filterOperators,
					},
					{
						field: "status",
						headerName: "Status",
						minWidth: 120,
						flex: 0.5,
						filterOperators,
					},
					{
						field: "localBarcode",
						headerName: "Patron barcode",
						minWidth: 50,
						flex: 0.3,
						filterOperators,
						valueGetter: (params: {
							row: { requestingIdentity: { localBarcode: any } };
						}) => params?.row?.requestingIdentity?.localBarcode,
					},
					// HIDDEN BY DEFAULT
					{
						field: "suppliers",
						headerName: "Requesting agency",
						minWidth: 50,
						flex: 0.5,
						filterOperators,
						valueGetter: (params: {
							row: { suppliers: Array<{ localAgency: any }> };
						}) => {
							// Check if suppliers array is not empty
							if (params.row.suppliers.length > 0) {
								return params.row.suppliers[0].localAgency;
							} else {
								return ""; // This allows us to handle the array being empty, and any related type errors.
							}
						},
					},
					{
						field: "pickupLocationCode",
						headerName: "Pickup location",
						minWidth: 50,
						flex: 0.5,
						filterOperators,
					},
					{
						field: "id",
						headerName: "Request ID",
						minWidth: 100,
						flex: 0.5,
						filterOperators,
					},
				]}
				selectable={true}
				pageSize={10}
				noDataMessage={t("patron_requests.no_rows")}
				noResultsMessage={t("patron_requests.no_results")}
				searchPlaceholder={t("patron_requests.search_placeholder")}
				columnVisibilityModel={{
					suppliers: false,
					pickupLocationCode: false,
					id: false,
				}}
				// This is how to set the default sort order - so the grid loads as sorted by 'lastUpdated' by default.
				sortModel={[{ field: "dateUpdated", sort: "desc" }]}
				sortDirection="DESC"
				sortAttribute="dateUpdated"
			/>
		</AdminLayout>
	);
};

export const getServerSideProps: GetServerSideProps = async (
	context: GetServerSidePropsContext,
) => {
	const { locale } = context;
	let translations = {};
	if (locale) {
		translations = await serverSideTranslations(locale as string, [
			"common",
			"application",
			"validation",
		]);
	}
	return {
		props: {
			...translations,
		},
	};
};

export default PatronRequests;
