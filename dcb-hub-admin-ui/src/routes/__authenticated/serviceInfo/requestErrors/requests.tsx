import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { GridColDef } from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import Link from "@components/Link/Link";
import ErrorComponent from "@components/Error/Error";

import { useGridState } from "@hooks/useGridState";

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/requestErrors/requests",
)({
	component: Requests,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			namedSql: search.namedSql as string,
			description: search.description as string,
		};
	},
});

function Requests() {
	const { t } = useTranslation();
	const auth = useAuth();
	const { namedSql, description } = Route.useSearch();

	const gridId = "errorOverviewPatronRequests";

	const {
		paginationModel,
		sortModel,
		filterModel,
		columnVisibilityModel,
		rowModesModel,
		setRowModesModel,
		onPaginationModelChange: handlePaginationChange,
		onSortModelChange: handleSortChange,
		onFilterModelChange: handleFilterChange,
		onColumnVisibilityModelChange: handleColumnVisibilityChange,
	} = useGridState(gridId, {
		pagination: { page: 0, pageSize: 20 },
		sort: [{ field: "Date", sort: "desc" }],
	});

	const {
		data: records,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["errorRequests", namedSql],
		queryFn: async () => {
			const res = await fetch(
				`${import.meta.env.VITE_DCB_API_BASE}/sql?name=${namedSql}`,
				{
					headers: { Authorization: `Bearer ${auth.user?.access_token}` },
				},
			);
			if (!res.ok) throw new Error("Failed to fetch request errors");
			return res.json();
		},
		enabled: !!namedSql,
	});

	const columns: GridColDef[] = useMemo(
		() => [
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
						to={`/patronRequests/${params.value}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						{params.value}
					</Link>
				),
			},
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
				renderCell: (params) => {
					const url = params.value as string;
					if (!url) return "";
					// Extract UUID robustly instead of hardcoded string replacement
					const auditId = url.split("/").pop();
					return (
						<Link
							to={`/patronRequests/audits/${auditId}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							{t("error_overview.view_audit", { audit: auditId })}
						</Link>
					);
				},
			},
		],
		[t],
	);

	const match = description?.match(/(DCB-\d+)/);
	const ticketId = match ? match[0] : null;
	const linkUrl = ticketId
		? `https://openlibraryfoundation.atlassian.net/browse/${ticketId}`
		: undefined;

	if (isError) {
		return (
			<PageContainer title={description} link={linkUrl}>
				<ErrorComponent
					title={t("error_overview.error_loading")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.reload")}
					action={t("ui.actions.reload")}
					// onClick={refetch}
				/>
			</PageContainer>
		);
	}

	return (
		<PageContainer title={description} link={linkUrl}>
			<DataGrid
				identifier={gridId}
				type={"errorOverviewPatronRequests"}
				columns={columns}
				rows={records?.hits ?? []}
				loading={isLoading}
				paginationMode="client"
				sortingMode="client"
				filterMode="client"
				pagination
				paginationModel={paginationModel}
				onPaginationModelChange={handlePaginationChange}
				sortModel={sortModel}
				onSortModelChange={handleSortChange}
				filterModel={filterModel}
				onFilterModelChange={handleFilterChange}
				columnVisibilityModel={columnVisibilityModel}
				onColumnVisibilityModelChange={handleColumnVisibilityChange}
				editMode="row"
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
				checkboxSelection={false}
				disableAggregation
				disableHoverInteractions={false}
				disableRowGrouping
				disablePivoting
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("error_overview.no_results")}
				searchText={t("general.search")}
			/>
		</PageContainer>
	);
}
