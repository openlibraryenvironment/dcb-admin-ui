import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { AdminLayout } from "@layout";
//localisation
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getAgencies } from "src/queries/queries";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Loading from "@components/Loading/Loading";
import { equalsOnly, standardFilters } from "src/helpers/DataGrid/filters";
import { useCustomColumns } from "@hooks/useCustomColumns";
// import MasterDetail from "@components/MasterDetail/MasterDetail";

const Agencies: NextPage = () => {
	// i18n useTranslation hook - this provides the 't' function for translations
	const { t } = useTranslation();
	// These are the filter operators we expose to the user. We can control this on a per-page and per-column basis.
	// For further filter customisation, see here https://mui.com/x/react-data-grid/filtering/customization/

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
						document_type: t("nav.agencies").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout title={t("nav.agencies")}>
			<div>
				<ServerPaginationGrid
					query={getAgencies}
					type="agencies"
					coreType="agencies"
					operationDataType="Agency"
					columnVisibilityModel={{
						id: false,
					}}
					columns={[
						...customColumns,
						{
							field: "name",
							headerName: "Agency name",
							minWidth: 150,
							flex: 0.5,
							filterOperators: standardFilters,
						},
						{
							field: "code",
							headerName: "Agency code",
							minWidth: 50,
							flex: 0.5,
							filterOperators: standardFilters,
						},
						{
							field: "id",
							headerName: "Agency UUID",
							minWidth: 100,
							flex: 0.5,
							filterOperators: equalsOnly,
							filterable: false,
						},
					]}
					selectable={true}
					pageSize={10}
					noDataMessage={t("agencies.no_rows")}
					noResultsMessage={t("agencies.no_results")}
					searchPlaceholder={t("agencies.search_placeholder")}
					// This is how to set the default sort order
					sortModel={[{ field: "name", sort: "asc" }]}
					sortDirection="ASC"
					sortAttribute="name"
					// getDetailPanelContent={({ row }: any) => (
					// 	<MasterDetail row={row} type="agencies" />
					// )}
				/>
			</div>
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

export default Agencies;
