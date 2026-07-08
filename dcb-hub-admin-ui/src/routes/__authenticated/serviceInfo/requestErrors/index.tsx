import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { GridColDef } from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import Link from "@components/Link/Link";
import Error from "@components/Error/Error";

import { useGridState } from "@hooks/useGridState";

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/requestErrors/",
)({
	component: RequestErrors,
});

function RequestErrors() {
	const { t } = useTranslation();
	const auth = useAuth();

	const gridId = "errorOverview";

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
		sort: [{ field: "total", sort: "desc" }],
	});

	const {
		data: records,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["errorOverview"],
		queryFn: async () => {
			const res = await fetch(
				`${import.meta.env.VITE_DCB_API_BASE}/sql?name=errorOverview`,
				{
					headers: { Authorization: `Bearer ${auth.user?.access_token}` },
				},
			);
			if (!res.ok) console.error("Failed to fetch error overview");
			return res.json();
		},
	});

	const columns: GridColDef[] = useMemo(
		() => [
			{
				field: "description",
				headerName: t("error_overview.description"),
				minWidth: 150,
				flex: 0.8,
				renderCell: (params) => (
					<Link
						to="/serviceInfo/requestErrors/requests"
						search={{
							namedSql: params.row?.namedSql,
							description: params.value,
						}}
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
					const match = row.description?.match(/(DCB-\d+)/);
					return match ? match[0] : null;
				},
				renderCell: (params) => {
					const ticketId = params.value;
					if (!ticketId) return "";
					if (ticketId !== "DCB-????") {
						return (
							<Link
								href={`https://openlibraryfoundation.atlassian.net/browse/${ticketId}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								{ticketId}
							</Link>
						);
					}
					return ticketId;
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
		],
		[t],
	);

	if (isError) {
		return (
			<PageContainer title={t("nav.serviceInfo.requestErrors.name")}>
				<Error
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
		<PageContainer title={t("nav.serviceInfo.requestErrors.name")}>
			<DataGrid
				identifier={gridId}
				type={"requestErrors"}
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
				searchText={t("ui.data_grid.search")}
			/>
		</PageContainer>
	);
}
