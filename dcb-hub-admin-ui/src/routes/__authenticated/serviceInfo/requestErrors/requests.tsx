import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
import { GridColDef, type GridRowModesModel } from "@mui/x-data-grid-premium";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { useGridView } from "@hooks/useGridView";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import { rememberedViewRedirect } from "@helpers/viewState/viewRoute";
import { requestErrorRequestsView } from "@constants/dataGrid/gridViews";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import Link from "@components/Link/Link";
import ErrorComponent from "@components/Error/Error";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { withRowIndexIds } from "@helpers/dataGrid/withRowIndexIds";

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/requestErrors/requests",
)({
	validateSearch: (search: Record<string, unknown>) => ({
		// The error category this page lists, chosen on the overview
		namedSql:
			typeof search.namedSql === "string"
				? search.namedSql.slice(0, 200)
				: undefined,
		description:
			typeof search.description === "string"
				? search.description.slice(0, 500)
				: undefined,
		...validateGridSearch(search),
	}),
	beforeLoad: ({ search, location }) => {
		const restore = rememberedViewRedirect(
			requestErrorRequestsView,
			search,
			location.state,
		);
		if (restore)
			throw redirect({ to: "/serviceInfo/requestErrors/requests", ...restore });
	},
	component: Requests,
});

function Requests() {
	const { t } = useTranslation();
	const client = useDcbRestClient();

	const gridId = requestErrorRequestsView.id;
	const search = useSearch({
		from: "/__authenticated/serviceInfo/requestErrors/requests",
	});
	const { namedSql, description } = search;
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const {
		data: records,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["errorRequests", namedSql],
		queryFn: async () => {
			const res = await client.get("/sql", { params: { name: namedSql } });
			return res.data;
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
	const view = useGridView(requestErrorRequestsView, columns, search);

	// `description` is a search param, so a hand-typed or truncated URL reaches this
	// route without one - and PageContainer then rendered no h1 and set the document
	// title to a bare "DCB Admin".
	const pageTitle = description || t("error_overview.requests_fallback_title");

	const match = description?.match(/(DCB-\d+)/);
	const ticketId = match ? match[0] : null;
	const linkUrl = ticketId
		? `https://openlibraryfoundation.atlassian.net/browse/${ticketId}`
		: undefined;

	if (isError) {
		return (
			<PageContainer title={pageTitle} link={linkUrl}>
				<ErrorComponent
					title={t("error_overview.error_loading")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.reload")}
					action={t("ui.actions.reload")}
					onAction={() => location.reload()}
				/>
			</PageContainer>
		);
	}

	return (
		<PageContainer title={pageTitle} link={linkUrl}>
			<DataGrid
				identifier={gridId}
				type={"errorOverviewPatronRequests"}
				columns={columns}
				viewNotice={<GridViewNotice view={view} />}
				rows={withRowIndexIds(records?.hits)}
				loading={isLoading}
				paginationMode="client"
				sortingMode="client"
				filterMode="client"
				pagination
				paginationModel={view.paginationModel}
				onPaginationModelChange={view.onPaginationModelChange}
				sortModel={view.sortModel}
				onSortModelChange={view.onSortModelChange}
				filterModel={view.filterModel}
				onFilterModelChange={view.onFilterModelChange}
				columnVisibilityModel={view.columnVisibilityModel}
				onColumnVisibilityModelChange={view.onColumnVisibilityModelChange}
				columnLayout={view.columnLayout}
				editMode="row"
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
				disableAggregation
				disableHoverInteractions={false}
				disableRowGrouping
				disablePivoting
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("error_overview.no_results")}
				searchText={t("ui.data_grid.search")}
			/>
		</PageContainer>
	);
}
