import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { AdminLayout } from "@layout";
//localisation
import { useTranslation } from "next-i18next";
import { getLocations } from "src/queries/queries";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { getGridStringOperators } from "@mui/x-data-grid";
import Loading from "@components/Loading/Loading";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

const Locations: NextPage = () => {
	const { t } = useTranslation();
	const filterOperators = getGridStringOperators().filter(({ value }) =>
		[
			"equals",
			"contains" /* add more over time as we build in support for them */,
		].includes(value),
	);
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
						field: "name",
						headerName: "Location name",
						minWidth: 150,
						flex: 0.6,
						filterOperators,
					},
					{
						field: "id",
						headerName: "Location ID",
						minWidth: 100,
						flex: 0.5,
						filterOperators,
					},
					{
						field: "code",
						headerName: "Location code",
						minWidth: 50,
						flex: 0.5,
						filterOperators,
					},
				]}
				selectable={true}
				pageSize={10}
				noDataMessage={t("locations.no_rows")}
				noResultsMessage={t("locations.no_results")}
				searchPlaceholder={t("locations.search_placeholder")}
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
