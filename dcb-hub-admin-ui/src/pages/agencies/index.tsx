import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { AdminLayout } from "@layout";
//localisation
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getAgencies } from "src/queries/queries";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { getGridStringOperators } from "@mui/x-data-grid";

const Agencies: NextPage = () => {
	// i18n useTranslation hook - this provides the 't' function for translations
	const { t } = useTranslation();
	// These are the filter operators we expose to the user. We can control this on a per-page and per-column basis.
	// For further filter customisation, see here https://mui.com/x/react-data-grid/filtering/customization/
	const filterOperators = getGridStringOperators().filter(({ value }) =>
		[
			"equals",
			"contains" /* add more over time as we build in support for them */,
		].includes(value),
	);

	return (
		<AdminLayout title={t("nav.agencies")}>
			<div>
				<ServerPaginationGrid
					query={getAgencies}
					type="agencies"
					coreType="agencies"
					columns={[
						{
							field: "name",
							headerName: "Agency name",
							minWidth: 150,
							flex: 0.5,
							filterOperators,
						},
						{
							field: "id",
							headerName: "Agency ID",
							minWidth: 100,
							flex: 0.5,
							filterOperators,
						},
						{
							field: "code",
							headerName: "Agency code",
							minWidth: 50,
							flex: 0.5,
							filterOperators,
						},
					]}
					selectable={true}
					pageSize={10}
					noDataMessage={t("agencies.no_rows")}
					noResultsMessage={t("agencies.no_results")}
					searchPlaceholder={t("agencies.search_placeholder")}
					sortDirection="ASC"
					sortAttribute="name"
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
