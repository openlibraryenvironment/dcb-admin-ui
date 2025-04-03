import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { AdminLayout } from "@layout";
//localisation
import { useTranslation } from "next-i18next";
import { getHostLms } from "src/queries/queries";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import Loading from "@components/Loading/Loading";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { equalsOnly, standardFilters } from "src/helpers/DataGrid/filters";
// import MasterDetail from "@components/MasterDetail/MasterDetail";
import { useCustomColumns } from "@hooks/useCustomColumns";
const HostLmss: NextPage = () => {
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
						document_type: t("nav.hostlmss").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout title={t("nav.hostlmss")}>
			<ServerPaginationGrid
				query={getHostLms}
				coreType="hostLms"
				type="hostlmss"
				columns={[
					...customColumns,
					{
						field: "name",
						headerName: "Host LMS name",
						minWidth: 150,
						flex: 1,
						filterOperators: standardFilters,
					},
					{
						field: "code",
						headerName: "Host LMS code",
						minWidth: 50,
						flex: 0.5,
						filterOperators: standardFilters,
					},
					{
						field: "clientConfigDefaultAgencyCode",
						headerName: "Default agency code",
						minWidth: 50,
						flex: 0.5,
						filterable: false, // Cannot currently filter on nested properties.
						sortable: false,
						valueGetter: (
							value,
							row: { clientConfig: { "default-agency-code": string } },
						) => row?.clientConfig?.["default-agency-code"],
					},
					{
						field: "clientConfigIngest",
						headerName: "Ingest enabled",
						minWidth: 50,
						flex: 0.5,
						filterable: false,
						sortable: false,
						valueGetter: (value, row: { clientConfig: { ingest: boolean } }) =>
							row?.clientConfig?.ingest,
					},
					// HIDDEN BY DEFAULT
					{
						field: "id",
						headerName: "Host LMS UUID",
						minWidth: 100,
						flex: 0.5,
						filterOperators: equalsOnly,
					},
				]}
				selectable={true}
				pageSize={10}
				noDataMessage={t("hostlms.no_rows")}
				noResultsMessage={t("hostlms.no_results")}
				searchPlaceholder={t("hostlms.search_placeholder")}
				columnVisibilityModel={{
					id: false,
				}}
				// This is how to set the default sort order
				sortModel={[{ field: "name", sort: "asc" }]}
				sortDirection="ASC"
				sortAttribute="name"
				// getDetailPanelContent={({ row }: any) => (
				// 	<MasterDetail row={row} type="hostlmss" />
				// )}
			></ServerPaginationGrid>
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

export default HostLmss;
