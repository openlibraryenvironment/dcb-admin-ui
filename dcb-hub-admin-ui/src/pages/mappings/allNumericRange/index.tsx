import { GetServerSideProps, NextPage } from "next";
import { AdminLayout } from "@layout";
//localisation
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { getNumericRangeMappings } from "src/queries/queries";
import { getGridStringOperators } from "@mui/x-data-grid-pro";
import { useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { Box, Button } from "@mui/material";
import Import from "@components/Import/Import";

// Page for 'ALL' numeric range mappings of any category.

const AllNumericRange: NextPage = () => {
	const client = useApolloClient();
	const [showImport, setImport] = useState(false);

	const openImport = () => {
		setImport(true);
	};
	const closeImport = () => {
		setImport(false);
		client.refetchQueries({
			include: ["LoadNumericRangeMappings"],
		});
		// Refetch only the 'LoadMappings' query, for latest mappings.
		// https://www.apollographql.com/docs/react/data/refetching/#refetch-recipes
	};
	const { t } = useTranslation();
	const filterOperators = getGridStringOperators().filter(({ value }) =>
		[
			"equals",
			"contains" /* add more over time as we build in support for them */,
		].includes(value),
	);

	return (
		<AdminLayout title={t("nav.mappings.allNumericRange")}>
			<Button variant="contained" onClick={openImport}>
				{t("mappings.import")}
			</Button>
			<ServerPaginationGrid
				query={getNumericRangeMappings}
				presetQueryVariables="deleted:false OR deleted:null"
				type="numericRangeMappings"
				coreType="numericRangeMappings"
				columns={[
					{
						field: "domain",
						headerName: "Category",
						minWidth: 50,
						flex: 0.5,
						filterOperators,
					},
					{
						field: "context",
						headerName: "From context",
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
						field: "upperBound",
						headerName: "Upper bound",
						minWidth: 50,
						flex: 0.4,
						filterOperators,
					},
					{
						field: "targetContext",
						headerName: "To context",
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
				pageSize={20}
				sortDirection="ASC"
				sortAttribute="context"
			/>
			<Box>
				{showImport ? <Import show={showImport} onClose={closeImport} /> : null}
			</Box>
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
