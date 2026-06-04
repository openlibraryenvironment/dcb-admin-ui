import { createFileRoute } from "@tanstack/react-router";
import { GridColDef } from "@mui/x-data-grid-premium";
import { ClientDataGrid } from "@components/ClientDataGrid";
import axios from "axios";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "react-oidc-context";

import { useTranslation } from "react-i18next";
import { AdminLayout } from "@layout";
import Error from "@components/Error/Error";
import Link from "@components/Link/Link";

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/requestErrors/requests/",
)({
	component: Requests,
});

const Requests = () => {
	const router = useRouter();
	const { namedSql, description } = Route.useParams();
	const { publicRuntimeConfig } = getConfig();
	const auth = useAuth();
	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");
	const { t } = useTranslation();
	const desc = String(description);
	const match = desc.match(/(DCB-\d+)/); // Extract "DCB-XXX"
	const ticketId = match ? match[0] : null;
	const link = `https://openlibraryfoundation.atlassian.net/browse/${ticketId}`;

	const [requestData, setRequestData] = useState<any>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const requestUrl = useMemo(
		() => `${publicRuntimeConfig.VITE_DCB_API_BASE}/sql?name=${namedSql}`,
		[namedSql, publicRuntimeConfig.VITE_DCB_API_BASE],
	);

	useEffect(() => {
		const fetchRequestData = async () => {
			setLoading(true);
			try {
				const response = await axios.get(requestUrl, {
					headers: { Authorization: `Bearer ${sess?.accessToken}` },
				});
				setRequestData(response.data.hits);
				setLoading(false);
			} catch (err) {
				console.error("Error fetching request data:", err);
				setLoading(false);
				setError(true);
			}
		};

		if (namedSql) {
			fetchRequestData();
		}
	}, [namedSql, requestUrl, sess?.accessToken]);

	const columns: GridColDef[] = [
		{
			field: "Date",
			headerName: t("error_overview.date"),
			minWidth: 50,
			flex: 0.3,
		},
		{
			field: "RequestId",
			headerName: t("error_overview.request_id"),
			minWidth: 100,
			flex: 0.7,
			renderCell: (params) => (
				<Link
					href={`/patronRequests/${params.value}`}
					target="_blank"
					rel="noopener noreferrer"
				>
					{params.value}
				</Link>
			),
		},
		// {
		// 	field: "RequestURL",
		// 	headerName: t("error_overview.request_url"),
		// 	minWidth: 150,
		// 	flex: 1,
		// },
		{
			field: "Requester",
			headerName: t("error_overview.requester"),
			minWidth: 100,
			flex: 0.7,
		},
		{
			field: "Supplier",
			headerName: t("error_overview.supplier"),
			minWidth: 100,
			flex: 0.7,
		},
		{
			field: "URL",
			headerName: t("error_overview.audit_url"),
			minWidth: 100,
			flex: 0.7,
			renderCell: (params) => (
				// The URLs come to us hardcoded for production
				// But we only need the Audit ID
				<Link
					href={params.value.replace(
						"https://libraries-dcb-hub-admin-scaffold-uat-git-production-knowint.vercel.app",
						"",
					)}
					target="_blank"
					rel="noopener noreferrer"
				>
					{t("error_overview.view_audit", {
						audit: params.value.replace(
							"https://libraries-dcb-hub-admin-scaffold-uat-git-production-knowint.vercel.app/patronRequests/audits/",
							"",
						),
					})}
				</Link>
			),
		},
	];

	return (
		<AdminLayout title={desc} link={link}>
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
					data={requestData ?? []}
					type="errorOverviewPatronRequests"
					coreType="ErrorOverviewResults"
					loading={loading}
					selectable={false}
					noDataTitle={t("error_overview.no_results")}
					sortModel={[{ field: "Date", sort: "desc" }]}
					operationDataType="PatronRequest"
					disableAggregation={true}
					disableRowGrouping={true}
				/>
			)}
		</AdminLayout>
	);
};
