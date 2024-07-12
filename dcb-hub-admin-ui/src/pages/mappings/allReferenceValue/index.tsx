import { GetServerSideProps, NextPage } from "next";
import { AdminLayout } from "@layout";
import { Button, Tooltip } from "@mui/material";
import { useState } from "react";
//localisation
import { useTranslation } from "next-i18next";
import { useApolloClient } from "@apollo/client";
import Import from "@components/Import/Import";
// import dayjs from "dayjs";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { getMappings } from "src/queries/queries";
import Loading from "@components/Loading/Loading";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { standardFilters } from "src/helpers/filters";

// Page for 'ALL' referenceValueMappings of any category.

const AllMappings: NextPage = () => {
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
		client.refetchQueries({
			include: ["LoadMappings"],
		});
		// Refetch only the 'LoadMappings' query, for latest mappings.
		// https://www.apollographql.com/docs/react/data/refetching/#refetch-recipes
	};

	const { t } = useTranslation();

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
	const isAdmin = session?.profile?.roles?.includes("ADMIN");

	return (
		<AdminLayout title={t("nav.mappings.allReferenceValue")}>
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
				query={getMappings}
				presetQueryVariables="deleted:false OR deleted:null"
				type="referenceValueMappings"
				coreType="referenceValueMappings"
				columns={[
					{
						field: "fromCategory",
						headerName: "Category",
						minWidth: 50,
						flex: 0.5,
						filterOperators: standardFilters,
					},
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
					category: t("mappings.ref_value").toLowerCase(),
				})}
				noResultsMessage={t("mappings.no_results")}
				selectable={false}
				// This is how to set the default sort order
				sortModel={[{ field: "fromContext", sort: "asc" }]}
				sortDirection="ASC"
				sortAttribute="fromContext"
				pageSize={20}
				disableHoverInteractions={true}
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
