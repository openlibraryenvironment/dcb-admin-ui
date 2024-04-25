import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { AdminLayout } from "@layout";
import { useTranslation } from "next-i18next";
import { getBibs } from "src/queries/queries";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { getGridStringOperators } from "@mui/x-data-grid";
import Loading from "@components/Loading/Loading";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

const Bibs: NextPage = () => {
	const { t } = useTranslation();

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

	// Expose only the filters we have tested. The others need to be mapped to Lucene functionality.
	// See potential examples here https://lucene.apache.org/core/9_9_1/queryparser/org/apache/lucene/queryparser/classic/package-summary.html#package.description
	const filterOperators = getGridStringOperators().filter(({ value }) =>
		["equals", "contains" /* add more over time */].includes(value),
	);
	// If testing, use this format for the search:

	if (status === "loading") {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.bibs").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	const BibsDisplay = () => {
		return (
			<ServerPaginationGrid
				query={getBibs}
				type="bibs"
				coreType="sourceBibs"
				selectable={true}
				pageSize={5}
				noDataMessage={t("bibRecords.no_rows")}
				noResultsMessage={t("bibRecords.no_results")}
				// Sorting is disabled on this page because of the expensive nature of sorting millions of records.
				// If we want to restore it, just remove the 'sortable' attributes.
				columns={[
					{
						field: "id",
						headerName: "Source bib ID",
						minWidth: 100,
						flex: 0.5,
						sortable: false,
						filterOperators,
					},
					{
						field: "title",
						headerName: "Title",
						minWidth: 150,
						flex: 0.6,
						sortable: false,
						filterOperators,
					},
					{
						field: "author",
						headerName: "Author",
						minWidth: 100,
						flex: 0.5,
						sortable: false,
						filterOperators,
					},
					{
						field: "clusterRecordId",
						headerName: "Cluster record ID",
						minWidth: 50,
						flex: 0.5,
						sortable: false,
						filterOperators,
						valueGetter: (params: { row: { contributesTo: { id: string } } }) =>
							params?.row?.contributesTo?.id,
					},
					{
						field: "clusterRecordTitle",
						headerName: "Cluster record title",
						minWidth: 50,
						flex: 0.5,
						sortable: false,
						filterOperators,
						valueGetter: (params: { row: { contributesTo: { title: any } } }) =>
							params?.row?.contributesTo?.title,
					},
					{
						field: "sourceRecordId",
						headerName: "Source record ID",
						minWidth: 50,
						sortable: false,
						filterOperators,
						flex: 0.5,
					},
					{
						field: "sourceSystemId",
						headerName: "Source system ID",
						minWidth: 50,
						sortable: false,
						filterOperators,
						flex: 0.5,
					},
				]}
				columnVisibilityModel={{
					clusterRecordTitle: false,
					clusterRecordId: false,
					sourceRecordId: false,
					sourceSystemId: false,
				}}
				searchPlaceholder={t("bibRecords.search_placeholder")}
				sortDirection="ASC"
				sortAttribute="sourceRecordId"
			/>
		);
	};
	return (
		<AdminLayout title={t("nav.bibs")}>
			<BibsDisplay />
		</AdminLayout>
	);
};

export const getServerSideProps: GetServerSideProps = async (
	context: GetServerSidePropsContext,
) => {
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

export default Bibs;
