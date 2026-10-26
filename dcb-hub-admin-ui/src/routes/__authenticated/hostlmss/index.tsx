import { useMemo, useState } from "react";
import { GridColDef, type GridRowModesModel } from "@mui/x-data-grid-premium";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	redirect,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { Add } from "@mui/icons-material";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { useGridView } from "@hooks/useGridView";
import { constrainToServerOperators } from "@filters/serverFilterOperators";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import {
	defaultQueryModels,
	rememberedViewRedirect,
} from "@helpers/viewState/viewRoute";
import { hostLmssView } from "@constants/dataGrid/gridViews";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { hostLmssQuery } from "@/queryOptions/gridQueries";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";

import { getHostLms } from "@queries/getHostLms";
import { standardFilters } from "@filters/standardFilters";
import { equalsOnly } from "@filters/equalsOnly";
import { isHostLmsProbesEnabled } from "@helpers/featureFlags";
import { lastPingView } from "@helpers/hostLmsLastPing";

export const Route = createFileRoute("/__authenticated/hostlmss/")({
	validateSearch: validateGridSearch,
	loaderDeps: ({ search }) => search,
	beforeLoad: ({ search, location }) => {
		const restore = rememberedViewRedirect(
			hostLmssView,
			search,
			location.state,
		);
		if (restore) throw redirect({ to: "/hostlmss", ...restore });
	},
	loader: ({ context: { queryClient, cfg, auth }, deps, location, cause }) => {
		// Skip prefetching for unauthenticated visitors - see hostlmss/index.tsx.
		if (!auth?.isAuthenticated) return;
		// The reader paging or sorting: the grid is already fetching it
		if (cause === "stay") return;
		const models = defaultQueryModels(hostLmssView, deps, location.state);
		if (!models) return;
		return queryClient.ensureQueryData(
			hostLmssQuery(createGraphQLClient(cfg, auth), models),
		);
	},
	component: HostLmss,
});

function HostLmss() {
	const { t } = useTranslation();
	const auth = useAuth();
	const navigate = useNavigate();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();

	const gridId = hostLmssView.id;
	const search = useSearch({ from: "/__authenticated/hostlmss/" });
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const columns: GridColDef[] = useMemo(
		() => [
			...customColumns,
			{
				field: "name",
				headerName: t("hostlms.name", "Host LMS name"),
				minWidth: 150,
				flex: 1,
				filterOperators: standardFilters,
			},
			{
				field: "code",
				headerName: t("hostlms.code", "Host LMS code"),
				minWidth: 50,
				flex: 0.5,
				filterOperators: standardFilters,
			},
			{
				field: "clientConfigDefaultAgencyCode",
				headerName: t(
					"hostlms.client_config.default_agency_code",
					"Default agency code",
				),
				minWidth: 50,
				flex: 0.5,
				filterable: false,
				sortable: false,
				valueGetter: (val: any, row: any) =>
					row?.clientConfig?.["default-agency-code"],
			},
			{
				field: "clientConfigIngest",
				headerName: t("hostlms.client_config.ingest", "Ingest enabled"),
				minWidth: 50,
				flex: 0.5,
				filterable: false,
				sortable: false,
				valueGetter: (val: any, row: any) => row?.clientConfig?.ingest,
			},
			...(isHostLmsProbesEnabled()
				? [
						{
							field: "lastPing",
							headerName: t("hostlms.last_ping.column"),
							minWidth: 120,
							flex: 0.75,
							filterable: false,
							sortable: false,
							// Words, not a coloured mark: the state must read the same without colour
							valueGetter: (val: unknown) => {
								const view = lastPingView(val);
								return view
									? t(`hostlms.last_ping.state.${view.state}`)
									: t("hostlms.last_ping.never_short");
							},
						} satisfies GridColDef,
					]
				: []),
			{
				field: "id",
				headerName: t("hostlms.id", "Host LMS UUID"),
				minWidth: 100,
				flex: 0.5,
				filterOperators: equalsOnly,
			},
		],
		[customColumns, t],
	);

	// What the filter panel offers, which DataGrid narrows to what the server can answer
	const viewColumns = useMemo(
		() => constrainToServerOperators(columns),
		[columns],
	);
	const view = useGridView(hostLmssView, viewColumns, search);

	const {
		data: gridData,
		isLoading,
		isFetching,
	} = useQuery(
		hostLmssQuery(gqlClient, {
			paginationModel: view.paginationModel,
			sortModel: view.sortModel,
			filterModel: view.appliedFilterModel,
		}),
	);

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");

	return (
		<PageContainer
			title={t("nav.hostlmss")}
			pageActions={[
				{
					key: "new",
					onClick: () => navigate({ to: "/hostlmss/new" }),
					disabled: !isAnAdmin,
					label: t("hostlms.new_host_lms.title"),
					startIcon: <Add />,
				},
			]}
		>
			<DataGrid
				identifier={gridId}
				type={"hostlmss"}
				columns={columns}
				viewNotice={<GridViewNotice view={view} />}
				rows={gridData?.hostLms?.content ?? []}
				rowCount={gridData?.hostLms?.totalSize ?? 0}
				loading={isLoading || isFetching}
				paginationMode="server"
				pagination
				paginationModel={view.paginationModel}
				onPaginationModelChange={view.onPaginationModelChange}
				sortingMode="server"
				sortModel={view.sortModel}
				onSortModelChange={view.onSortModelChange}
				filterMode="server"
				filterModel={view.filterModel}
				onFilterModelChange={view.onFilterModelChange}
				columnVisibilityModel={view.columnVisibilityModel}
				onColumnVisibilityModelChange={view.onColumnVisibilityModelChange}
				columnLayout={view.columnLayout}
				exportConfig={{
					query: getHostLms(),
					coreType: "hostLms",
				}}
				disableAggregation
				disableHoverInteractions={false}
				disableRowGrouping
				disablePivoting
				listViewEnabled={false}
				pivotingEnabled={false}
				toolbarVisible
				scrollbarVisible={false}
				noResultsText={t("hostlms.no_results")}
				searchText={t("hostlms.search_placeholder")}
				rowModesModel={rowModesModel}
				onRowModesModelChange={setRowModesModel}
			/>
		</PageContainer>
	);
}
