import { GetServerSideProps, NextPage } from "next";
import { AdminLayout } from "@layout";
import { Button } from "@mui/material";
import { useState } from "react";
//localisation
import { useTranslation } from "next-i18next";
import { useApolloClient } from "@apollo/client";
import Import from "@components/Import/Import";
// import dayjs from "dayjs";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { getMappings } from "src/queries/queries";
import { getGridStringOperators } from "@mui/x-data-grid-pro";
import Loading from "@components/Loading/Loading";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

// Page for 'ALL' referenceValueMappings of any category.

const AllMappings: NextPage = () => {
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
		client.refetchQueries({
			include: ["LoadMappings"],
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

	if (status === "loading") {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.mappings.name").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout title={t("nav.mappings.allReferenceValue")}>
			<Button variant="contained" onClick={openImport}>
				{t("mappings.import")}
			</Button>
			<ServerPaginationGrid
				query={getMappings}
				type="referenceValueMappings"
				coreType="referenceValueMappings"
				columns={[
					{
						field: "fromCategory",
						headerName: "Category",
						minWidth: 50,
						flex: 0.5,
						filterOperators,
					},
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
					/* 		{
						field: "last_imported",
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
				// This is how to set the default sort order
				sortModel={[{ field: "fromContext", sort: "asc" }]}
				sortDirection="ASC"
				sortAttribute="fromContext"
				pageSize={20}
			/>
			<div>
				{showImport ? <Import show={showImport} onClose={closeImport} /> : null}
			</div>
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

export default AllMappings;
