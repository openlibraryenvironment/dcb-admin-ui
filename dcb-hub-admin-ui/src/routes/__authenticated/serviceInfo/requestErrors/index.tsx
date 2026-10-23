import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
import { GridColDef, type GridRowModesModel } from "@mui/x-data-grid-premium";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { useGridView } from "@hooks/useGridView";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import { rememberedViewRedirect } from "@helpers/viewState/viewRoute";
import { requestErrorsView } from "@constants/dataGrid/gridViews";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import Link from "@components/Link/Link";
import Error from "@components/Error/Error";

import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { withRowIndexIds } from "@helpers/dataGrid/withRowIndexIds";

export const Route = createFileRoute(
	"/__authenticated/serviceInfo/requestErrors/",
)({
	validateSearch: validateGridSearch,
	beforeLoad: ({ search, location }) => {
		const restore = rememberedViewRedirect(
			requestErrorsView,
			search,
			location.state,
		);
		if (restore)
			throw redirect({ to: "/serviceInfo/requestErrors", ...restore });
	},
	component: RequestErrors,
});

function RequestErrors() {
	const { t } = useTranslation();
	const client = useDcbRestClient();

	const gridId = requestErrorsView.id;
	const search = useSearch({
		from: "/__authenticated/serviceInfo/requestErrors/",
	});
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const {
		data: records,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["errorOverview"],
		queryFn: async () => {
			const res = await client.get("/sql", {
				params: { name: "errorOverview" },
			});
			return res.data;
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
								// An inline anchor's box is its line height, ~20px, and at 320px this
								// column narrows until that is the whole target: axe target-size,
								// serious, WCAG 2.5.8. inline-flex gives it a box of its own; the row
								// is 52px so 24 fits without changing the layout.
								sx={{
									display: "inline-flex",
									alignItems: "center",
									minHeight: 24,
								}}
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
	const view = useGridView(requestErrorsView, columns, search);

	if (isError) {
		return (
			<PageContainer title={t("nav.serviceInfo.requestErrors.name")}>
				<Error
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
		<PageContainer title={t("nav.serviceInfo.requestErrors.name")}>
			<DataGrid
				identifier={gridId}
				type={"requestErrors"}
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
