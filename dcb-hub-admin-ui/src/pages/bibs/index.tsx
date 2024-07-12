import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { AdminLayout } from "@layout";
import { useTranslation } from "next-i18next";
import { getBibs } from "src/queries/queries";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import Loading from "@components/Loading/Loading";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { equalsOnly, standardFilters } from "src/helpers/filters";
// import MasterDetail from "@components/MasterDetail/MasterDetail";
import { useCustomColumns } from "src/helpers/useCustomColumns";

const Bibs: NextPage = () => {
	const { t } = useTranslation();

	const router = useRouter();
	const customColumns = useCustomColumns();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});

	// Expose only the filters we have tested. The others need to be mapped to Lucene functionality.
	// See potential examples here https://lucene.apache.org/core/9_9_1/queryparser/org/apache/lucene/queryparser/classic/package-summary.html#package.description

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
					...customColumns,
					{
						field: "title",
						headerName: t("details.source_bib_title"),
						minWidth: 150,
						flex: 0.6,
						sortable: false,
						filterOperators: standardFilters,
					},
					{
						field: "clusterRecordId",
						headerName: t("details.cluster_record_uuid"),
						minWidth: 50,
						flex: 0.5,
						sortable: false,
						filterOperators: equalsOnly,
						filterable: false,
						valueGetter: (value: any, row: { contributesTo: { id: string } }) =>
							row?.contributesTo?.id,
					},
					{
						field: "sourceRecordId",
						headerName: t("details.source_record_id"),
						minWidth: 50,
						sortable: false,
						filterOperators: standardFilters,
						flex: 0.5,
					},
					{
						field: "sourceSystemId",
						headerName: t("details.source_system_id"),
						minWidth: 50,
						sortable: false,
						filterOperators: equalsOnly,
						flex: 0.5,
					},
					{
						field: "id",
						headerName: t("details.source_bib_uuid"),
						minWidth: 100,
						flex: 0.5,
						sortable: false,
						filterOperators: equalsOnly,
					},
				]}
				columnVisibilityModel={{
					clusterRecordId: false,
					sourceSystemId: false,
				}}
				searchPlaceholder={t("bibRecords.search_placeholder")}
				sortDirection="ASC"
				sortAttribute="sourceRecordId"
				// getDetailPanelContent={({ row }: any) => (
				// 	<MasterDetail row={row} type="bibs" />
				// )}
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
