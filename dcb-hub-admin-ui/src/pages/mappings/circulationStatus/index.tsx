import { NextPage } from "next";
import { AdminLayout } from "@layout";
import { Button, Tooltip } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "next-i18next";
import Import from "@components/Import/Import";
// import dayjs from "dayjs";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { getCirculationStatusMappings } from "src/queries/queries";
import { useApolloClient } from "@apollo/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Loading from "@components/Loading/Loading";
import { standardFilters } from "src/helpers/filters";
// TODO: When we know future status of circ status mappings, we may want to remove this
// For now access to it is blocked.
const CirculationStatusMappings: NextPage = () => {
	// Handles the import modal display
	const client = useApolloClient();
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
		// This refetches only the 'LoadCirculationStatusMappings' query, to get the latest mappings after import.
		client.refetchQueries({
			include: ["LoadCirculationStatusMappings"],
		});
	};
	const { t } = useTranslation();
	const isAdmin = session?.profile?.roles?.includes("ADMIN");

	if (status === "loading") {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type:
							t("nav.mappings.circulationStatus").toLowerCase() +
							" " +
							t("nav.mappings.name").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout title={t("nav.mappings.circulationStatus")}>
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
				query={getCirculationStatusMappings}
				type="circulationStatus"
				coreType="referenceValueMappings"
				columns={[
					{
						field: "fromContext",
						headerName: "From context",
						minWidth: 50,
						flex: 0.5,
						filterOperators: standardFilters,
					},
					{
						field: "fromValue",
						headerName: "From value",
						minWidth: 50,
						flex: 0.4,
						filterOperators: standardFilters,
					},
					{
						field: "toContext",
						headerName: "To context",
						minWidth: 50,
						flex: 0.5,
						filterOperators: standardFilters,
					},
					{
						field: "toValue",
						headerName: "To value",
						minWidth: 50,
						flex: 0.5,
						filterOperators: standardFilters,
						valueGetter: (value, row: { toValue: string }) => row.toValue,
					},
				]}
				noDataMessage={t("mappings.import_mappings", {
					category: "CirculationStatus",
				})}
				noResultsMessage={t("mappings.no_results")}
				selectable={false}
				searchPlaceholder={t("mappings.search_placeholder_cs")}
				// This is how to set the default sort order
				sortModel={[{ field: "fromContext", sort: "asc" }]}
				sortDirection="ASC"
				sortAttribute="fromContext"
				pageSize={20}
				disableHoverInteractions={true}
				presetQueryVariables="fromCategory: CirculationStatus && deleted: false"
			/>
			<div>
				{showImport ? <Import show={showImport} onClose={closeImport} /> : null}
			</div>
		</AdminLayout>
	);
};

export async function getStaticProps({ locale }: { locale: string }) {
	return {
		props: {
			...(await serverSideTranslations(locale, [
				"application",
				"common",
				"validation",
			])),
		},
	};
}

export default CirculationStatusMappings;
