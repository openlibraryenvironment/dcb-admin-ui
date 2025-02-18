import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { AdminLayout } from "@layout";
//localisation
import { useTranslation } from "next-i18next";
import {
	getLocationForPatronRequestGrid,
	getPatronRequests,
} from "src/queries/queries";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Loading from "@components/Loading/Loading";
import {
	standardPatronRequestColumns,
	defaultPatronRequestColumnVisibility,
	finishedPatronRequestColumnVisibility,
	exceptionPatronRequestColumnVisibility,
	patronRequestColumnsNoStatusFilter,
} from "src/helpers/columns";
import { Stack, Typography } from "@mui/material";
import {
	StyledAccordion,
	StyledAccordionButton,
	StyledAccordionDetails,
	StyledAccordionSummary,
} from "@components/StyledAccordion/StyledAccordion";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";
import { useCallback, useState } from "react";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import { useCustomColumns } from "@hooks/useCustomColumns";
import { equalsOnly } from "src/helpers/filters";
import { useQuery } from "@apollo/client";
import { Location } from "@models/Location";

const PatronRequests: NextPage = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});
	const customColumns = useCustomColumns();

	const exceptionQueryVariables = `status: "ERROR"`;
	const outOfSequenceQueryVariables = `outOfSequenceFlag:true AND NOT status:"ERROR" AND NOT status: "NO_ITEMS_SELECTABLE_AT_ANY_AGENCY" AND NOT status:"CANCELLED" AND NOT status:"FINALISED" AND NOT status:"COMPLETED"`;
	const inProgressQueryVariables = `outOfSequenceFlag:false AND NOT status:"ERROR" AND NOT status: "NO_ITEMS_SELECTABLE_AT_ANY_AGENCY" AND NOT status: "CANCELLED" AND NOT status: "FINALISED" AND NOT status:"COMPLETED"`;
	const finishedQueryVariables = `(status: "NO_ITEMS_SELECTABLE_AT_ANY_AGENCY" OR status: "CANCELLED" OR status: "FINALISED" OR status:"COMPLETED")`;

	// Make sure you do fetch all data
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
			// Adjust the query as needed to get all locations
			onCompleted: (data) => {
				if (data.locations.content.length < data.locations.totalSize) {
					// Calculate how many pages we need to fetch - must match page size above^^.
					const totalPages = Math.ceil(data.locations.totalSize / 1000);
					// Create an array of promises for each additional page
					// This ensures we get all the pages - when using standard fetchmore we were only getting a max of 2 additional pages.
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
					// Execute all fetch promises
					Promise.all(fetchPromises).catch((error) =>
						console.error("Error fetching additional locations:", error),
					);
				}
			},
		},
	);

	const patronRequestLocations: Location[] = locationsData?.locations.content;

	// Combines standard columns with master detail , pickup location checkbox columns
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
				// If array of locations is returned
				return (
					patronRequestLocations.find((loc: Location) => loc.id === locationId)
						?.name || locationId
				);
			}

			return locationId;
		},
	};
	const supplierIndex = patronRequestColumnsNoStatusFilter.findIndex(
		(col) => col.field === "supplyingAgency",
	);
	const noStatusColumns = [
		...patronRequestColumnsNoStatusFilter.slice(0, supplierIndex + 1),
		pickupLocationColumn,
		...patronRequestColumnsNoStatusFilter.slice(supplierIndex + 1),
	];
	const standardColumns = [
		...standardPatronRequestColumns.slice(0, supplierIndex + 1),
		pickupLocationColumn,
		...standardPatronRequestColumns.slice(supplierIndex + 1),
	];
	// Combines standard columns with master detail and checkbox columns

	const allColumns = [...customColumns, ...standardColumns];

	const [expandedAccordions, setExpandedAccordions] = useState([
		true,
		false,
		false,
		false,
		false,
	]);

	const handleAccordionChange = useCallback(
		(index: number) => () => {
			setExpandedAccordions((prevExpanded) => {
				const newExpanded = [...prevExpanded];
				newExpanded[index] = !newExpanded[index];
				return newExpanded;
			});
		},
		[],
	);

	// Has an issue when the first is expanded by default
	const expandAll = useCallback(() => {
		setExpandedAccordions((prevExpanded) => {
			const allExpanded = prevExpanded.some((isExpanded) => !isExpanded);
			return prevExpanded.map(() => allExpanded);
		});
	}, []);

	const [totalSizes, setTotalSizes] = useState<{ [key: string]: number }>({});

	const handleTotalSizeChange = useCallback((type: string, size: number) => {
		setTotalSizes((prevTotalSizes) => ({
			...prevTotalSizes,
			[type]: size,
		}));
	}, []);

	if (status === "loading") {
		return (
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("nav.patronRequests").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout title={t("nav.patronRequests")}>
			<Stack direction="row" justifyContent="end">
				<StyledAccordionButton onClick={expandAll}>
					{expandedAccordions[0] && expandedAccordions[1]
						? t("details.collapse")
						: t("details.expand")}
				</StyledAccordionButton>
			</Stack>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[0]}
				onChange={handleAccordionChange(0)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="exceptionRequests"
					id="exceptionRequests"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h3" fontWeight={"bold"}>
						{t("libraries.patronRequests.exception", {
							number: totalSizes["patronRequestsException"],
						})}
					</Typography>
				</StyledAccordionSummary>
				<StyledAccordionDetails>
					<ServerPaginationGrid
						query={getPatronRequests}
						presetQueryVariables={exceptionQueryVariables}
						type="patronRequestsException"
						coreType="patronRequests"
						columns={[...customColumns, ...noStatusColumns]}
						selectable={true}
						pageSize={20}
						noDataMessage={t("patron_requests.no_rows")}
						noResultsMessage={t("patron_requests.no_results")}
						searchPlaceholder={t(
							"patron_requests.search_placeholder_error_message",
						)}
						columnVisibilityModel={{
							...defaultPatronRequestColumnVisibility,
							...exceptionPatronRequestColumnVisibility,
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
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[1]}
				onChange={handleAccordionChange(1)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="outOfSequenceRequests"
					id="outOfSequenceRequests"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h3" fontWeight={"bold"}>
						{t("libraries.patronRequests.out_of_sequence", {
							number: totalSizes["patronRequestsOutOfSequence"],
						})}
					</Typography>
				</StyledAccordionSummary>
				<StyledAccordionDetails>
					<ServerPaginationGrid
						query={getPatronRequests}
						presetQueryVariables={outOfSequenceQueryVariables}
						type="patronRequestsOutOfSequence"
						coreType="patronRequests"
						columns={allColumns}
						selectable={true}
						pageSize={20}
						noDataMessage={t("patron_requests.no_rows")}
						noResultsMessage={t("patron_requests.no_results")}
						searchPlaceholder={t("patron_requests.search_placeholder_status")}
						columnVisibilityModel={defaultPatronRequestColumnVisibility}
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
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[2]}
				onChange={handleAccordionChange(2)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="active"
					id="activeRequests"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h3" fontWeight={"bold"}>
						{t("libraries.patronRequests.active", {
							number: totalSizes["patronRequestsActive"],
						})}
					</Typography>
				</StyledAccordionSummary>
				<StyledAccordionDetails>
					<ServerPaginationGrid
						query={getPatronRequests}
						presetQueryVariables={inProgressQueryVariables}
						type="patronRequestsActive"
						coreType="patronRequests"
						columns={allColumns}
						selectable={true}
						pageSize={20}
						noDataMessage={t("patron_requests.no_rows")}
						noResultsMessage={t("patron_requests.no_results")}
						searchPlaceholder={t("patron_requests.search_placeholder_status")}
						columnVisibilityModel={defaultPatronRequestColumnVisibility}
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
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[3]}
				onChange={handleAccordionChange(3)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="completedPatronRequests"
					id="completedPatronRequests"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h3" fontWeight={"bold"}>
						{t("libraries.patronRequests.completed", {
							number: totalSizes["patronRequestsCompleted"],
						})}
					</Typography>
				</StyledAccordionSummary>
				<StyledAccordionDetails>
					<ServerPaginationGrid
						query={getPatronRequests}
						presetQueryVariables={finishedQueryVariables}
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
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[4]}
				onChange={handleAccordionChange(4)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="allRequests"
					id="allRequests"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h3" fontWeight={"bold"}>
						{t("libraries.patronRequests.all", {
							number: totalSizes["patronRequests"],
						})}
					</Typography>
				</StyledAccordionSummary>
				<StyledAccordionDetails>
					<ServerPaginationGrid
						query={getPatronRequests}
						type="patronRequests"
						coreType="patronRequests"
						columns={allColumns}
						selectable={true}
						pageSize={20}
						noDataMessage={t("patron_requests.no_rows")}
						noResultsMessage={t("patron_requests.no_results")}
						searchPlaceholder={t(
							"patron_requests.search_placeholder_error_message",
						)}
						columnVisibilityModel={{
							...defaultPatronRequestColumnVisibility,
							errorMessage: true,
							outOfSequenceFlag: true,
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
				</StyledAccordionDetails>
			</StyledAccordion>
		</AdminLayout>
	);
};

export const getServerSideProps: GetServerSideProps = async (
	context: GetServerSidePropsContext,
) => {
	const { locale } = context;
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
};
export default PatronRequests;
