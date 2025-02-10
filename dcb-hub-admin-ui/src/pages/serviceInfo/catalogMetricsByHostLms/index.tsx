import axios from "axios";
import { GetServerSideProps, NextPage } from "next";
import { useSession } from "next-auth/react";
import { Trans, useTranslation } from "next-i18next";
import getConfig from "next/config";
import { useEffect, useState } from "react";
import { GridColDef } from "@mui/x-data-grid-premium";
import { ClientDataGrid } from "@components/ClientDataGrid";
import { AdminLayout } from "@layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Alert from "@components/Alert/Alert";
import Link from "@components/Link/Link";
import Loading from "@components/Loading/Loading";
import { useRouter } from "next/router";
import { ProcessState } from "@models/ProcessState";

const CatalogMetricsByHostLms: NextPage = () => {
	const { publicRuntimeConfig } = getConfig();
	const { data } = useSession();
	const { t } = useTranslation();
	const [records, setRecords] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	const handleReload = () => {
		location.reload();
	};
	// useEffect is being used here as this is a REST endpoint
	// Should it change to a GraphQL endpoint we will switch it to useQuery.
	useEffect(() => {
		const fetchRecords = async () => {
			try {
				const response = await axios.get<any[]>(
					`${publicRuntimeConfig.DCB_API_BASE}/hostlmss/importIngestDetails`,
					{
						headers: { Authorization: `Bearer ${data?.accessToken}` },
					},
				);
				setRecords(response.data);
				setLoading(false);
			} catch (error) {
				setError(true);
				setLoading(false);
			}
		};

		if (data?.accessToken) {
			fetchRecords();
		}
	}, [data?.accessToken, publicRuntimeConfig.DCB_API_BASE]);

	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});

	const columns: GridColDef[] = [
		{
			field: "name",
			headerName: t("catalogMetricsByHostLms.source_system"),
			flex: 0.75,
		},
		{
			field: "ingestEnabled",
			headerName: t("catalogMetricsByHostLms.harvest_enabled"),
			flex: 0.5,
		},
		{
			field: "sourceRecordCount",
			headerName: t("catalogMetricsByHostLms.harvested"),
			flex: 0.5,
			type: "number",
			groupable: false,
		},
		{
			field: "awaiting",
			headerName: t("catalogMetricsByHostLms.await"),
			flex: 0.5,
			groupable: false,
			type: "number",
			valueGetter: (value, row) => {
				const states: ProcessState[] = row?.processStates || [];
				const failure = states.find(
					(state: ProcessState) => state.value === "PROCESSING_REQUIRED",
				);
				return failure ? failure.count : 0;
			},
		},
		{
			field: "failed",
			headerName: t("catalogMetricsByHostLms.failed"),
			flex: 0.5,
			groupable: false,
			type: "number",
			valueGetter: (value, row) => {
				const states: ProcessState[] = row?.processStates || [];
				const failure = states.find(
					(state: ProcessState) => state.value === "FAILURE",
				);
				return failure ? failure.count : 0;
			},
		},
		{
			field: "ingested",
			headerName: t("catalogMetricsByHostLms.ingested"),
			flex: 0.5,
			groupable: false,
			type: "number",
			valueGetter: (value, row) => {
				const states: ProcessState[] = row?.processStates || [];
				const failure = states.find(
					(state: ProcessState) => state.value === "SUCCESS",
				);
				return failure ? failure.count : 0;
			},
		},
		{
			field: "bibRecordCount",
			headerName: t("nav.bibs"),
			flex: 0.5,
			type: "number",
			groupable: false,
		},
		{
			field: "difference",
			headerName: t("catalogMetricsByHostLms.difference"),
			flex: 0.75,
			type: "number",
			groupable: false,
			valueGetter: (value, row) => {
				const difference: number = row.sourceRecordCount - row.bibRecordCount;
				return difference;
			},
		},
		{
			field: "id",
			headerName: t("catalogMetricsByHostLms.source_system_id"),
			flex: 1,
		},
		{
			field: "checkPointId",
			headerName: t("catalogMetricsByHostLms.checkpoint_id"),
			flex: 1,
		},
	];

	if (loading || status === "loading") {
		return (
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						//make the first character lowercase
						document_type:
							t("catalogMetricsByHostLms.name").charAt(0).toLowerCase() +
							t("catalogMetricsByHostLms.name").slice(1),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}
	return error ? (
		<AdminLayout title={t("nav.serviceInfo.catalogMetricsByHostLms")}>
			<Alert
				severityType="error"
				alertText={
					<Trans
						i18nKey={"common.error_loading"}
						t={t}
						values={{
							page_title: t("nav.serviceInfo.catalogMetricsByHostLms"),
						}}
						components={{
							linkComponent: (
								<Link
									onClick={handleReload}
									title={t("ui.action.reload")}
									key={t("ui.action.reload")}
									href="catalogMetricsByHostLms"
								/>
							),
						}}
					/>
				}
				onCloseFunc={() => setError(false)}
			/>
		</AdminLayout>
	) : (
		<AdminLayout
			title={t("nav.serviceInfo.catalogMetricsByHostLms")}
			docLink="https://openlibraryfoundation.atlassian.net/wiki/x/GgAnyg"
			subtitle={t("reference.catalog_build")}
		>
			<ClientDataGrid
				columns={columns}
				data={records}
				type="catalogMetricsByHostLms"
				// We don't want click-through on this grid.
				selectable={false}
				noDataTitle={t("catalogMetricsByHostLms.no_results")}
				// This is how to set the default sort order
				sortModel={[{ field: "name", sort: "asc" }]}
				columnVisibilityModel={{
					id: false,
					checkPointId: false,
					sourceSystemId: false,
				}}
				operationDataType="BibRecord"
				disableAggregation={false}
				disableRowGrouping={true}
			/>
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

export default CatalogMetricsByHostLms;
