import { GetServerSideProps, NextPage } from "next";
import { AdminLayout } from "@layout";
//localisation
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { getNumericRangeMappings } from "src/queries/queries";
import { getGridStringOperators } from "@mui/x-data-grid";

// Page for 'ALL' numeric range mappings of any category.

const AllNumericRange: NextPage = () => {
	const { t } = useTranslation();
	const filterOperators = getGridStringOperators().filter(({ value }) =>
		[
			"equals",
			"contains" /* add more over time as we build in support for them */,
		].includes(value),
	);

	return (
		<AdminLayout title={t("nav.mappings.allNumericRange")}>
			<ServerPaginationGrid
				query={getNumericRangeMappings}
				type="numericRangeMappings"
				coreType="numericRangeMappings"
				columns={[
					{
						field: "context",
						headerName: "HostLMS",
						minWidth: 50,
						flex: 0.5,
						filterOperators,
					},
					{
						field: "domain",
						headerName: "Domain",
						minWidth: 50,
						flex: 0.5,
						filterOperators,
					},
					{
						field: "lowerBound",
						headerName: "Lower bound",
						minWidth: 50,
						flex: 0.4,
						filterOperators,
					},
					{
						field: "targetContext",
						headerName: "Target context",
						minWidth: 50,
						flex: 0.5,
						filterOperators,
					},
					{
						field: "mappedValue",
						headerName: "Mapped value",
						minWidth: 50,
						flex: 0.5,
						filterOperators,
					},
				]}
				noDataMessage={t("mappings.no_results")}
				noResultsMessage={t("mappings.no_results")}
				selectable={false}
				sortModel={[{ field: "context", sort: "asc" }]}
				pageSize={10}
				sortDirection="ASC"
				sortAttribute="context"
			/>
		</AdminLayout>
	);
};

export const getServerSideProps: GetServerSideProps = async (context) => {
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

export default AllNumericRange;
