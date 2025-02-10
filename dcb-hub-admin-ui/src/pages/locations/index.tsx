import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { AdminLayout } from "@layout";
//localisation
import { useTranslation } from "next-i18next";
import {
	deleteLocationQuery,
	getLocations,
	updateLocationQuery,
} from "src/queries/queries";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import Loading from "@components/Loading/Loading";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { equalsOnly, standardFilters } from "src/helpers/filters";
// import MasterDetail from "@components/MasterDetail/MasterDetail";
import { useCustomColumns } from "@hooks/useCustomColumns";
import dayjs from "dayjs";

const Locations: NextPage = () => {
	const { t } = useTranslation();

	const router = useRouter();
	const customColumns = useCustomColumns();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});

	if (status === "loading") {
		return (
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.locations").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout title={t("nav.locations")}>
			<ServerPaginationGrid
				query={getLocations}
				type="locations"
				coreType="locations"
				operationDataType="Location"
				columns={[
					...customColumns,
					{
						field: "hostSystemName",
						headerName: "Host LMS name",
						minWidth: 150,
						flex: 0.6,
						filterable: false,
						sortable: false,
						valueGetter: (value, row: { hostSystem: { name: string } }) =>
							row?.hostSystem?.name,
					},
					{
						field: "name",
						headerName: "Location name",
						minWidth: 150,
						flex: 0.6,
						editable: true,
						filterOperators: standardFilters,
					},
					{
						field: "printLabel",
						headerName: "Print label",
						minWidth: 150,
						flex: 0.6,
						editable: true,
						filterOperators: standardFilters,
					},
					{
						field: "code",
						headerName: "Location code",
						minWidth: 50,
						flex: 0.4,
						filterOperators: standardFilters,
					},
					{
						field: "isPickup",
						headerName: t("locations.new.pickup_status"),
						minWidth: 50,
						flex: 0.4,
						filterOperators: equalsOnly,
						valueFormatter: (value: boolean) => {
							if (value == true) {
								return t("consortium.settings.enabled");
							} else if (value == false) {
								return t("consortium.settings.disabled");
							} else {
								return t("details.location_pickup_not_set");
							}
						},
					},
					{
						field: "id",
						headerName: "Location UUID",
						minWidth: 50,
						flex: 0.8,
						filterOperators: standardFilters,
					},
					{
						field: "lastImported",
						headerName: "Last imported",
						minWidth: 100,
						flex: 0.5,
						filterOperators: standardFilters,
						valueGetter: (value: any, row: { lastImported: any }) => {
							const lastImported = row.lastImported;
							const formattedDate =
								dayjs(lastImported).format("YYYY-MM-DD HH:mm");
							if (formattedDate == "Invalid Date") {
								return "";
							} else {
								return formattedDate;
							}
						},
					},
				]}
				selectable={true}
				pageSize={200}
				noDataMessage={t("locations.no_rows")}
				noResultsMessage={t("locations.no_results")}
				searchPlaceholder={t("locations.search_placeholder")}
				columnVisibilityModel={{
					id: false,
					lastImported: false,
				}}
				// This is how to set the default sort order
				sortModel={[{ field: "lastImported", sort: "desc" }]}
				sortDirection="DESC"
				sortAttribute="lastImported"
				refetchQuery={["LoadLocations"]}
				deleteQuery={deleteLocationQuery}
				editQuery={updateLocationQuery}
				// getDetailPanelContent={({ row }: any) => (
				// 	<MasterDetail row={row} type="locations" />
				// )}
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

export default Locations;
