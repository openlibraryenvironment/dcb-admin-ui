import {
	createFileRoute,
	useLocation,
	useRouter,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Box, Typography, Tab, Tabs, Grid } from "@mui/material";
import { FilterAltOutlined } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import Loading from "@components/Loading/Loading";
import PageContainer from "@layout/PageContainer/PageContainer";
import MasterDetail from "@components/MasterDetail/MasterDetail";

import { useGraphQLClient } from "@/hooks/useGraphQLClient";
import { Location } from "@models/Location";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { useDynamicPatronRequestColumns } from "@hooks/useDynamicPatronRequestColumns";
import { handleTabChange } from "@helpers/navigation/handleTabChange";

import { getLocationForPatronRequestGrid } from "@queries/getLocationForPatronRequestGrid";
import { getLibraries } from "@queries/getLibraries";
import { useGridState } from "@hooks/useGridState";
import DataGrid from "@components/DataGrid/DataGrid";
import { defaultPatronRequestColumnVisibility } from "@columns/columnVisibility/defaultPatronRequestColumnVisibility";
import { getPatronRequestDashboard } from "@queries/getPatronRequestDashboard";
import { getPatronRequestsForExport } from "@queries/getPatronRequestsForExport";
import { queries } from "@constants/patronRequestGridQueries";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { a11yTabProps } from "@helpers/navigation/a11yTabProps";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";

export const Route = createFileRoute("/__authenticated/patronRequests/all")({
	// Default-state prefetch: the loader has no access to the Zustand grid
	// store (it's not a hook), so it can only prefetch the same defaults the
	// component falls back to on first render - gridId "patronRequestsAll",
	// page 0/size 20, sort by dateCreated desc, empty filter - matches the
	// component's useQuery exactly.
	loader: ({ context: { queryClient, cfg, auth } }) => {
		// Skip prefetching for unauthenticated visitors - see hostlmss/index.tsx.
		if (!auth?.isAuthenticated) return;
		const gridId = "patronRequestsAll";
		const currentPagination = { page: 0, pageSize: 20 };
		const currentSort = [{ field: "dateCreated", sort: "desc" }];
		const currentFilter = { items: [] };
		return queryClient.ensureQueryData({
			queryKey: [
				"patronRequestsDashboard",
				gridId,
				currentPagination,
				currentSort,
				currentFilter,
			],
			queryFn: () =>
				createGraphQLClient(cfg, auth).request<any>(getPatronRequestDashboard, {
					allQuery: queries.all,
					activeQuery: queries.inProgress,
					exceptionQuery: queries.exception,
					outOfSequenceQuery: queries.outOfSequence,
					finishedQuery: queries.finished,
					pageno: currentPagination.page,
					pagesize: currentPagination.pageSize,
					order: currentSort[0]?.field ?? "dateCreated",
					orderBy: currentSort[0]?.sort?.toUpperCase() ?? "DESC",
				}),
		});
	},
	component: All,
});

function All() {
	const { t } = useTranslation();
	const router = useRouter();
	const gqlClient = useGraphQLClient();

	const gridId = "patronRequestsAll";
	const location = useLocation();
	const currentPath = location.pathname;
	const {
		paginationModel: currentPagination,
		sortModel: currentSort,
		filterModel: currentFilter,
		rowModesModel,
		setRowModesModel,
		onPaginationModelChange,
		onSortModelChange,
		onFilterModelChange,
	} = useGridState(gridId, {
		pagination: { page: 0, pageSize: 20 },
		sort: [{ field: "dateCreated", sort: "desc" }],
	});

	// Ideally, this would know to fetch the full query for whichever tab is on screen (all active etc)
	// but also know NOT to fetch it for the others
	const { data: dashboardData, isLoading: gridLoading } = useQuery({
		queryKey: [
			"patronRequestsDashboard",
			gridId,
			currentPagination,
			currentSort,
			currentFilter,
		],
		queryFn: () => {
			const gridVars = buildServerGridQueryVars({
				filterModel: currentFilter,
				sortModel: currentSort,
				paginationModel: currentPagination,
				baseQuery: queries.all,
				defaultOrder: "dateCreated",
				defaultPageSize: 20,
			});
			return gqlClient.request<any>(getPatronRequestDashboard, {
				allQuery: gridVars.query,
				activeQuery: queries.inProgress,
				exceptionQuery: queries.exception,
				outOfSequenceQuery: queries.outOfSequence,
				finishedQuery: queries.finished,
				pageno: gridVars.pageno,
				pagesize: gridVars.pagesize,
				order: gridVars.order,
				orderBy: gridVars.orderBy,
			});
		},
	});

	// Deriving layout metrics reactively from server output safely
	const totalSizes = useMemo(() => {
		const all = dashboardData?.allRequests?.totalSize ?? 0;
		const exception = dashboardData?.exceptionRequests?.totalSize ?? 0;
		const outOfSequence = dashboardData?.outOfSequenceRequests?.totalSize ?? 0;
		const inProgress = dashboardData?.activeRequests?.totalSize ?? 0;
		const finished = dashboardData?.finishedRequests?.totalSize ?? 0;
		return {
			exception,
			outOfSequence,
			inProgress,
			finished,
			all,
		};
	}, [dashboardData]);

	// Pagination, sorting and filtering currently broken

	// Filter Applied State Evaluation (Derived without state effects)
	const isFilterApplied = currentFilter.items.length > 0;

	// Cached asynchronous lookups configuration
	const fetchAllLocations = async () => {
		const variables = {
			query: "",
			order: "name",
			orderBy: "ASC",
			pagesize: 100,
		};
		const firstPage = await gqlClient.request<any>(
			getLocationForPatronRequestGrid,
			{
				...variables,
				pageno: 0,
			},
		);
		let allLocations = [...(firstPage?.locations?.content || [])];
		const totalSize = firstPage?.locations?.totalSize || 0;

		if (allLocations.length < totalSize) {
			const totalPages = Math.ceil(totalSize / 100);
			const promises = [];
			for (let i = 1; i < totalPages; i++) {
				promises.push(
					gqlClient.request<any>(getLocationForPatronRequestGrid, {
						...variables,
						pageno: i,
					}),
				);
			}
			const results = await Promise.all(promises);
			results.forEach((res) => {
				allLocations = [...allLocations, ...(res?.locations?.content || [])];
			});
		}
		return allLocations;
	};

	const { data: locationsData } = useQuery({
		queryKey: ["locations", "allPatronRequestGrid"],
		queryFn: fetchAllLocations,
		staleTime: 1000 * 60 * 15, // Cache for 15 minutes to prevent continuous unneeded calls
	});

	const { data: supplyingLibraries, isLoading: supplyingLibrariesLoading } =
		useQuery({
			queryKey: ["libraries", "allSupplying"],
			queryFn: () =>
				gqlClient.request<any>(getLibraries, {
					order: "fullName",
					orderBy: "ASC",
					pageno: 0,
					pagesize: 1000,
					query: "",
				}),
		});

	const customColumns = useCustomColumns();
	const patronRequestLocations: Location[] =
		(locationsData as Location[]) || [];
	const supplyingLibrariesContent = supplyingLibraries?.libraries?.content;

	const dynamicPatronRequestColumns = useDynamicPatronRequestColumns({
		locations: patronRequestLocations,
		libraries: supplyingLibrariesContent,
		variant: "standard",
	});

	const allColumns = useMemo(() => {
		return [...customColumns, ...dynamicPatronRequestColumns];
	}, [customColumns, dynamicPatronRequestColumns]);

	if (supplyingLibrariesLoading) {
		return (
			<PageContainer hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.patronRequests.name").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</PageContainer>
		);
	}
	console.log(dashboardData);

	return (
		<PageContainer title={t("nav.patronRequests.name")}>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
			>
				<Tabs
					value={currentPath}
					onChange={(_event, value) => {
						handleTabChange({ newValue: value, router });
					}}
					aria-label={t(
						"nav.patronRequests.accessibility_title",
						"Patron request views workflow filtering",
					)}
				>
					<Tab
						{...a11yTabProps("/patronRequests/exception")}
						label={
							<Typography
								variant="subTabTitle"
								aria-label={`${totalSizes.exception} exception items`}
							>
								{t("libraries.patronRequests.exception_short")} (
								{totalSizes.exception})
							</Typography>
						}
					/>
					<Tab
						{...a11yTabProps("/patronRequests/outOfSequence")}
						label={
							<Typography
								variant="subTabTitle"
								aria-label={`${totalSizes.outOfSequence} out of sequence items`}
							>
								{t("libraries.patronRequests.out_of_sequence_short")} (
								{totalSizes.outOfSequence})
							</Typography>
						}
					/>
					<Tab
						{...a11yTabProps("/patronRequests/active")}
						label={
							<Typography
								variant="subTabTitle"
								aria-label={`${totalSizes.inProgress} active items`}
							>
								{t("libraries.patronRequests.active_short")} (
								{totalSizes.inProgress})
							</Typography>
						}
					/>
					<Tab
						{...a11yTabProps("/patronRequests/completed")}
						label={
							<Typography
								variant="subTabTitle"
								aria-label={`${totalSizes.finished} completed items`}
							>
								{t("libraries.patronRequests.completed_short")} (
								{totalSizes.finished})
							</Typography>
						}
					/>
					<Tab
						{...a11yTabProps("/patronRequests/all")}
						label={
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
								<Typography
									variant="subTabTitle"
									aria-label={`${totalSizes.all} total items`}
								>
									{t("libraries.patronRequests.all_short")} ({totalSizes.all})
								</Typography>
								{isFilterApplied && (
									<FilterAltOutlined
										aria-label={String(
											t("common.filterIsApplied", "Filter is applied"),
										)}
										fontSize="small"
									/>
								)}
							</Box>
						}
					/>
				</Tabs>

				<Grid
					size={{ xs: 4, sm: 8, md: 12 }}
					role="tabpanel"
					id={`patron-tabpanel-${currentPath.replace(/\//g, "-")}`}
					aria-labelledby={`patron-tab-${currentPath.replace(/\//g, "-")}`}
				>
					<Typography
						variant="h3"
						sx={{
							fontWeight: "bold",
							mb: 2,
						}}
					>
						{t("libraries.patronRequests.all", { number: totalSizes.all })}
					</Typography>

					<DataGrid
						autoRowHeight={false}
						checkboxSelection={true}
						columns={allColumns}
						columnVisibilityModel={defaultPatronRequestColumnVisibility}
						disableAggregation={true}
						disableHoverInteractions={false}
						disablePivoting={true}
						disableRowGrouping={true}
						exportConfig={{
							query: getPatronRequestsForExport,
							coreType: "patronRequests",
							baseQuery: queries.all,
							quickFilterFields: ["status", "description"],
							wizard: true,
						}}
						filterMode="server"
						filterModel={currentFilter}
						getDetailPanelContent={({ row }: any) => (
							<MasterDetail row={row} type="patronRequests" />
						)}
						identifier={gridId}
						loading={gridLoading}
						listViewEnabled={false}
						noResultsText={t("patron_requests.no_results")}
						onFilterModelChange={onFilterModelChange}
						onPaginationModelChange={onPaginationModelChange}
						onRowModesModelChange={setRowModesModel}
						onSortModelChange={onSortModelChange}
						pagination={true}
						paginationMode="server"
						paginationModel={currentPagination}
						pivotingEnabled={false}
						rowCount={dashboardData?.allRequests?.totalSize ?? 0}
						rowModesModel={rowModesModel}
						rows={dashboardData?.allRequests?.content ?? []}
						scrollbarVisible={true}
						sortModel={currentSort}
						sortingMode="server"
						toolbarVisible={true}
						searchText=""
						type={"patronRequests"}
					/>
				</Grid>
			</Grid>
		</PageContainer>
	);
}
