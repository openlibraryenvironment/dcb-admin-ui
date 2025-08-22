import { useQuery } from "@apollo/client";
import { Box, Grid, Tab, Tabs, Typography } from "@mui/material";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import {
	getLocationForPatronRequestGrid,
	getPatronRequests,
	getPatronRequestTotals,
} from "src/queries/queries";
import {
	defaultPatronRequestColumnVisibility,
	finishedPatronRequestColumnVisibility,
	patronRequestColumnsNoStatusFilter,
	standardPatronRequestColumns,
} from "src/helpers/DataGrid/columns";
import Loading from "@components/Loading/Loading";
import { AdminLayout } from "@layout";
import { useCallback, useState } from "react";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { equalsOnly } from "src/helpers/DataGrid/filters";
import { Location } from "@models/Location";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { handleTopLevelPatronRequestTabChange } from "src/helpers/navigation/handleTabChange";
import { queries } from "src/constants/patronRequestGridQueries";
import { FilterAltOutlined } from "@mui/icons-material";

export default function Active() {
	const { t } = useTranslation();
	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			router.push("/auth/logout");
		},
	});
	const [tabIndex, setTabIndex] = useState(3);
	const [totalSizes, setTotalSizes] = useState({
		exception: 0,
		outOfSequence: 0,
		inProgress: 0,
		finished: 0,
		all: 0,
	});
	const [unfilteredCompletedCount, setUnfilteredCompletedCount] = useState<
		number | null
	>(null);
	const [isFilterApplied, setIsFilterApplied] = useState(false);

	// Helper function to update a specific count while preserving other counts
	const updateCount = useCallback((key: string, count: number) => {
		setTotalSizes((prev) => {
			const newSizes = { ...prev, [key]: count };
			// Recalculate the "all" total whenever any individual count changes
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

	const { data: locationsData, fetchMore } = useQuery(
		getLocationForPatronRequestGrid,
		{
			variables: {
				query: "",
				order: "name",
				orderBy: "ASC",
				pagesize: 100,
				pageno: 0,
			},
			onCompleted: (data) => {
				if (data.locations.content.length < data.locations.totalSize) {
					const totalPages = Math.ceil(data.locations.totalSize / 100);
					const fetchPromises = Array.from(
						{ length: totalPages - 1 },
						(_, index) =>
							fetchMore({
								variables: {
									pageno: index + 1,
								},
								updateQuery: (prev, { fetchMoreResult }) => {
									if (!fetchMoreResult) return prev;
									return {
										locations: {
											...fetchMoreResult.locations,
											content: [
												...prev.locations.content,
												...fetchMoreResult.locations.content,
											],
										},
									};
								},
							}),
					);
					Promise.all(fetchPromises).catch((error) =>
						console.error("Error fetching additional locations:", error),
					);
				}
			},
			errorPolicy: "all",
		},
	);

	// Callback for when the grid reports its total size
	const handleTotalSizeChange = useCallback(
		(gridType: string, currentGridSize: number) => {
			if (gridType === "patronRequestsCompleted") {
				// Update the count for the "inProgress" tab to reflect the grid's current size
				updateCount("finished", currentGridSize);

				if (unfilteredCompletedCount !== null) {
					setIsFilterApplied(currentGridSize < unfilteredCompletedCount);
				} else {
					setIsFilterApplied(false);
				}
			} else {
				// Handle other grids if they also use this callback with different types
				updateCount(gridType, currentGridSize);
			}
		},
		[updateCount, unfilteredCompletedCount],
	);

	const patronRequestLocations: Location[] = locationsData?.locations.content;

	// Query for Exception tab count
	const { loading: exceptionLoading } = useQuery(getPatronRequestTotals, {
		variables: {
			query: queries.exception,
			pageno: 0,
			pagesize: 1,
			order: "dateCreated",
			orderBy: "DESC",
		},
		onCompleted: (data) => {
			updateCount("exception", data?.patronRequests?.totalSize || 0);
		},
		errorPolicy: "all",
	});

	// Query for Out of Sequence tab count
	const { loading: outOfSequenceLoading } = useQuery(getPatronRequestTotals, {
		variables: {
			query: queries.outOfSequence,
			pageno: 0,
			pagesize: 1,
			order: "dateCreated",
			orderBy: "DESC",
		},
		onCompleted: (data) => {
			updateCount("outOfSequence", data?.patronRequests?.totalSize || 0);
		},
		errorPolicy: "all",
	});

	// Query for In Progress tab count
	const { loading: inProgressLoading } = useQuery(getPatronRequestTotals, {
		variables: {
			query: queries.inProgress,
			pageno: 0,
			pagesize: 1,
			order: "dateCreated",
			orderBy: "DESC",
		},
		onCompleted: (data) => {
			updateCount("inProgress", data?.patronRequests?.totalSize || 0);
		},
		errorPolicy: "all",
	});

	// Query for Finished tab count
	const { loading: finishedLoading } = useQuery(getPatronRequestTotals, {
		variables: {
			query: queries.finished,
			pageno: 0,
			pagesize: 1,
			order: "dateCreated",
			orderBy: "DESC",
		},
		onCompleted: (data) => {
			updateCount("finished", data?.patronRequests?.totalSize || 0);
			setUnfilteredCompletedCount(data?.patronRequests?.totalSize);
		},
		errorPolicy: "all",
	});

	const pickupLocationColumn = {
		field: "pickupLocationCode",
		headerName: t("patron_requests.pickup_location_name"),
		minWidth: 100,
		flex: 0.5,
		filterOperators: equalsOnly,
		valueGetter: (value: string) => {
			const locationId = value;
			if (!locationId) return "";
			if (Array.isArray(patronRequestLocations)) {
				return (
					patronRequestLocations.find((loc: Location) => loc.id === locationId)
						?.name || locationId
				);
			}
			return locationId;
		},
		errorPolicy: "all",
	};

	const customColumns = useCustomColumns();
	const supplierIndex = patronRequestColumnsNoStatusFilter.findIndex(
		(col) => col.field === "supplyingAgency",
	);

	const standardColumns = [
		...standardPatronRequestColumns.slice(0, supplierIndex + 1),
		pickupLocationColumn,
		...standardPatronRequestColumns.slice(supplierIndex + 1),
	];

	const allColumns = [...customColumns, ...standardColumns];

	if (status === "loading") {
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
					value={tabIndex}
					onChange={(event, value) => {
						handleTopLevelPatronRequestTabChange(
							event,
							value,
							router,
							setTabIndex,
						);
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
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 0.5,
								}}
							>
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
					<Typography variant="h3" fontWeight={"bold"}>
						{t("libraries.patronRequests.completed", {
							number: totalSizes.finished,
						})}
					</Typography>
					<ServerPaginationGrid
						query={getPatronRequests}
						presetQueryVariables={queries.finished}
						type="patronRequestsCompleted"
						coreType="patronRequests"
						columns={allColumns}
						selectable={true}
						pageSize={20}
						noDataMessage={t("patron_requests.no_rows")}
						noResultsMessage={t("patron_requests.no_results")}
						searchPlaceholder={t("patron_requests.search_placeholder_status")}
						columnVisibilityModel={{
							...defaultPatronRequestColumnVisibility,
							...finishedPatronRequestColumnVisibility,
						}}
						scrollbarVisible={true}
						// This is how to set the default sort order - so the grid loads as sorted by 'lastCreated' by default.
						sortModel={[{ field: "dateCreated", sort: "desc" }]}
						sortDirection="DESC"
						sortAttribute="dateCreated"
						onTotalSizeChange={handleTotalSizeChange}
						getDetailPanelContent={({ row }: any) => (
							<MasterDetail row={row} type="patronRequests" />
						)}
					/>
				</Grid>
			</Grid>
		</AdminLayout>
	);
}

export async function getServerSideProps(ctx: any) {
	const { locale } = ctx;
	let translations = {};
	if (locale) {
		translations = await serverSideTranslations(locale as string, [
			"common",
			"application",
			"validation",
		]);
	}
	return {
		props: {
			...translations,
		},
	};
}
