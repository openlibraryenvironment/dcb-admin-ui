import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@layout";
//localisation
import { useTranslation } from "react-i18next";

import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import {
	deleteNumericRangeMapping } from "@queries/createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@layout";
//localisation
import { useTranslation } from "react-i18next";

import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import {
	deleteNumericRangeMapping";
import { getNumericRangeMappings } from "@queries/getNumericRangeMappings";
import { updateNumericRangeMapping } from "@queries/updateNumericRangeMapping";
import { useState } from "react";
import { Box, Button, Tooltip } from "@mui/material";
import Import from "@components/Import/Import";
import { useAuth } from "react-oidc-context";
import { adminOrConsortiumAdmin } from "src/constants/roles";
import { standardNumRangeMappingColumns } from "@helpers/dataGrid/columns";
import { useQueryClient } from "@tanstack/react-query";

// Page for 'ALL' numeric range mappings of any category.

const AllNumericRange: NextPage = () => {
	const client = useQueryClient();
	const [showImport, setImport] = useState(false);
	const auth = useAuth();
	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin = userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

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
	const isAValidAdmin = isAnAdmin;

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




