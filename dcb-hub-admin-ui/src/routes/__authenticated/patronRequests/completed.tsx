import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Box, Grid, Tab, Tabs, Typography } from "@mui/material";
import { FilterAltOutlined } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import Loading from "@components/Loading/Loading";
import PageContainer from "@layout/PageContainer/PageContainer";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import DataGrid from "@components/DataGrid/DataGrid";

import { useGraphQLClient } from "@/hooks/useGraphQLClient";
import { useGridState } from "@hooks/useGridState";
import { Location } from "@models/Location";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { useDynamicPatronRequestColumns } from "@hooks/useDynamicPatronRequestColumns";
import { handleTabChange } from "@helpers/navigation/handleTabChange";

import { getLocationForPatronRequestGrid } from "@queries/getLocationForPatronRequestGrid";
import { getPatronRequests } from "@queries/getPatronRequests";
import { getPatronRequestTotals } from "@queries/getPatronRequestTotals";
import { getLibraries } from "@queries/getLibraries";
import { finishedPatronRequestColumnVisibility } from "@columns/columnVisibility/finishedPatronRequestColumnVisibility";
import { defaultPatronRequestColumnVisibility } from "@columns/columnVisibility/defaultPatronRequestColumnVisibility";
import { queries } from "@constants/patronRequestGridQueries";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";

export const Route = createFileRoute(
	"/__authenticated/patronRequests/completed",
)({
	// Default-state prefetch: the loader has no access to the Zustand grid
	// store (it's not a hook), so it can only prefetch the same defaults the
	// component falls back to on first render - gridId
	// "patronRequestsCompleted", page 0/size 20, sort by dateCreated desc, no
	// filter.
	loader: ({ context: { queryClient, cfg, auth } }) => {
		// Skip prefetching for unauthenticated visitors - see hostlmss/index.tsx.
		if (!auth?.isAuthenticated) return;
		const gridId = "patronRequestsCompleted";
		const currentPagination = { page: 0, pageSize: 20 };
		const currentSort = [{ field: "dateCreated", sort: "desc" }];
		const currentFilter = { items: [] };
		return queryClient.ensureQueryData({
			queryKey: [
				"patronRequests",
				gridId,
				currentPagination,
				currentSort,
				currentFilter,
			],
			queryFn: () =>
				createGraphQLClient(cfg, auth).request<any>(getPatronRequests, {
					query: queries.finished,
					pageno: currentPagination.page,
					pagesize: currentPagination.pageSize,
					order: currentSort[0]?.field ?? "dateCreated",
					orderBy: currentSort[0]?.sort?.toUpperCase() ?? "DESC",
				}),
		});
	},
	component: Completed,
});

function Completed() {
	const { t } = useTranslation();
	const router = useRouter();
	const gqlClient = useGraphQLClient();

	const gridId = "patronRequestsCompleted";
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
	const currentPath = Route.fullPath;

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
	});
	const patronRequestLocations: Location[] =
		(locationsData as Location[]) || [];

	const { data: excData, isLoading: exceptionLoading } = useQuery({
		queryKey: ["patronRequestTotals", "exception"],
		queryFn: () =>
			gqlClient.request<any>(getPatronRequestTotals, {
				query: queries.exception,
				pageno: 0,
				pagesize: 1,
				order: "dateCreated",
				orderBy: "DESC",
			}),
	});
	const { data: oosData, isLoading: outOfSequenceLoading } = useQuery({
		queryKey: ["patronRequestTotals", "outOfSequence"],
		queryFn: () =>
			gqlClient.request<any>(getPatronRequestTotals, {
				query: queries.outOfSequence,
				pageno: 0,
				pagesize: 1,
				order: "dateCreated",
				orderBy: "DESC",
			}),
	});
	const { data: inProgData, isLoading: inProgressLoading } = useQuery({
		queryKey: ["patronRequestTotals", "inProgress"],
		queryFn: () =>
			gqlClient.request<any>(getPatronRequestTotals, {
				query: queries.inProgress,
				pageno: 0,
				pagesize: 1,
				order: "dateCreated",
				orderBy: "DESC",
			}),
	});
	const { data: finData, isLoading: finishedLoading } = useQuery({
		queryKey: ["patronRequestTotals", "finished"],
		queryFn: () =>
			gqlClient.request<any>(getPatronRequestTotals, {
				query: queries.finished,
				pageno: 0,
				pagesize: 1,
				order: "dateCreated",
				orderBy: "DESC",
			}),
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

	const { data: gridData, isLoading: gridLoading } = useQuery({
		queryKey: [
			"patronRequests",
			gridId,
			currentPagination,
			currentSort,
			currentFilter,
		],
		queryFn: () =>
			gqlClient.request<any>(
				getPatronRequests,
				buildServerGridQueryVars({
					filterModel: currentFilter,
					sortModel: currentSort,
					paginationModel: currentPagination,
					baseQuery: queries.finished,
					defaultOrder: "dateCreated",
					defaultPageSize: 20,
				}),
			),
	});

	// Counts are derived directly from the query data rather than pushed into
	// state via effects. The completed tab reflects the (possibly filtered) grid
	// total, and the filter indicator compares it to the unfiltered total.
	const unfilteredCompletedCount = finData?.patronRequests?.totalSize ?? null;
	const gridTotalSize = gridData?.patronRequests?.totalSize as
		number | undefined;
	const finishedCount = gridTotalSize ?? unfilteredCompletedCount ?? 0;
	const isFilterApplied =
		gridTotalSize != null && unfilteredCompletedCount != null
			? gridTotalSize < unfilteredCompletedCount
			: false;
	const totalSizes = {
		exception: excData?.patronRequests?.totalSize ?? 0,
		outOfSequence: oosData?.patronRequests?.totalSize ?? 0,
		inProgress: inProgData?.patronRequests?.totalSize ?? 0,
		finished: finishedCount,
		all:
			(excData?.patronRequests?.totalSize ?? 0) +
			(oosData?.patronRequests?.totalSize ?? 0) +
			(inProgData?.patronRequests?.totalSize ?? 0) +
			finishedCount,
	};

	const customColumns = useCustomColumns();
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
						handleTabChange({
							newValue: value,
							router,
						});
					}}
					aria-label={"Patron request navigation"}
				>
					<Tab
						label={
							<Typography variant="subTabTitle">
								{t("libraries.patronRequests.exception_short", {
									number: exceptionLoading
										? t("common.loading")
										: totalSizes.exception,
								})}
							</Typography>
						}
					/>
					<Tab
						label={
							<Typography variant="subTabTitle">
								{t("libraries.patronRequests.out_of_sequence_short", {
									number: outOfSequenceLoading
										? t("common.loading")
										: totalSizes.outOfSequence,
								})}
							</Typography>
						}
					/>
					<Tab
						label={
							<Typography variant="subTabTitle">
								{t("libraries.patronRequests.active_short", {
									number: inProgressLoading
										? t("common.loading")
										: totalSizes.inProgress,
								})}
							</Typography>
						}
					/>
					<Tab
						label={
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
								<Typography variant="subTabTitle">
									{t("libraries.patronRequests.completed_short", {
										number:
											finishedLoading && unfilteredCompletedCount === null
												? t("common.loading")
												: totalSizes.finished,
									})}
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
					<Tab
						label={
							<Typography variant="subTabTitle">
								{t("libraries.patronRequests.all_short", {
									number: totalSizes.all,
								})}
							</Typography>
						}
					/>
				</Tabs>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography
						variant="h3"
						sx={{
							fontWeight: "bold",
						}}
					>
						{t("libraries.patronRequests.completed", {
							number: totalSizes.finished,
						})}
					</Typography>
					<DataGrid
						autoRowHeight={false}
						checkboxSelection={true}
						columns={allColumns}
						columnVisibilityModel={{
							...defaultPatronRequestColumnVisibility,
							...finishedPatronRequestColumnVisibility,
						}}
						disableAggregation={true}
						disableHoverInteractions={false}
						disablePivoting={true}
						disableRowGrouping={true}
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
						rowCount={gridData?.patronRequests?.totalSize ?? 0}
						rowModesModel={rowModesModel}
						rows={gridData?.patronRequests?.content ?? []}
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
