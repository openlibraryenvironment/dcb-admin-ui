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
import { equalsOnly, standardFilters } from "src/helpers/filters";
import dayjs from "dayjs";

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
				editQuery={updateNumericRangeMapping}
				deleteQuery={deleteNumericRangeMapping}
				refetchQuery={["LoadNumericRangeMappings"]}
				presetQueryVariables="(domain: * AND NOT deleted:true)"
				type="numericRangeMappings"
				coreType="numericRangeMappings"
				operationDataType="NumericRangeMapping"
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
						editable: true,
					},
					{
						field: "lastImported",
						headerName: t("common.mappings.last_imported"),
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
						mappingType="Numeric range mappings"
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
