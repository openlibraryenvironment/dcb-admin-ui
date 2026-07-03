import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Grid, Tab, Tabs, Typography } from "@mui/material";
import {
	GridPaginationModel,
	GridSortModel,
	GridFilterModel,
	GridColumnVisibilityModel,
	GridRowModesModel,
} from "@mui/x-data-grid-premium";

import PageContainer from "@layout/PageContainer/PageContainer";
import DataGrid from "@components/DataGrid/DataGrid";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";

import { useGridStore } from "@/hooks/useDataGridStore";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { useDynamicPatronRequestColumns } from "@hooks/useDynamicPatronRequestColumns";
import {
	getSortOrderForServer,
	processGridFilterModel,
} from "@helpers/dataGrid/utilities";
import { defaultPatronRequestGroupVisibility } from "@columns/columnVisibility/defaultPatronRequestGroupVisibility";

import { getLibraryGroupById } from "@queries/getGroupById";
import { getPatronRequests } from "@queries/getPatronRequests";
import { getLibraries } from "@queries/getLibraries";
import { getLocationForPatronRequestGrid } from "@queries/getLocationForPatronRequestGrid";

import { Group } from "@models/Group";
import { LibraryGroupMember } from "@models/LibraryGroupMember";

export const Route = createFileRoute(
	"/__authenticated/groups/$groupId/supplierRequests/",
)({
	component: GroupSupplierRequests,
});

function GroupSupplierRequests() {
	const { t } = useTranslation();
	const router = useRouter();
	const { groupId } = Route.useParams();
	const gqlClient = useGraphQLClient();
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
	const customColumns = useCustomColumns();

	const gridId = "groupSupplierRequests";

	const {
		sortModel: storedSortModel,
		filterModel: storedFilterModel,
		paginationModel: storedPaginationModel,
		columnVisibilityModel: storedColumnVisibilityModel,
		setSortModel,
		setFilterModel,
		setPaginationModel,
		setColumnVisibilityModel,
	} = useGridStore();

	const storedState = {
		sort: storedSortModel[gridId],
		filter: storedFilterModel[gridId],
		pagination: storedPaginationModel[gridId],
		columnVisibility: storedColumnVisibilityModel[gridId],
	};

	const [paginationModel, setLocalPaginationModel] =
		useState<GridPaginationModel>(
			storedState.pagination ?? { page: 0, pageSize: 20 },
		);
	const [filterModel, setLocalFilterModel] = useState<GridFilterModel>(
		storedState.filter ?? { items: [] },
	);
	const [sortModel, setLocalSortModel] = useState<GridSortModel>(
		storedState.sort ?? [{ field: "dateCreated", sort: "desc" }],
	);
	const [columnVisibilityModel, setLocalColumnVisibilityModel] =
		useState<GridColumnVisibilityModel>(
			storedState.columnVisibility ?? defaultPatronRequestGroupVisibility,
		);

	const {
		data: groupData,
		isLoading: isGroupLoading,
		error: groupError,
	} = useQuery({
		queryKey: ["group", groupId],
		queryFn: () =>
			gqlClient.request<any>(getLibraryGroupById, { query: `id:${groupId}` }),
		refetchInterval: 120000,
	});

	const group: Group = groupData?.libraryGroups?.content?.[0];

	const groupVariables = useMemo(() => {
		if (!group?.members) return "";
		const codes = group.members
			.map((member: LibraryGroupMember) => member?.library?.agency?.code)
			.filter((code?: string) => Boolean(code));

		const uniqueCodes = Array.from(new Set(codes));
		if (uniqueCodes.length === 0) return "";
		return uniqueCodes.map((c) => `supplyingAgencyCode:${c}`).join(" OR ");
	}, [group]);

	const {
		data: requestsData,
		isLoading: isRequestsLoading,
		isFetching: isRequestsFetching,
	} = useQuery({
		queryKey: [gridId, groupId, paginationModel, sortModel, filterModel],
		queryFn: async () => {
			const baseQuery = `(${groupVariables})`;
			const queryVariables = {
				query:
					processGridFilterModel(filterModel, baseQuery, [
						"status",
						"description",
					]) ?? "",
				pageno: paginationModel.page ?? 0,
				pagesize: paginationModel.pageSize ?? 20,
				order: sortModel[0]?.field ?? "dateCreated",
				orderBy: getSortOrderForServer(sortModel[0]?.sort) ?? "DESC",
			};
			return gqlClient.request<any>(getPatronRequests, queryVariables);
		},
		enabled: !!groupVariables,
		placeholderData: (previousData) => previousData,
	});

	const { data: librariesData, isLoading: isLibrariesLoading } = useQuery({
		queryKey: ["allLibrariesDictionary"],
		queryFn: () =>
			gqlClient.request<any>(getLibraries, {
				order: "fullName",
				orderBy: "ASC",
				pageno: 0,
				pagesize: 1000,
				query: "",
			}),
		staleTime: 1000 * 60 * 30, // Cache for 30 mins
	});

	const { data: locationsData, isLoading: isLocationsLoading } = useQuery({
		queryKey: ["allLocationsDictionary"],
		queryFn: () =>
			gqlClient.request<any>(getLocationForPatronRequestGrid, {
				query: "",
				order: "name",
				orderBy: "ASC",
				pagesize: 1000,
				pageno: 0,
			}),
		staleTime: 1000 * 60 * 30, // Cache for 30 mins
	});

	const dynamicPatronRequestColumns = useDynamicPatronRequestColumns({
		locations: locationsData?.locations?.content ?? [],
		libraries: librariesData?.libraries?.content ?? [],
		variant: "standard",
	});

	const allColumns = useMemo(() => {
		return [...customColumns, ...dynamicPatronRequestColumns];
	}, [customColumns, dynamicPatronRequestColumns]);

	const handlePaginationChange = useCallback(
		(model: GridPaginationModel) => {
			setLocalPaginationModel(model);
			setPaginationModel(gridId, model);
		},
		[gridId, setPaginationModel],
	);

	const handleSortChange = useCallback(
		(model: GridSortModel) => {
			setLocalSortModel(model);
			setSortModel(gridId, model);
		},
		[gridId, setSortModel],
	);

	const handleFilterChange = useCallback(
		(model: GridFilterModel) => {
			setLocalFilterModel(model);
			setFilterModel(gridId, model);
		},
		[gridId, setFilterModel],
	);

	const handleColumnVisibilityChange = useCallback(
		(model: GridColumnVisibilityModel) => {
			setLocalColumnVisibilityModel(model);
			setColumnVisibilityModel(gridId, model);
		},
		[gridId, setColumnVisibilityModel],
	);

	const isLoading =
		isGroupLoading ||
		isLibrariesLoading ||
		isLocationsLoading ||
		(isRequestsLoading && !requestsData);

	if (isLoading) {
		return (
			<PageContainer hideBreadcrumbs>
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
					<Tabs
						value={2}
						onChange={(_, val) =>
							router.navigate({
								to: [
									`/groups/${groupId}`,
									`/groups/${groupId}/patronRequests`,
									`/groups/${groupId}/supplierRequests`,
									`/groups/${groupId}/settings`,
								][val],
							})
						}
					>
						<Tab label={t("nav.groups.profile")} />
						<Tab label={t("nav.groups.patronRequests")} />
						<Tab label={t("nav.groups.supplierRequests")} />
						<Tab label={t("nav.groups.settings")} />
					</Tabs>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography
						variant="h2"
						sx={{
							fontWeight: "bold",
						}}
					>
						{t("nav.groups.supplierRequests")}
					</Typography>
				</Grid>
				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					{groupVariables ? (
						<DataGrid
							identifier={gridId}
							type={"patronRequests"}
							columns={allColumns}
							rows={requestsData?.patronRequests?.content ?? []}
							rowCount={requestsData?.patronRequests?.totalSize ?? 0}
							loading={isRequestsFetching && !!requestsData}
							paginationMode="server"
							pagination
							paginationModel={paginationModel}
							onPaginationModelChange={handlePaginationChange}
							sortingMode="server"
							sortModel={sortModel}
							onSortModelChange={handleSortChange}
							filterMode="server"
							filterModel={filterModel}
							onFilterModelChange={handleFilterChange}
							columnVisibilityModel={columnVisibilityModel}
							onColumnVisibilityModelChange={handleColumnVisibilityChange}
							getDetailPanelContent={({ row }: any) => (
								<MasterDetail row={row} type="patronRequests" />
							)}
							checkboxSelection={false}
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
