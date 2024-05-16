import { NextPage } from "next";
import { AdminLayout } from "@layout";
import { Button } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "next-i18next";
import Import from "@components/Import/Import";
// import dayjs from "dayjs";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { getGridStringOperators } from "@mui/x-data-grid-pro";
import { getCirculationStatusMappings } from "src/queries/queries";
import { useApolloClient } from "@apollo/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Loading from "@components/Loading/Loading";

const CirculationStatusMappings: NextPage = () => {
	// Handles the import modal display
	const client = useApolloClient();
	const [showImport, setImport] = useState(false);

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
	const filterOperators = getGridStringOperators().filter(({ value }) =>
		[
			"equals",
			"contains" /* add more over time as we build in support for them */,
		].includes(value),
	);

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
			<Button variant="contained" onClick={openImport}>
				{t("mappings.import")}
			</Button>
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
						filterOperators,
					},
					{
						field: "fromValue",
						headerName: "From value",
						minWidth: 50,
						flex: 0.4,
						filterOperators,
					},
					{
						field: "toContext",
						headerName: "To context",
						minWidth: 50,
						flex: 0.5,
						filterOperators,
					},
					{
						field: "toValue",
						headerName: "To value",
						minWidth: 50,
						flex: 0.5,
						filterOperators,
						valueGetter: (params: { row: { toValue: string } }) =>
							params.row.toValue,
					},
					/* {
						field: "lastImported",
						headerName: "Last imported",
						minWidth: 100,
						flex: 0.5,
						filterOperators,
						valueGetter: (params: { row: { lastImported: string } }) => {
							const lastImported = params.row.lastImported;
							return dayjs(lastImported).format("YYYY-MM-DD HH:mm");
						},
					}, */
				]}
				noDataMessage={t("mappings.import_circulation_status")}
				noResultsMessage={t("mappings.no_results")}
				selectable={false}
				searchPlaceholder={t("mappings.search_placeholder_cs")}
				// This is how to set the default sort order
				sortModel={[{ field: "fromContext", sort: "asc" }]}
				sortDirection="ASC"
				sortAttribute="fromContext"
				pageSize={20}
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
