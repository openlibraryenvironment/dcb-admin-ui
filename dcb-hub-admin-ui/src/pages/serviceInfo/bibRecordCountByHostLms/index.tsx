import axios from "axios";
import { GetServerSideProps, NextPage } from "next";
import { useSession } from "next-auth/react";
import { Trans, useTranslation } from "next-i18next";
import getConfig from "next/config";
import { useEffect, useState } from "react";
import { GridColDef } from "@mui/x-data-grid-pro";
import { ClientDataGrid } from "@components/ClientDataGrid";
import { AdminLayout } from "@layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Alert from "@components/Alert/Alert";
import Link from "@components/Link/Link";
import Loading from "@components/Loading/Loading";
import { useRouter } from "next/router";

const BibRecordCountByHostLms: NextPage = () => {
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
					`${publicRuntimeConfig.DCB_API_BASE}/admin/recordCounts`,
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
		{ field: "sourceSystemName", headerName: "Source system name", flex: 1 },
		{ field: "recordCount", headerName: "Bib record count", flex: 1 },
	];

	if (loading || status === "loading") {
		return (
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						//make the first character lowercase
						document_type:
							t("bibRecordCountByHostLms.name").charAt(0).toLowerCase() +
							t("bibRecordCountByHostLms.name").slice(1),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}
	return error ? (
		<AdminLayout title={t("nav.serviceInfo.bibRecordCountByHostLms")}>
			<Alert
				severityType="error"
				alertText={
					<Trans
						i18nKey={"common.error_loading"}
						t={t}
						values={{
							page_title: t("nav.serviceInfo.bibRecordCountByHostLms"),
						}}
						components={{
							linkComponent: (
								<Link
									onClick={handleReload}
									title={t("ui.action.reload")}
									key={t("ui.action.reload")}
									href="bibRecordCountByHostLms"
								/>
							),
						}}
					/>
				}
				onCloseFunc={() => setError(false)}
			/>
		</AdminLayout>
	) : (
		<AdminLayout title={t("nav.serviceInfo.bibRecordCountByHostLms")}>
			<ClientDataGrid
				columns={columns}
				data={records}
				type="bibRecordCountByHostLMS"
				// We don't want click-through on this grid.
				selectable={false}
				noDataTitle={t("bibRecordCountByHostLms.no_results")}
				// This is how to set the default sort order
				sortModel={[{ field: "sourceSystemName", sort: "asc" }]}
				operationDataType="BibRecord"
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

export default BibRecordCountByHostLms;
