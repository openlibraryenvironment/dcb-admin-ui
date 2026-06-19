import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Box, Typography, Tab, Tabs, Grid } from "@mui/material";
import { FilterAltOutlined } from "@mui/icons-material";
import { useAuth } from "react-oidc-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";
import { useCallback, useMemo, useState, useEffect } from "react";

import Loading from "@components/Loading/Loading";
import AdminLayout from "@layout/AdminLayout/AdminLayout";
import MasterDetail from "@components/MasterDetail/MasterDetail";

import { useGraphQLClient } from "@/hooks/useGraphQLClient";
import { Location } from "@models/Location";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { useDynamicPatronRequestColumns } from "@hooks/useDynamicPatronRequestColumns";
import { handleTabChange } from "@helpers/navigation/handleTabChange";

import { getLocationForPatronRequestGrid } from "@queries/getLocationForPatronRequestGrid";
import { getPatronRequests } from "@queries/getPatronRequests";
import { getPatronRequestTotals } from "@queries/getPatronRequestTotals";
import { getLibraries } from "@queries/getLibraries";
import { useGridStore } from "@/hooks/useDataGridStore";
import { GridRowModesModel } from "@mui/x-data-grid-premium";
import DataGrid from "@components/DataGrid/DataGrid";
import { defaultPatronRequestColumnVisibility } from "@columns/columnVisibility/defaultPatronRequestColumnVisibility";
import { queries } from "@constants/patronRequestGridQueries";

export const Route = createFileRoute("/__authenticated/patronRequests/all")({
	component: All,
});

function All() {
	const { t } = useTranslation();
	const router = useRouter();
	const auth = useAuth();
	const gqlClient = useGraphQLClient();

	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin =
		userRoles.includes("ADMIN") || userRoles.includes("CONSORTIUM_ADMIN");
	const gridId = "patronRequestsActive";
	const {
		paginationModel,
		setPaginationModel,
		sortModel,
		setSortModel,
		filterModel,
		setFilterModel,
	} = useGridStore();

	const currentPagination = paginationModel[gridId] ?? {
		page: 0,
		pageSize: 20,
	};
	const currentSort = sortModel[gridId] ?? [
		{ field: "dateCreated", sort: "desc" },
	];
	const currentFilter = filterModel[gridId] ?? { items: [] };
	const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
	const [unfilteredAllCount, setUnfilteredAllCount] = useState<number | null>(
		null,
	);
	const { data: gridData, isLoading: gridLoading } = useQuery({
		queryKey: [
			"patronRequests",
			gridId,
			currentPagination,
			currentSort,
			currentFilter,
		],
		queryFn: () =>
			gqlClient.request(getPatronRequests, {
				query: queries.inProgress,
				pageno: currentPagination.page,
				pagesize: currentPagination.pageSize,
				order: currentSort[0]?.field ?? "dateCreated",
				orderBy: currentSort[0]?.sort?.toUpperCase() ?? "DESC",
			}),
	});
	const currentPath = Route.fullPath;
	const updateCount = useCallback((key: string, count: number) => {
		setTotalSizes((prev) => {
			const newSizes = { ...prev, [key]: count };
			if (key !== "all") {
				newSizes.all =
					(key === "exception" ? count : newSizes.exception) +
					(key === "outOfSequence" ? count : newSizes.outOfSequence) +
					(key === "inProgress" ? count : newSizes.inProgress) +
					(key === "finished" ? count : newSizes.finished);
			}
			return newSizes;
		});
	}, []);
	const handleTotalSizeChange = useCallback(
		(gridType: string, currentGridSize: number) => {
			if (gridType === gridId) {
				updateCount("all", currentGridSize);
				if (unfilteredAllCount === null) {
					setUnfilteredAllCount(currentGridSize);
					setIsFilterApplied(false);
				} else {
					setIsFilterApplied(currentGridSize < unfilteredAllCount);
				}
			} else {
				updateCount(gridType, currentGridSize);
			}
		},
		[updateCount, unfilteredAllCount],
	);

	useEffect(() => {
		if (gridData?.patronRequests?.totalSize !== undefined) {
			handleTotalSizeChange(gridId, gridData.patronRequests.totalSize);
		}
	}, [gridData?.patronRequests?.totalSize, handleTotalSizeChange]);

	const [tabIndex, setTabIndex] = useState(4);
	const [totalSizes, setTotalSizes] = useState({
		exception: 0,
		outOfSequence: 0,
		inProgress: 0,
		finished: 0,
		all: 0,
	});
	const [isFilterApplied, setIsFilterApplied] = useState(false);

	const fetchAllLocations = async () => {
		const variables = {
			query: "",
			order: "name",
			orderBy: "ASC",
			pagesize: 100,
		};
		const firstPage = await gqlClient.request(getLocationForPatronRequestGrid, {
			...variables,
			pageno: 0,
		});
		let allLocations = [...(firstPage?.locations?.content || [])];
		const totalSize = firstPage?.locations?.totalSize || 0;

		if (allLocations.length < totalSize) {
			const totalPages = Math.ceil(totalSize / 100);
			const promises = [];
			for (let i = 1; i < totalPages; i++) {
				promises.push(
					gqlClient.request(getLocationForPatronRequestGrid, {
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
			gqlClient.request(getPatronRequestTotals, {
				query: queries.exception,
				pageno: 0,
				pagesize: 100000,
				order: "dateCreated",
				orderBy: "DESC",
			}),
	});
	useEffect(() => {
		if (excData?.patronRequests?.totalSize !== undefined)
			updateCount("exception", excData.patronRequests.totalSize);
	}, [excData, updateCount]);

	const { data: oosData, isLoading: outOfSequenceLoading } = useQuery({
		queryKey: ["patronRequestTotals", "outOfSequence"],
		queryFn: () =>
			gqlClient.request(getPatronRequestTotals, {
				query: queries.outOfSequence,
				pageno: 0,
				pagesize: 10000,
				order: "dateCreated",
				orderBy: "DESC",
			}),
	});
	useEffect(() => {
		if (oosData?.patronRequests?.totalSize !== undefined)
			updateCount("outOfSequence", oosData.patronRequests.totalSize);
	}, [oosData, updateCount]);

	const { data: inProgData, isLoading: inProgressLoading } = useQuery({
		queryKey: ["patronRequestTotals", "inProgress"],
		queryFn: () =>
			gqlClient.request(getPatronRequestTotals, {
				query: queries.inProgress,
				pageno: 0,
				pagesize: 10000,
				order: "dateCreated",
				orderBy: "DESC",
			}),
	});
	useEffect(() => {
		if (inProgData?.patronRequests?.totalSize !== undefined)
			updateCount("inProgress", inProgData.patronRequests.totalSize);
	}, [inProgData, updateCount]);

	const { data: finData, isLoading: finishedLoading } = useQuery({
		queryKey: ["patronRequestTotals", "finished"],
		queryFn: () =>
			gqlClient.request(getPatronRequestTotals, {
				query: queries.finished,
				pageno: 0,
				pagesize: 10000,
				order: "dateCreated",
				orderBy: "DESC",
			}),
	});

	useEffect(() => {
		if (finData?.patronRequests?.totalSize !== undefined)
			updateCount("finished", finData.patronRequests.totalSize);
	}, [finData, updateCount]);

	const { data: supplyingLibraries, isLoading: supplyingLibrariesLoading } =
		useQuery({
			queryKey: ["libraries", "allSupplying"],
			queryFn: () =>
				gqlClient.request(getLibraries, {
					order: "fullName",
					orderBy: "ASC",
					pageno: 0,
					pagesize: 1000,
					query: "",
				}),
		});
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
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.patronRequests.name").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout title={t("nav.patronRequests.name")}>
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
						label={
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
								<Typography variant="subTabTitle">
									{t("libraries.patronRequests.all_short", {
										number:
											inProgressLoading && unfilteredAllCount === null
												? t("common.loading")
												: totalSizes.all,
									})}
								</Typography>
								{isFilterApplied && (
									<FilterAltOutlined
										aria-label={t(
											"common.filterIsApplied",
											"Filter is applied",
										)}
										fontSize="small"
									/>
								)}
							</Box>
						}
					/>
				</Tabs>

				<Grid size={{ xs: 4, sm: 8, md: 12 }}>
					<Typography variant="h3" fontWeight={"bold"}>
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
						filterMode="server"
						filterModel={currentFilter}
						getDetailPanelContent={({ row }: any) => (
							<MasterDetail row={row} type="patronRequests" />
						)}
						identifier={gridId}
						loading={gridLoading}
						listViewEnabled={false}
						noResultsText={t("patron_requests.no_results")}
						onFilterModelChange={(model) => setFilterModel(gridId, model)}
						onPaginationModelChange={(model: any) =>
							setPaginationModel(gridId, model)
						}
						onRowModesModelChange={setRowModesModel}
						onSortModelChange={(model) => setSortModel(gridId, model)}
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
						type={gridId}
					/>
				</Grid>
			</Grid>
		</AdminLayout>
	);
}
