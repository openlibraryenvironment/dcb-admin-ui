import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { AdminLayout } from "@layout";
//localisation
import { useTranslation } from "next-i18next";
import { getLocations } from "src/queries/queries";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import Loading from "@components/Loading/Loading";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { standardFilters } from "src/helpers/filters";

const Locations: NextPage = () => {
	const { t } = useTranslation();

	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});

	if (status === "loading") {
		return (
			<AdminLayout>
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
				columns={[
					{
						field: "hostSystemName",
						headerName: "Host LMS name",
						minWidth: 150,
						flex: 0.6,
						filterable: false,
						sortable: false,
						valueGetter: (params: { row: { hostSystem: { name: string } } }) =>
							params?.row?.hostSystem?.name,
					},
					{
						field: "name",
						headerName: "Location name",
						minWidth: 150,
						flex: 0.6,
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
						field: "id",
						headerName: "Location UUID",
						minWidth: 50,
						flex: 0.8,
						filterOperators: standardFilters,
					},
				]}
				selectable={true}
				pageSize={10}
				noDataMessage={t("locations.no_rows")}
				noResultsMessage={t("locations.no_results")}
				searchPlaceholder={t("locations.search_placeholder")}
				columnVisibilityModel={{
					id: false,
				}}
				// This is how to set the default sort order
				sortModel={[{ field: "name", sort: "asc" }]}
				sortDirection="ASC"
				sortAttribute="name"
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
