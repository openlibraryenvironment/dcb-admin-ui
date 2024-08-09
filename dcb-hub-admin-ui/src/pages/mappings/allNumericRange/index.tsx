import { GetServerSideProps, NextPage } from "next";
import { AdminLayout } from "@layout";
//localisation
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { getNumericRangeMappings } from "src/queries/queries";
import { useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { Box, Button, Tooltip } from "@mui/material";
import Import from "@components/Import/Import";
import { useSession } from "next-auth/react";
import { equalsOnly, standardFilters } from "src/helpers/filters";

// Page for 'ALL' numeric range mappings of any category.

const AllNumericRange: NextPage = () => {
	const client = useApolloClient();
	const [showImport, setImport] = useState(false);
	const { data: session } = useSession({
		required: true,
	});

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
	const isAdmin = session?.profile?.roles?.includes("ADMIN");

	return (
		<AdminLayout title={t("nav.mappings.allNumericRange")}>
			<Tooltip
				title={
					isAdmin ? "" : t("mappings.import_disabled") // Tooltip text when disabled
				}
			>
				{/* Adding a span as a wrapper to enable tooltip on disabled button */}
				<span>
					<Button
						variant="contained"
						onClick={openImport}
						disabled={!isAdmin} // Disable if not ADMIN
					>
						{t("mappings.import")}
					</Button>
				</span>
			</Tooltip>
			<ServerPaginationGrid
				query={getNumericRangeMappings}
				presetQueryVariables="(NOT deleted:true)"
				type="numericRangeMappings"
				coreType="numericRangeMappings"
				columns={[
					{
						field: "domain",
						headerName: "Category",
						minWidth: 50,
						flex: 0.5,
						filterOperators: standardFilters,
					},
					{
						field: "context",
						headerName: "From context",
						minWidth: 50,
						flex: 0.5,
						filterOperators: standardFilters,
					},
					{
						field: "lowerBound",
						headerName: "Lower bound",
						minWidth: 50,
						flex: 0.4,
						filterOperators: equalsOnly,
					},
					{
						field: "upperBound",
						headerName: "Upper bound",
						minWidth: 50,
						flex: 0.4,
						filterOperators: equalsOnly,
					},
					{
						field: "targetContext",
						headerName: "To context",
						minWidth: 50,
						flex: 0.5,
						filterOperators: standardFilters,
					},
					{
						field: "mappedValue",
						headerName: "Mapped value",
						minWidth: 50,
						flex: 0.5,
						filterOperators: standardFilters,
					},
				]}
				noDataMessage={t("mappings.no_results")}
				noResultsMessage={t("mappings.no_results")}
				selectable={false}
				sortModel={[{ field: "context", sort: "asc" }]}
				pageSize={20}
				sortDirection="ASC"
				sortAttribute="context"
				disableHoverInteractions={true}
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
