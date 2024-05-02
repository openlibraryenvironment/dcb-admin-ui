import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { AdminLayout } from "@layout";
//localisation
import { useTranslation } from "next-i18next";
import { getPatronRequests } from "src/queries/queries";
import dayjs from "dayjs";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { getGridStringOperators } from "@mui/x-data-grid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Loading from "@components/Loading/Loading";
import { formatDuration } from "src/helpers/formatDuration";
const PatronRequests: NextPage = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			// If user is not authenticated, push them to unauthorised page
			// At present, they will likely be kicked to the logout page first
			// However this is important for when we introduce RBAC.
			router.push("/unauthorised");
		},
	});
	const filterOperators = getGridStringOperators().filter(({ value }) =>
		[
			"equals",
			"contains" /* add more over time as we build in support for them */,
		].includes(value),
	);

	if (status === "loading") {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.patronRequests").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

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
						valueGetter: (params: { row: { dateCreated: string } }) => {
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
						valueGetter: (params: { row: { dateUpdated: string } }) => {
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
						field: "localBarcode",
						headerName: "Patron barcode",
						minWidth: 50,
						flex: 0.3,
						filterOperators,
						valueGetter: (params: {
							row: { requestingIdentity: { localBarcode: string } };
						}) => params?.row?.requestingIdentity?.localBarcode,
					},
					{
						field: "status",
						headerName: "Status",
						minWidth: 50,
						flex: 0.4,
						filterOperators,
					},
					{
						field: "outOfSequenceFlag",
						headerName: "Out of sequence",
						minWidth: 50,
						flex: 0.4,
						filterOperators,
					},
					// HIDDEN BY DEFAULT
					{
						field: "suppliers",
						headerName: "Requesting agency",
						minWidth: 50,
						flex: 0.5,
						filterOperators,
						valueGetter: (params: {
							row: { suppliers: Array<{ localAgency: string }> };
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
					{
						field: "pollCountForCurrentStatus",
						headerName: "Polling count",
						minWidth: 50,
						flex: 0.3,
						filterOperators,
					},
					{
						field: "elapsedTimeInCurrentStatus",
						headerName: "Time in state",
						minWidth: 50,
						flex: 0.3,
						filterOperators,
						valueGetter: (params: {
							row: { elapsedTimeInCurrentStatus: number };
						}) => formatDuration(params.row.elapsedTimeInCurrentStatus),
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
					pollCountForCurrentStatus: false,
					elapsedTimeInCurrentStatus: false,
				}}
				// This is how to set the default sort order - so the grid loads as sorted by 'lastCreated' by default.
				sortModel={[{ field: "dateCreated", sort: "desc" }]}
				sortDirection="DESC"
				sortAttribute="dateCreated"
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
