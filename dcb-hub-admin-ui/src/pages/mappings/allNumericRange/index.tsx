import { GetServerSideProps, NextPage } from "next";
import { AdminLayout } from "@layout";
//localisation
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import {
	deleteNumericRangeMapping,
	getNumericRangeMappings,
	updateNumericRangeMapping,
} from "src/queries/queries";
import { useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { Box, Button, Tooltip } from "@mui/material";
import Import from "@components/Import/Import";
import { useSession } from "next-auth/react";
import { adminOrConsortiumAdmin } from "src/constants/roles";
import { standardNumRangeMappingColumns } from "src/helpers/DataGrid/columns";

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
	const isAValidAdmin = session?.profile?.roles?.some((role: string) =>
		adminOrConsortiumAdmin.includes(role),
	);

	return (
		<AdminLayout title={t("nav.mappings.allNumericRange")}>
			<Tooltip
				title={
					isAValidAdmin ? "" : t("mappings.import_disabled") // Tooltip text when disabled
				}
			>
				{/* Adding a span as a wrapper to enable tooltip on disabled button */}
				<span>
					<Button
						variant="contained"
						onClick={openImport}
						disabled={!isAValidAdmin} // Disable if not ADMIN
					>
						{t("mappings.import")}
					</Button>
				</span>
			</Tooltip>
			<ServerPaginationGrid
				query={getNumericRangeMappings}
				editQuery={updateNumericRangeMapping}
				deleteQuery={deleteNumericRangeMapping}
				refetchQuery={["LoadNumericRangeMappings"]}
				presetQueryVariables="(domain: * AND NOT deleted:true)"
				type="numericRangeMappings"
				coreType="numericRangeMappings"
				operationDataType="NumericRangeMapping"
				columns={standardNumRangeMappingColumns}
				noDataMessage={t("mappings.no_results")}
				noResultsMessage={t("mappings.no_results")}
				selectable={false}
				sortModel={[{ field: "lastImported", sort: "desc" }]}
				pageSize={20}
				sortDirection="DESC"
				sortAttribute="lastImported"
				disableHoverInteractions={true}
				columnVisibilityModel={{
					lastImported: false,
				}}
			/>
			<Box>
				{showImport ? (
					<Import
						show={showImport}
						onClose={closeImport}
						type="Numeric range mappings"
					/>
				) : null}
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
