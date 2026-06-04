import { AdminLayout } from "@layout";
import { Button, Tooltip } from "@mui/material";
import { useState } from "react";
//localisation
import { useTranslation } from "react-i18next";
import Import from "@components/Import/Import";
// import dayjs from "dayjs";

import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import {
	deleteReferenceValueMapping,
	getMappings,
	updateReferenceValueMapping,
} from "src/queries/queries";
import Loading from "@components/Loading/Loading";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { adminOrConsortiumAdmin } from "src/constants/roles";
import { standardRefValueMappingColumns } from "@helpers/dataGrid/columns";
import { useQueryClient } from "@tanstack/react-query";

// Page for 'ALL' referenceValueMappings of any category.

const AllMappings: NextPage = () => {
	const client = useQueryClient();
	const [showImport, setImport] = useState(false);
	const router = useRouter();
	const { data: session, status } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});
	const openImport = () => {
		setImport(true);
	};
	const closeImport = () => {
		setImport(false);
		client.refetchQueries({
			include: ["LoadMappings"],
		});
		// Refetch only the 'LoadMappings' query, for latest mappings.
		// https://www.apollographql.com/docs/react/data/refetching/#refetch-recipes
	};

	const { t } = useTranslation();

	if (status === "loading") {
		return (
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.mappings.name").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}
	const isAValidAdmin = session?.profile?.roles?.some((role: string) =>
		adminOrConsortiumAdmin.includes(role),
	);

	return (
		<AdminLayout title={t("nav.mappings.allReferenceValue")}>
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
				query={getMappings}
				editQuery={updateReferenceValueMapping}
				deleteQuery={deleteReferenceValueMapping}
				refetchQuery={["LoadMappings"]}
				presetQueryVariables="(fromContext: * AND NOT deleted:true)"
				type="referenceValueMappings"
				coreType="referenceValueMappings"
				operationDataType="ReferenceValueMapping"
				columns={standardRefValueMappingColumns}
				noDataMessage={t("mappings.import_mappings", {
					category: t("mappings.ref_value").toLowerCase(),
				})}
				noResultsMessage={t("mappings.no_results")}
				selectable={false}
				// This is how to set the default sort order
				sortModel={[{ field: "lastImported", sort: "desc" }]}
				sortDirection="DESC"
				sortAttribute="lastImported"
				pageSize={20}
				disableHoverInteractions={true}
				columnVisibilityModel={{
					lastImported: false,
					toCategory: false,
				}}
			/>
			<div>
				{showImport ? (
					<Import
						show={showImport}
						onClose={closeImport}
						type="Reference value mappings"
					/>
				) : null}
			</div>
		</AdminLayout>
	);
};

export async function getStaticProps(ctx: any) {
	const { locale } = ctx;
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
}

export default AllMappings;
