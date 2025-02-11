import { ClientDataGrid } from "@components/ClientDataGrid";
import Link from "@components/Link/Link";
import { AdminLayout } from "@layout";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid-premium";
import axios from "axios";
import { GetServerSideProps, NextPage } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import getConfig from "next/config";
import { useCallback, useEffect, useMemo, useState } from "react";
import Error from "@components/Error/Error";

const RequestErrors: NextPage = () => {
	const { publicRuntimeConfig } = getConfig();
	const { data: sess } = useSession();
	const { t } = useTranslation();
	const [errorOverviewResults, setErrorOverviewResults] = useState<any>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	// Memoise to avoid recreation on each render
	const requestUrl = useMemo(
		() => `${publicRuntimeConfig.DCB_API_BASE}/sql?name=errorOverview`,
		[publicRuntimeConfig.DCB_API_BASE],
	);
	const fetchRecords = useCallback(async () => {
		if (!sess?.accessToken) return;

		setLoading(true);
		try {
			const response = await axios.get<any[]>(requestUrl, {
				headers: { Authorization: `Bearer ${sess.accessToken}` },
			});
			setLoading(false);
			setErrorOverviewResults(response.data);
		} catch (error) {
			console.error("Error:", error);
			setLoading(false);
			setError(true);
		}
	}, [sess?.accessToken, requestUrl]);

	useEffect(() => {
		fetchRecords();
	}, [fetchRecords]);

	const columns: GridColDef[] = [
		{
			field: "description",
			headerName: t("error_overview.description"),
			minWidth: 150,
			flex: 0.8,
			renderCell: (params) => (
				<Link
					href={`/serviceInfo/requestErrors/requests?namedSql=${params.row?.namedSql}&description=${params.value}`}
				>
					{params.value}
				</Link>
			),
		},
		{
			field: "relatedTicket",
			headerName: t("error_overview.related_ticket"),
			minWidth: 50,
			flex: 0.3,
			valueGetter: (value, row) => {
				const match = row.description.match(/(DCB-\d+)/); // Extract "DCB-XXX"
				return match ? match[0] : null;
			},
			renderCell: (params: GridRenderCellParams) => {
				const ticketId = params.value;
				return ticketId ? (
					ticketId != "DCB-????" ? (
						<Link
							href={`https://openlibraryfoundation.atlassian.net/browse/${ticketId}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							{ticketId}
						</Link>
					) : (
						ticketId
					)
				) : (
					""
				);
			},
		},
		{
			field: "earliest",
			headerName: t("error_overview.earliest"),
			minWidth: 50,
			flex: 0.3,
		},
		{
			field: "mostRecent",
			headerName: t("error_overview.most_recent"),
			minWidth: 50,
			flex: 0.4,
		},
		{
			field: "total",
			headerName: t("error_overview.total"),
			minWidth: 50,
			flex: 0.3,
			type: "number",
		},
		{
			field: "namedSql",
			headerName: t("error_overview.named_sql"),
			minWidth: 100,
			flex: 0.5,
		},
	];

	return (
		<AdminLayout title={t("nav.serviceInfo.requestErrors.name")}>
			{error ? (
				<Error
					title={t("error_overview.error_loading")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.reload")}
					action={t("ui.action.reload")}
					reload
				/>
			) : (
				<ClientDataGrid
					columns={columns}
					data={errorOverviewResults?.hits ?? []}
					type="errorOverviewResults"
					loading={loading}
					selectable={false}
					noDataTitle={t("error_overview.no_results")}
					sortModel={[{ field: "total", sort: "desc" }]}
					operationDataType="ErrorOverview"
					disableAggregation={true}
					disableRowGrouping={true}
				/>
			)}
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

export default RequestErrors;
