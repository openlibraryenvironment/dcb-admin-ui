import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useSearch } from "@tanstack/react-router";
import { Grid, Typography } from "@mui/material";
import GroupTabs from "@components/GroupTabs/GroupTabs";
import type { GridRowModesModel } from "@mui/x-data-grid-premium";
import GridViewNotice from "@components/DataGrid/components/GridViewNotice";
import { useGridView } from "@hooks/useGridView";
import { constrainToServerOperators } from "@filters/serverFilterOperators";
import { validateGridSearch } from "@helpers/viewState/gridSearch";
import {
	rememberedViewRedirect,
	scopedView,
} from "@helpers/viewState/viewRoute";
import { groupPatronRequestsView } from "@constants/dataGrid/gridViews";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { useDynamicPatronRequestColumns } from "@hooks/useDynamicPatronRequestColumns";

import { getLibraryGroupById } from "@queries/getGroupById";
import { getPatronRequests } from "@queries/getPatronRequests";
import { getPatronRequestsForExport } from "@queries/getPatronRequestsForExport";
import { allLibrariesQuery } from "@/queryOptions/libraries";
import { allLocationsQuery } from "@/queryOptions/locations";

import { Group } from "@models/Group";
import { LibraryGroupMember } from "@models/LibraryGroupMember";
import type {
	LoadGroupQueryVariables,
	LoadPatronRequestsQueryVariables,
} from "@generated/graphql";

import { DETAIL_REFETCH_MS } from "@constants/refetchIntervals";
export const Route = createFileRoute(
	"/__authenticated/groups/$groupId/patronRequests/",
)({
	validateSearch: validateGridSearch,
	beforeLoad: ({ search, location, params }) => {
		const restore = rememberedViewRedirect(
			scopedView(groupPatronRequestsView, params.groupId),
			search,
			location.state,
		);
		if (restore)
			throw redirect({
				to: "/groups/$groupId/patronRequests",
				params,
				...restore,
			});
	},
	component: GroupPatronRequests,
});

function GroupPatronRequests() {
	const { t } = useTranslation();
	const { groupId } = Route.useParams();
	const gqlClient = useGraphQLClient();
	const customColumns = useCustomColumns();

	const gridView = useMemo(
		() => scopedView(groupPatronRequestsView, groupId),
		[groupId],
	);
	const gridId = gridView.id;
	const search = useSearch({
		from: "/__authenticated/groups/$groupId/patronRequests/",
	});
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

	const {
		data: groupData,
		isLoading: isGroupLoading,
		error: groupError,
	} = useQuery({
		queryKey: ["group", groupId],
		queryFn: () =>
			gqlClient.request<any, LoadGroupQueryVariables>(getLibraryGroupById, {
				query: `id:${groupId}`,
			}),
		refetchInterval: DETAIL_REFETCH_MS,
	});

	const group: Group = groupData?.libraryGroups?.content?.[0];

	const groupVariables = useMemo(() => {
		if (!group?.members) return "";
		const codes = group.members
			.map(
				(member: LibraryGroupMember) => member?.library?.agency?.hostLms?.code,
			)
			.filter((code?: string) => Boolean(code));

		const uniqueCodes = Array.from(new Set(codes));
		if (uniqueCodes.length === 0) return "";
		return uniqueCodes.map((c) => `patronHostlmsCode:${c}`).join(" OR ");
	}, [group]);

	const { data: librariesData, isLoading: isLibrariesLoading } = useQuery(
		allLibrariesQuery(gqlClient),
	);

	const { data: locationsData, isLoading: isLocationsLoading } = useQuery(
		allLocationsQuery(gqlClient),
	);

	const dynamicPatronRequestColumns = useDynamicPatronRequestColumns({
		locations: locationsData ?? [],
		libraries: librariesData?.libraries?.content ?? [],
		variant: "standard",
	});

	const allColumns = useMemo(() => {
		return [...customColumns, ...dynamicPatronRequestColumns];
	}, [customColumns, dynamicPatronRequestColumns]);
	// What the filter panel offers, which DataGrid narrows to what the server can answer
	const viewColumns = useMemo(
		() => constrainToServerOperators(allColumns),
		[allColumns],
	);
	const view = useGridView(gridView, viewColumns, search);

	const {
		data: requestsData,
		isLoading: isRequestsLoading,
		isFetching: isRequestsFetching,
	} = useQuery({
		queryKey: [
			gridId,
			groupId,
			view.paginationModel,
			view.sortModel,
			view.appliedFilterModel,
		],
		queryFn: async () => {
			const baseQuery = `(${groupVariables})`;
			return gqlClient.request<any, LoadPatronRequestsQueryVariables>(
				getPatronRequests,
				buildServerGridQueryVars({
					filterModel: view.appliedFilterModel,
					sortModel: view.sortModel,
					paginationModel: view.paginationModel,
					baseQuery,
					quickFilterFields: ["status", "description"],
					defaultOrder: "dateCreated",
					defaultPageSize: 20,
				}),
			);
		},
		enabled: !!groupVariables,
		placeholderData: (previousData) => previousData,
	});

	const isLoading =
		isGroupLoading ||
		isLibrariesLoading ||
		isLocationsLoading ||
		(isRequestsLoading && !requestsData);

	if (isLoading) {
		return (
			// The same chrome as the loaded branch, titled with the generic group label
			// rather than nothing. The specific name replaces it on one line, so the
			// title box does not change height - whereas withholding the box and adding
			// it on arrival pushes everything below it down by 77px.
			<PageContainer title={t("groups.groups_one")}>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("groups.groups_one").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</PageContainer>
		);
	}

	if (groupError || !group) {
		return (
			<PageContainer hideBreadcrumbs>
				<Error
					title={
						groupError
							? t("ui.error.cannot_retrieve_record")
							: t("ui.error.cannot_find_record")
					}
					message={
						groupError
							? t("ui.info.connection_issue")
							: t("ui.error.invalid_UUID")
					}
					description={
						groupError ? t("ui.info.try_later") : t("ui.info.check_address")
					}
					action={t("ui.actions.go_back")}
					goBack="/groups"
				/>
			</PageContainer>
		);
	}

	return (
		<PageContainer title={group?.name}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<GroupTabs groupId={groupId} value={1} />
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography
						variant="h2"
						sx={{
							fontWeight: "bold",
						}}
					>
						{t("nav.groups.patronRequests")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					{groupVariables ? (
						<DataGrid
							identifier={gridId}
							type={"patronRequests"}
							columns={allColumns}
							viewNotice={<GridViewNotice view={view} />}
							rows={requestsData?.patronRequests?.content ?? []}
							rowCount={requestsData?.patronRequests?.totalSize ?? 0}
							loading={isRequestsFetching && !!requestsData}
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
							getDetailPanelContent={({ row }: any) => (
								<MasterDetail row={row} type="patronRequests" />
							)}
							rowSelection
							exportConfig={{
								query: getPatronRequestsForExport,
								coreType: "patronRequests",
								baseQuery: `(${groupVariables})`,
								quickFilterFields: ["status", "description"],
								wizard: true,
							}}
							disableAggregation
							disableHoverInteractions={false}
							disableRowGrouping
							disablePivoting
							listViewEnabled={false}
							pivotingEnabled={false}
							toolbarVisible
							scrollbarVisible={false}
							noResultsText={t("patron_requests.no_results")}
							searchText={t("patron_requests.search_placeholder_status")}
							rowModesModel={rowModesModel}
							onRowModesModelChange={setRowModesModel}
						/>
					) : (
						<Typography>{t("patron_requests.no_results")}</Typography>
					)}
				</Grid>
			</Grid>
		</PageContainer>
	);
}
