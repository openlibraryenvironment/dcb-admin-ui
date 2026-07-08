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

import { getLocationForPatronRequestGrid } from "@queries/getLocationForPatronRequestGrid";
import { getPatronRequests } from "@queries/getPatronRequests";
import { getPatronRequestsForExport } from "@queries/getPatronRequestsForExport";
import { getPatronRequestTotals } from "@queries/getPatronRequestTotals";
import { getLibraries } from "@queries/getLibraries";
import { exceptionPatronRequestColumnVisibility } from "@columns/columnVisibility/exceptionPatronRequestColumnVisibility";
import { defaultPatronRequestColumnVisibility } from "@columns/columnVisibility/defaultPatronRequestColumnVisibility";
import { queries } from "@constants/patronRequestGridQueries";
import { handleTabChange } from "@helpers/navigation/handleTabChange";
import { createGraphQLClient } from "@helpers/createGraphQLClient";
import { buildServerGridQueryVars } from "@helpers/dataGrid/utilities";
import { a11yTabProps } from "@helpers/navigation/a11yTabProps";

export const Route = createFileRoute(
	"/__authenticated/patronRequests/exception",
)({
	// Default-state prefetch: the loader has no access to the Zustand grid
	// store (it's not a hook), so it can only prefetch the same defaults the
	// component falls back to on first render - gridId
	// "patronRequestsException", page 0/size 20, sort by dateCreated desc, no
	// filter.
	loader: ({ context: { queryClient, cfg, auth } }) => {
		// Skip prefetching for unauthenticated visitors - see hostlmss/index.tsx.
		if (!auth?.isAuthenticated) return;
		const gridId = "patronRequestsException";
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
					query: queries.exception,
					pageno: currentPagination.page,
					pagesize: currentPagination.pageSize,
					order: currentSort[0]?.field ?? "dateCreated",
					orderBy: currentSort[0]?.sort?.toUpperCase() ?? "DESC",
				}),
		});
	},
	component: Exception,
});

function Exception() {
	const { t } = useTranslation();
	const router = useRouter();
	const gqlClient = useGraphQLClient();

	const currentPath = Route.fullPath;

	const gridId = "patronRequestsException";
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
					baseQuery: queries.exception,
					defaultOrder: "dateCreated",
					defaultPageSize: 20,
				}),
			),
	});

	// Counts are derived directly from the query data rather than pushed into
	// state via effects. The exception tab reflects the (possibly filtered) grid
	// total, and the filter indicator compares it to the unfiltered total.
	const unfilteredExceptionCount = excData?.patronRequests?.totalSize ?? null;
	const gridTotalSize = gridData?.patronRequests?.totalSize as
		number | undefined;
	const exceptionCount = gridTotalSize ?? unfilteredExceptionCount ?? 0;
	const isFilterApplied =
		gridTotalSize != null && unfilteredExceptionCount != null
			? gridTotalSize < unfilteredExceptionCount
			: false;
	const totalSizes = {
		exception: exceptionCount,
		outOfSequence: oosData?.patronRequests?.totalSize ?? 0,
		inProgress: inProgData?.patronRequests?.totalSize ?? 0,
		finished: finData?.patronRequests?.totalSize ?? 0,
		all:
			exceptionCount +
			(oosData?.patronRequests?.totalSize ?? 0) +
			(inProgData?.patronRequests?.totalSize ?? 0) +
			(finData?.patronRequests?.totalSize ?? 0),
	};

	const customColumns = useCustomColumns();
	const supplyingLibrariesContent = supplyingLibraries?.libraries?.content;
	const dynamicPatronRequestColumns = useDynamicPatronRequestColumns({
		locations: patronRequestLocations,
		libraries: supplyingLibrariesContent,
		variant: "noStatus",
	});
	const noStatusColumns = useMemo(() => {
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
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
								<Typography variant="subTabTitle">
									{t("libraries.patronRequests.exception_short", {
										number:
											exceptionLoading && unfilteredExceptionCount === null
												? t("common.loading")
												: totalSizes.exception,
									})}
								</Typography>
								{isFilterApplied && (
									<FilterAltOutlined
										aria-label={String(t("ui.info.filter_applied"))}
										fontSize="small"
									/>
								)}
							</Box>
						}
					/>
					<Tab
						{...a11yTabProps("/patronRequests/outOfSequence")}
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
						{...a11yTabProps("/patronRequests/active")}
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
						{...a11yTabProps("/patronRequests/completed")}
						label={
							<Typography variant="subTabTitle">
								{t("libraries.patronRequests.completed_short", {
									number: finishedLoading
										? t("common.loading")
										: totalSizes.finished,
								})}
							</Typography>
						}
					/>
					<Tab
						{...a11yTabProps("/patronRequests/all")}
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
						{t("libraries.patronRequests.exception", {
							number: totalSizes.exception,
						})}
					</Typography>
					<DataGrid
						autoRowHeight={false}
						checkboxSelection={true}
						columns={noStatusColumns}
						columnVisibilityModel={{
							...defaultPatronRequestColumnVisibility,
							...exceptionPatronRequestColumnVisibility,
						}}
						disableAggregation={true}
						disableHoverInteractions={false}
						disablePivoting={true}
						disableRowGrouping={true}
						exportConfig={{
							query: getPatronRequestsForExport,
							coreType: "patronRequests",
							baseQuery: queries.exception,
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
