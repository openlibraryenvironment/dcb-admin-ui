import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Trans, useTranslation } from "next-i18next";
import Grid from "@mui/material/Unstable_Grid2";
import { Box, Button, Stack, Typography } from "@mui/material";
import { AdminLayout } from "@layout";
import { useState, useCallback } from "react";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";
import { ClientDataGrid } from "@components/ClientDataGrid";
import Link from "@components/Link/Link";
import AddressLink from "@components/Address/AddressLink";
import Error from "@components/Error/Error";
import Loading from "@components/Loading/Loading";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import {
	getLibraryById,
	getMappings,
	getNumericRangeMappings,
	getPatronRequests,
	updateAgencyParticipationStatus,
} from "src/queries/queries";
import { Library } from "@models/Library";
import { getILS } from "src/helpers/getILS";
import { findConsortium } from "src/helpers/findConsortium";
import {
	StyledAccordion,
	StyledAccordionSummary,
	StyledAccordionDetails,
	SubAccordion,
	SubAccordionSummary,
	SubAccordionDetails,
	StyledAccordionButton,
} from "@components/StyledAccordion/StyledAccordion";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import ServerPaginationGrid from "@components/ServerPaginatedGrid/ServerPaginatedGrid";
import Confirmation from "@components/Upload/Confirmation/Confirmation";
import { getInitialAccordionState } from "src/helpers/getInitialAccordionState";
import LibraryHostLmsDetails from "./LibraryHostLmsDetails";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import {
	standardNumRangeMappingColumns,
	standardPatronRequestColumns,
	standardRefValueMappingColumns,
	defaultPatronRequestLibraryColumnVisibility,
	finishedPatronRequestColumnVisibility,
	exceptionPatronRequestColumnVisibility,
} from "src/helpers/columns";
import { useCustomColumns } from "src/helpers/useCustomColumns";
import MasterDetail from "@components/MasterDetail/MasterDetail";
import { Person } from "@models/Person";

type LibraryDetails = {
	libraryId: any;
};

const INITIAL_EXPANDED_STATE = 3; // Number of accordions that should be initially expanded
const TOTAL_ACCORDIONS = 19; // Total number of accordions

export default function LibraryDetails({ libraryId }: LibraryDetails) {
	const { t } = useTranslation();
	const customColumns = useCustomColumns();

	// pollInterval is in ms - set to 2 mins
	const { data, loading, error } = useQuery(getLibraryById, {
		variables: {
			query: "id:" + libraryId,
		},
		pollInterval: 120000,
	});

	const [updateParticipation] = useMutation(updateAgencyParticipationStatus);
	const [supplyDisabled, setSupplyDisabled] = useState(false);
	const [supplyDisabledError, setSupplyDisabledError] = useState(false);
	const [supplyEnabled, setSupplyEnabled] = useState(false);
	const [supplyEnabledError, setSupplyEnabledError] = useState(false);
	const [borrowDisabled, setBorrowDisabled] = useState(false);
	const [borrowDisabledError, setBorrowDisabledError] = useState(false);
	const [borrowEnabled, setBorrowEnabled] = useState(false);
	const [borrowEnabledError, setBorrowEnabledError] = useState(false);

	// Handles toggling the library participation when a user clicks 'confirm'.
	const handleParticipationConfirmation = (
		active: string,
		targetParticipation: string,
		reason: string,
		changeCategory: string,
		changeReferenceUrl: string,
	) => {
		console.log(active);
		// Should be null if borrowing not active, true if we're looking to enable it, and false if we're looking to disable it
		const borrowInput =
			active == "borrowing"
				? targetParticipation == "disableBorrowing"
					? false
					: true
				: null;
		const supplyInput =
			active == "supplying"
				? targetParticipation == "disableSupplying"
					? false
					: true
				: null;
		// Pass the correct input to the mutation
		const input =
			active == "borrowing"
				? {
						code: library?.agencyCode,
						isBorrowingAgency: borrowInput ?? null,
						reason: reason,
						changeCategory: changeCategory,
						changeReferenceUrl: changeReferenceUrl,
					}
				: {
						code: library?.agencyCode,
						isSupplyingAgency: supplyInput ?? null,
						reason: reason,
						changeCategory: changeCategory,
						changeReferenceUrl: changeReferenceUrl,
					};
		updateParticipation({
			variables: {
				input,
			},
		})
			.then((response) => {
				// Handle successful response
				console.log("Participation status updated:", response?.data);
				// close the confirmation modal here - active determines the text shown
				closeConfirmation(active);
				// Makes sure we show the correct success alert.
				switch (targetParticipation) {
					case "disableSupplying":
						setSupplyDisabled(true);
						break;
					case "enableSupplying":
						setSupplyEnabled(true);
						break;
					case "disableBorrowing":
						setBorrowDisabled(true);
						break;
					case "enableBorrowing":
						setBorrowEnabled(true);
						break;
				}
			})
			.catch((error) => {
				// Handle error
				console.error("Error updating participation status:", error);
				// Show the correct error alert.
				switch (targetParticipation) {
					case "disableSupplying":
						setSupplyDisabledError(true);
						break;
					case "enableSupplying":
						setSupplyEnabledError(true);
						break;
					case "disableBorrowing":
						setBorrowDisabledError(true);
						break;
					case "enableBorrowing":
						setBorrowEnabledError(true);
						break;
				}
			});
	};

	const client = useApolloClient();
	const [showConfirmationBorrowing, setConfirmationBorrowing] = useState(false);
	const [showConfirmationSupplying, setConfirmationSupplying] = useState(false);

	const library: Library = data?.libraries?.content?.[0];

	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});

	const ils: string = getILS(library?.agency?.hostLms?.lmsClientClass);
	const isConsortiumGroupMember: boolean =
		findConsortium(library?.membership) != null ? true : false;

	const libraryGroups = library?.membership.map(
		(member: { libraryGroup: any }) => member.libraryGroup,
	);

	const openConfirmation = (participation: string) => {
		if (participation === "borrowing") {
			setConfirmationBorrowing(true);
		} else if (participation === "supplying") {
			setConfirmationSupplying(true);
		}
	};

	const closeConfirmation = (participation: string) => {
		if (participation === "borrowing") {
			setConfirmationBorrowing(false);
		} else if (participation === "supplying") {
			setConfirmationSupplying(false);
		}
		// This refetches the LoadLibrary query to ensure we're up-to-date after confirmation.
		client.refetchQueries({
			include: ["LoadLibrary"],
		});
	};

	const [expandedAccordions, setExpandedAccordions] = useState<boolean[]>(
		getInitialAccordionState(INITIAL_EXPANDED_STATE, TOTAL_ACCORDIONS),
	);

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

	if (loading || status === "loading") {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("libraries.library").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	// These are pre-sets for the library Patron Request grids.
	const exceptionQueryVariables = `patronHostlmsCode: "${library?.agency?.hostLms?.code}"AND status: "ERROR"`;
	const outOfSequenceQueryVariables = `patronHostlmsCode: "${library?.agency?.hostLms?.code}" AND NOT status:"ERROR" AND NOT status: "NO_ITEMS_AVAILABLE_AT_ANY_AGENCY" AND NOT status:"CANCELLED" AND NOT status:"FINALISED" AND NOT status:"COMPLETED" AND outOfSequenceFlag:true`;
	const inProgressQueryVariables = `patronHostlmsCode: "${library?.agency?.hostLms?.code}"AND NOT status:"ERROR" AND NOT status: "NO_ITEMS_AVAILABLE_AT_ANY_AGENCY" AND NOT status: "CANCELLED" AND NOT status: "FINALISED" AND NOT status:"COMPLETED" AND outOfSequenceFlag:false`;
	const finishedQueryVariables = `patronHostlmsCode: "${library?.agency?.hostLms?.code}"AND (status: "NO_ITEMS_AVAILABLE_AT_ANY_AGENCY" OR status: "CANCELLED" OR status: "FINALISED" OR status:"COMPLETED")`;

	const refValuePatronTypeVariables = `(toContext:"${library?.agency?.hostLms?.code}" OR fromContext:${library?.agency?.hostLms?.code}) AND (toCategory: "patronType" OR fromCategory: "patronType") AND NOT deleted:true`;
	const refValueItemTypeVariables = `(toContext:"${library?.agency?.hostLms?.code}" OR fromContext:${library?.agency?.hostLms?.code}) AND (toCategory: "ItemType" OR fromCategory: "ItemType") AND NOT deleted:true`;
	const refValueLocationVariables = `(toContext:"${library?.agency?.hostLms?.code}" OR fromContext:${library?.agency?.hostLms?.code}) AND (toCategory: "Location" OR fromCategory: "Location") AND NOT deleted:true`;

	const numericRangePatronTypeVariables = `context:${library?.agency?.hostLms?.code} AND domain: "patronType" AND NOT deleted: true`;
	const numericRangeItemTypeVariables = `context:${library?.agency?.hostLms?.code} AND domain: "ItemType" AND NOT deleted: true`;

	// Add ones for second Host LMS here.
	const refValuePatronTypeSecondHostLmsVariables = `(toContext:"${library?.agency?.hostLms?.code}" OR fromContext:${library?.agency?.hostLms?.code}) AND (toCategory: "patronType" OR fromCategory: "patronType") AND NOT deleted:true`;
	const refValueItemTypeSecondHostLmsVariables = `(toContext:"${library?.agency?.hostLms?.code}" OR fromContext:${library?.agency?.hostLms?.code}) AND (toCategory: "ItemType" OR fromCategory: "ItemType") AND NOT deleted:true`;
	const refValueLocationForLibrarySecondHostLmsVariables = `(toContext:"${library?.agency?.hostLms?.code}" OR fromContext:${library?.agency?.hostLms?.code}) AND (toCategory: "ItemType" OR fromCategory: "Location") AND NOT deleted:true`;

	const numericRangePatronTypeSecondHostLmsVariables = `context:"${library?.agency?.hostLms?.code}" AND domain: "patronType" AND NOT deleted: true`;
	const numericRangeItemTypeSecondHostLmsVariables = `context:"${library?.agency?.hostLms?.code}" AND domain: "ItemType" AND NOT deleted: true`;

	return error || library == null || library == undefined ? (
		<AdminLayout hideBreadcrumbs>
			{error ? (
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.action.go_back")}
					goBack="/libraries"
				/>
			) : (
				<Error
					title={t("ui.error.cannot_find_record")}
					message={t("ui.error.invalid_UUID")}
					description={t("ui.info.check_address")}
					action={t("ui.action.go_back")}
					goBack="/libraries"
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout title={library?.fullName}>
			<Stack direction="row" justifyContent="end">
				<StyledAccordionButton onClick={expandAll}>
					{expandedAccordions[10] ? t("details.collapse") : t("details.expand")}
				</StyledAccordionButton>
			</Stack>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[10]}
				onChange={handleAccordionChange(10)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="library-details-library"
					id="library-details-library"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="accordionSummary">
						{t("libraries.library")}
					</Typography>
				</StyledAccordionSummary>
				<StyledAccordionDetails>
					<Grid
						container
						spacing={{ xs: 2, md: 3 }}
						columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
					>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.name")}
								</Typography>
								<RenderAttribute attribute={library?.fullName} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.short_name")}
								</Typography>
								<RenderAttribute attribute={library?.shortName} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.abbreviated_name")}
								</Typography>
								<RenderAttribute attribute={library?.abbreviatedName} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.type")}
								</Typography>
								<RenderAttribute attribute={library?.type} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.agency_code")}
								</Typography>
								<RenderAttribute attribute={library?.agencyCode} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.support_hours")}
								</Typography>
								{/* This may need special handling when we have real data and know what format it's coming in */}
								<RenderAttribute attribute={library?.supportHours} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.service.environments.backup_schedule")}
								</Typography>
								<RenderAttribute attribute={library?.backupDowntimeSchedule} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.site_designation")}
								</Typography>
								{/* This may need special handling when we have real data and know what format it's coming in */}
								<RenderAttribute
									attribute={
										library?.agency?.hostLms?.clientConfig?.contextHierarchy[0]
									}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.library_id")}
								</Typography>
								<RenderAttribute attribute={library?.id} />
							</Stack>
						</Grid>
					</Grid>
					{/* /* 'Primary location' title goes here/* */}
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[8]}
						onChange={handleAccordionChange(8)}
						disableGutters
					>
						<SubAccordionSummary
							aria-controls="library-location"
							id="library-location"
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
						>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.primaryLocation.title")}
							</Typography>
						</SubAccordionSummary>
						<SubAccordionDetails>
							<Grid
								container
								spacing={{ xs: 2, md: 3 }}
								columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
							>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("libraries.primaryLocation.address")}
										</Typography>
										{/* This will need address-specific handling, and possibly its own component - leave as placeholder until we're ready + open maps in new tab*/}
										<AddressLink address={library?.address} />
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("libraries.primaryLocation.location")}
										</Typography>
										{/* This component handles lat/long in the same way as address - however we don't require both currently.
										{/* <Location
											latitude={library?.latitude}
											longitude={library?.longitude}
										/> */}
										<RenderAttribute
											attribute={
												"" + library?.latitude + ", " + library?.longitude
											}
										/>
									</Stack>
								</Grid>
							</Grid>
						</SubAccordionDetails>
					</SubAccordion>
					{isConsortiumGroupMember ? (
						<SubAccordion
							variant="outlined"
							expanded={expandedAccordions[4]}
							onChange={handleAccordionChange(4)}
							disableGutters
						>
							<SubAccordionSummary
								aria-controls="library-consortium"
								id="library-consortium"
								expandIcon={
									<IconContext.Provider value={{ size: "2em" }}>
										<MdExpandMore />
									</IconContext.Provider>
								}
							>
								<Typography variant="h3" fontWeight={"bold"}>
									{t("libraries.consortium.title")}
								</Typography>
							</SubAccordionSummary>
							<SubAccordionDetails>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("libraries.consortium.name")}
										</Typography>
										<RenderAttribute
											attribute={findConsortium(library?.membership)?.name}
										/>
									</Stack>
								</Grid>
							</SubAccordionDetails>
						</SubAccordion>
					) : null}
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[5]}
						onChange={handleAccordionChange(5)}
						disableGutters
					>
						<SubAccordionSummary
							aria-controls="library-groups"
							id="library-groups"
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
						>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.groups")}
							</Typography>
						</SubAccordionSummary>
						<SubAccordionDetails>
							<Grid xs={4} sm={8} md={12} lg={16}>
								<ClientDataGrid
									columns={[
										{
											field: "name",
											headerName: t("groups.name"),
											minWidth: 100,
											flex: 1,
										},
										{
											field: "code",
											headerName: t("groups.code"),
											minWidth: 50,
											flex: 0.5,
										},
										{
											field: "type",
											headerName: t("groups.type"),
											minWidth: 50,
											flex: 0.5,
										},
									]}
									data={libraryGroups}
									type="groupsOfLibrary"
									selectable={false}
									noDataTitle={t("groups.none_for_library")}
									toolbarVisible="not-visible"
									sortModel={[{ field: "name", sort: "asc" }]}
								/>
							</Grid>
						</SubAccordionDetails>
					</SubAccordion>
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[11]}
				onChange={handleAccordionChange(11)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="library-details-contacts"
					id="library-details-contacts"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="accordionSummary">
						{t("libraries.contacts.title")}
					</Typography>
				</StyledAccordionSummary>
				<StyledAccordionDetails>
					<ClientDataGrid
						columns={[
							{
								field: "role",
								headerName: t("libraries.contacts.role"),
								minWidth: 50,
								flex: 0.5,
							},
							{
								field: "name",
								headerName: t("libraries.contacts.name"),
								minWidth: 50,
								flex: 0.7,
								valueGetter: (value: string, row: Person) =>
									`${row.firstName} ${row.lastName}`,
							},
							{
								field: "email",
								headerName: t("libraries.contacts.email"),
								minWidth: 50,
								flex: 0.7,
							},
							{
								field: "isPrimaryContact",
								headerName: t("libraries.contacts.primary"),
								minWidth: 50,
								flex: 0.3,
							},
						]}
						data={library?.contacts}
						type="LibraryContacts"
						// No need for click through on this grid
						selectable={false}
						sortModel={[{ field: "isPrimaryContact", sort: "desc" }]}
						noDataTitle={"No groups found for this library."}
						toolbarVisible="search-only"
						disableHoverInteractions={true}
					></ClientDataGrid>
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[3]}
				onChange={handleAccordionChange(3)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="hostlms-client-config-details"
					id="hostlms_details_client_config"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="accordionSummary">
						{t("libraries.service.title")}
					</Typography>
				</StyledAccordionSummary>
				<StyledAccordionDetails>
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[6]}
						onChange={handleAccordionChange(6)}
						disableGutters
					>
						<SubAccordionSummary
							aria-controls="service-systems"
							id="service-systems"
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
						>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.service.systems.title")}
							</Typography>
						</SubAccordionSummary>
						<SubAccordionDetails>
							<Grid
								container
								spacing={{ xs: 2, md: 3 }}
								columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
							>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("libraries.service.systems.ils")}
										</Typography>
										<RenderAttribute attribute={ils} />
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("libraries.service.systems.discovery")}
										</Typography>
										<RenderAttribute attribute={library?.discoverySystem} />
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("libraries.service.systems.patron_site")}
										</Typography>
										{library?.patronWebsite ? (
											<Link
												href={library?.patronWebsite}
												title="Link to patron website"
											>
												{library?.patronWebsite}
											</Link>
										) : (
											<Typography variant="attributeText">-</Typography>
										)}
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("hostlms.configuration")}
										</Typography>
										<RenderAttribute
											attribute={library?.hostLmsConfiguration}
										/>
									</Stack>
								</Grid>
							</Grid>
						</SubAccordionDetails>
					</SubAccordion>
					{/* First / Circulation Host LMS Section'*/}
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[7]}
						onChange={handleAccordionChange(7)}
						disableGutters
					>
						<SubAccordionSummary
							aria-controls="service-hostlms"
							id="service-hostlms"
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
						>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.service.hostlms_title", {
									name: library?.agency?.hostLms?.name,
								})}
							</Typography>
						</SubAccordionSummary>
						<LibraryHostLmsDetails
							library={library}
							firstHostLms={library?.agency?.hostLms}
							secondHostLms={library?.secondHostLms}
						/>
					</SubAccordion>
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[2]}
				onChange={handleAccordionChange(2)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="library-configuration-details"
					id="library-configuration-details"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="accordionSummary">
						{t("libraries.config.title")}
					</Typography>
				</StyledAccordionSummary>
				<StyledAccordionDetails>
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[9]}
						onChange={handleAccordionChange(9)}
						disableGutters
					>
						<SubAccordionSummary
							aria-controls="library-configuration-patronAuthentication"
							id="library-configuration-patronAuthentication"
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
						>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.config.patronAuth.title")}
							</Typography>
						</SubAccordionSummary>
						<StyledAccordionDetails>
							<Grid
								container
								spacing={{ xs: 2, md: 3 }}
								columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
							>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("libraries.config.patronAuth.auth_profile")}
										</Typography>
										<RenderAttribute attribute={library?.agency?.authProfile} />
									</Stack>
								</Grid>
							</Grid>
						</StyledAccordionDetails>
					</SubAccordion>
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[17]}
						onChange={handleAccordionChange(17)}
						disableGutters
					>
						<SubAccordionSummary
							aria-controls="library-configuration-itemType"
							id="library-configuration-itemType"
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
						>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.config.data.mappings.item_type")}
							</Typography>
						</SubAccordionSummary>
						<SubAccordionDetails>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("mappings.ref_value_for", {
									hostLms: library?.agency?.hostLms?.code,
								})}
							</Typography>
							<ServerPaginationGrid
								query={getMappings}
								presetQueryVariables={refValueItemTypeVariables}
								type="referenceValueMappingsForLibrary"
								coreType="referenceValueMappings"
								columns={standardRefValueMappingColumns}
								noDataMessage={t("mappings.import_no_data")}
								noResultsMessage={t("mappings.no_results")}
								selectable={false}
								// This is how to set the default sort order
								sortModel={[{ field: "fromContext", sort: "asc" }]}
								sortDirection="ASC"
								sortAttribute="fromContext"
								pageSize={20}
								columnVisibilityModel={{
									fromCategory: false,
								}}
							/>
							{library?.secondHostLms ? (
								<Typography variant="h3" fontWeight={"bold"}>
									{t("mappings.ref_value_for", {
										hostLms: library?.secondHostLms?.code,
									})}
								</Typography>
							) : null}
							{library?.secondHostLms ? (
								<ServerPaginationGrid
									query={getMappings}
									presetQueryVariables={refValueItemTypeSecondHostLmsVariables}
									type="referenceValueMappingsForLibrary"
									coreType="referenceValueMappings"
									columns={standardRefValueMappingColumns}
									noDataMessage={t("mappings.import_no_data")}
									noResultsMessage={t("mappings.no_results")}
									selectable={false}
									// This is how to set the default sort order
									sortModel={[{ field: "fromContext", sort: "asc" }]}
									sortDirection="ASC"
									sortAttribute="fromContext"
									pageSize={20}
									columnVisibilityModel={{
										fromCategory: false,
									}}
								/>
							) : null}
							<Typography variant="h3" fontWeight={"bold"}>
								{t("mappings.numeric_range_for", {
									hostLms: library?.agency?.hostLms?.code,
								})}
							</Typography>
							<ServerPaginationGrid
								query={getNumericRangeMappings}
								presetQueryVariables={numericRangeItemTypeVariables}
								type="numericRangeMappingsForLibrary"
								coreType="numericRangeMappings"
								columns={standardNumRangeMappingColumns}
								noDataMessage={t("mappings.no_results")}
								noResultsMessage={t("mappings.no_results")}
								selectable={false}
								sortModel={[{ field: "context", sort: "asc" }]}
								pageSize={20}
								sortDirection="ASC"
								sortAttribute="context"
								columnVisibilityModel={{
									domain: false,
								}}
							/>
							{library?.secondHostLms ? (
								<Typography variant="h3" fontWeight={"bold"}>
									{t("mappings.numeric_range_for", {
										hostLms: library?.secondHostLms?.code,
									})}
								</Typography>
							) : null}
							{library?.secondHostLms ? (
								<ServerPaginationGrid
									query={getNumericRangeMappings}
									presetQueryVariables={
										numericRangeItemTypeSecondHostLmsVariables
									}
									type="numericRangeMappingsForLibrary"
									coreType="numericRangeMappings"
									columns={standardNumRangeMappingColumns}
									noDataMessage={t("mappings.no_results")}
									noResultsMessage={t("mappings.no_results")}
									selectable={false}
									sortModel={[{ field: "context", sort: "asc" }]}
									pageSize={20}
									sortDirection="ASC"
									sortAttribute="context"
									columnVisibilityModel={{
										domain: false,
									}}
								/>
							) : null}
						</SubAccordionDetails>
					</SubAccordion>
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[18]}
						onChange={handleAccordionChange(18)}
						disableGutters
					>
						<SubAccordionSummary
							aria-controls="library-configuration-location"
							id="library-configuration-location"
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
						>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.config.data.mappings.location")}
							</Typography>
						</SubAccordionSummary>
						<SubAccordionDetails>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("mappings.ref_value_for", {
									hostLms: library?.agency?.hostLms?.code,
								})}
							</Typography>
							<ServerPaginationGrid
								query={getMappings}
								presetQueryVariables={refValueLocationVariables}
								type="referenceValueMappingsForLibrary"
								coreType="referenceValueMappings"
								columns={standardRefValueMappingColumns}
								noDataMessage={t("mappings.import_no_data")}
								noResultsMessage={t("mappings.no_results")}
								selectable={false}
								// This is how to set the default sort order
								sortModel={[{ field: "fromContext", sort: "asc" }]}
								sortDirection="ASC"
								sortAttribute="fromContext"
								pageSize={20}
								columnVisibilityModel={{
									fromCategory: false,
								}}
							/>
							{library?.secondHostLms ? (
								<Typography variant="h3" fontWeight={"bold"}>
									{t("mappings.ref_value_for", {
										hostLms: library?.secondHostLms?.code,
									})}
								</Typography>
							) : null}
							{library?.secondHostLms ? (
								<ServerPaginationGrid
									query={getMappings}
									presetQueryVariables={
										refValueLocationForLibrarySecondHostLmsVariables
									}
									type="referenceValueMappingsForLibrary"
									coreType="referenceValueMappings"
									columns={standardRefValueMappingColumns}
									noDataMessage={t("mappings.import_no_data")}
									noResultsMessage={t("mappings.no_results")}
									selectable={false}
									// This is how to set the default sort order
									sortModel={[{ field: "fromContext", sort: "asc" }]}
									sortDirection="ASC"
									sortAttribute="fromContext"
									pageSize={20}
									columnVisibilityModel={{
										fromCategory: false,
									}}
								/>
							) : null}
						</SubAccordionDetails>
					</SubAccordion>
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[16]}
						onChange={handleAccordionChange(16)}
						disableGutters
					>
						<SubAccordionSummary
							aria-controls="library-configuration-patronTypes"
							id="library-configuration-patronTypes"
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
						>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("libraries.config.data.mappings.patron_type")}
							</Typography>
						</SubAccordionSummary>
						<SubAccordionDetails>
							<Typography variant="h3" fontWeight={"bold"}>
								{t("mappings.ref_value_for", {
									hostLms: library?.agency?.hostLms?.code,
								})}
							</Typography>
							<ServerPaginationGrid
								query={getMappings}
								presetQueryVariables={refValuePatronTypeVariables}
								type="referenceValueMappingsForLibrary"
								coreType="referenceValueMappings"
								columns={standardRefValueMappingColumns}
								noDataMessage={t("mappings.import_no_data")}
								noResultsMessage={t("mappings.no_results")}
								selectable={false}
								// This is how to set the default sort order
								sortModel={[{ field: "fromContext", sort: "asc" }]}
								sortDirection="ASC"
								sortAttribute="fromContext"
								pageSize={20}
								columnVisibilityModel={{
									fromCategory: false,
								}}
							/>
							{library?.secondHostLms ? (
								<Typography variant="h3" fontWeight={"bold"}>
									{t("mappings.ref_value_for", {
										hostLms: library?.secondHostLms?.code,
									})}
								</Typography>
							) : null}
							{library?.secondHostLms ? (
								<ServerPaginationGrid
									query={getMappings}
									presetQueryVariables={
										refValuePatronTypeSecondHostLmsVariables
									}
									type="referenceValueMappingsForLibrary"
									coreType="referenceValueMappings"
									columns={standardRefValueMappingColumns}
									noDataMessage={t("mappings.import_no_data")}
									noResultsMessage={t("mappings.no_results")}
									selectable={false}
									// This is how to set the default sort order
									sortModel={[{ field: "fromContext", sort: "asc" }]}
									sortDirection="ASC"
									sortAttribute="fromContext"
									pageSize={20}
									columnVisibilityModel={{
										fromCategory: false,
									}}
								/>
							) : null}
							<Typography variant="h3" fontWeight={"bold"}>
								{t("mappings.numeric_range_for", {
									hostLms: library?.agency?.hostLms?.code,
								})}
							</Typography>
							<ServerPaginationGrid
								query={getNumericRangeMappings}
								presetQueryVariables={numericRangePatronTypeVariables}
								type="numericRangeMappingsForLibrary"
								coreType="numericRangeMappings"
								columns={standardNumRangeMappingColumns}
								noDataMessage={t("mappings.no_results")}
								noResultsMessage={t("mappings.no_results")}
								selectable={false}
								sortModel={[{ field: "context", sort: "asc" }]}
								pageSize={20}
								sortDirection="ASC"
								sortAttribute="context"
								columnVisibilityModel={{
									domain: false,
								}}
							/>
							{library?.secondHostLms ? (
								<Typography variant="h3" fontWeight={"bold"}>
									{t("mappings.numeric_range_for", {
										hostLms: library?.secondHostLms?.code,
									})}
								</Typography>
							) : null}
							{library?.secondHostLms ? (
								<ServerPaginationGrid
									query={getNumericRangeMappings}
									presetQueryVariables={
										numericRangePatronTypeSecondHostLmsVariables
									}
									type="numericRangeMappingsForLibrary"
									coreType="numericRangeMappings"
									columns={standardNumRangeMappingColumns}
									noDataMessage={t("mappings.no_results")}
									noResultsMessage={t("mappings.no_results")}
									selectable={false}
									sortModel={[{ field: "context", sort: "asc" }]}
									pageSize={20}
									sortDirection="ASC"
									sortAttribute="context"
									columnVisibilityModel={{
										domain: false,
									}}
								/>
							) : null}
						</SubAccordionDetails>
					</SubAccordion>
				</StyledAccordionDetails>
			</StyledAccordion>
			{library?.agency ? (
				<StyledAccordion
					variant="outlined"
					expanded={expandedAccordions[15]}
					onChange={handleAccordionChange(15)}
					disableGutters
				>
					<StyledAccordionSummary
						aria-controls="library-circulation-details"
						id="library-circulation-details"
						expandIcon={
							<IconContext.Provider value={{ size: "2em" }}>
								<MdExpandMore />
							</IconContext.Provider>
						}
					>
						<Typography variant="accordionSummary">
							{t("libraries.circulation.title")}
						</Typography>
					</StyledAccordionSummary>
					<StyledAccordionDetails>
						<Grid
							container
							spacing={{ xs: 2, md: 3 }}
							columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
						>
							<Grid xs={2} sm={4} md={4}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("libraries.circulation.supplying_status")}
									</Typography>
									{library?.agency?.isSupplyingAgency
										? t("libraries.circulation.enabled_supply")
										: library?.agency?.isSupplyingAgency == false
											? t("libraries.circulation.disabled_supply")
											: t("libraries.circulation.not_set")}
								</Stack>
								<Button
									onClick={() => openConfirmation("supplying")}
									color="primary"
									variant="contained"
									type="submit"
								>
									{library?.agency?.isSupplyingAgency
										? t("libraries.circulation.confirmation.disable_supplying")
										: t("libraries.circulation.confirmation.enable_supplying")}
								</Button>
							</Grid>
							<Grid xs={2} sm={4} md={4}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("libraries.circulation.borrowing_status")}
									</Typography>
									{library?.agency?.isBorrowingAgency
										? t("libraries.circulation.enabled_borrow")
										: library?.agency?.isBorrowingAgency == false
											? t("libraries.circulation.disabled_borrow")
											: t("libraries.circulation.not_set")}
								</Stack>
								<Button
									onClick={() => openConfirmation("borrowing")}
									color="primary"
									variant="contained"
									type="submit"
								>
									{library?.agency?.isBorrowingAgency
										? t("libraries.circulation.confirmation.disable_borrowing")
										: t("libraries.circulation.confirmation.enable_borrowing")}
								</Button>
							</Grid>
						</Grid>
					</StyledAccordionDetails>
				</StyledAccordion>
			) : null}
			{library?.agency?.hostLms?.code ? (
				<StyledAccordion
					variant="outlined"
					expanded={expandedAccordions[0]}
					onChange={handleAccordionChange(0)}
					disableGutters
				>
					<StyledAccordionSummary
						aria-controls="library-patron-requests"
						id="library-patron-requests"
						expandIcon={
							<IconContext.Provider value={{ size: "2em" }}>
								<MdExpandMore />
							</IconContext.Provider>
						}
					>
						<Typography variant="accordionSummary">
							{t("nav.patronRequests")}
						</Typography>
					</StyledAccordionSummary>
					<StyledAccordionDetails>
						<SubAccordion
							variant="outlined"
							expanded={expandedAccordions[1]}
							onChange={handleAccordionChange(1)}
							disableGutters
						>
							<SubAccordionSummary
								aria-controls="exception-patron-requests"
								id="exception-patron-requests"
								expandIcon={
									<IconContext.Provider value={{ size: "2em" }}>
										<MdExpandMore />
									</IconContext.Provider>
								}
							>
								<Typography variant="h3" fontWeight={"bold"}>
									{t("libraries.patronRequests.exception", {
										number: totalSizes["patronRequestsLibraryException"],
									})}
								</Typography>
							</SubAccordionSummary>
							<SubAccordionDetails>
								<ServerPaginationGrid
									query={getPatronRequests}
									presetQueryVariables={exceptionQueryVariables}
									type="patronRequestsLibraryException"
									coreType="patronRequests"
									columns={[...customColumns, ...standardPatronRequestColumns]}
									selectable={true}
									pageSize={20}
									noDataMessage={t("patron_requests.no_rows")}
									noResultsMessage={t("patron_requests.no_results")}
									searchPlaceholder={t(
										"patron_requests.search_placeholder_error_message",
									)}
									columnVisibilityModel={{
										...defaultPatronRequestLibraryColumnVisibility,
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
							</SubAccordionDetails>
						</SubAccordion>
						{/* // Out of sequence patron requests */}
						<SubAccordion
							variant="outlined"
							expanded={expandedAccordions[12]}
							onChange={handleAccordionChange(12)}
							disableGutters
						>
							<SubAccordionSummary
								aria-controls="out-of-sequence-patron-requests"
								id="out-of-sequence-patron-requests"
								expandIcon={
									<IconContext.Provider value={{ size: "2em" }}>
										<MdExpandMore />
									</IconContext.Provider>
								}
							>
								<Typography variant="h3" fontWeight={"bold"}>
									{t("libraries.patronRequests.out_of_sequence", {
										number: totalSizes["patronRequestsLibraryOutOfSequence"],
									})}
								</Typography>
							</SubAccordionSummary>
							<SubAccordionDetails>
								<ServerPaginationGrid
									query={getPatronRequests}
									presetQueryVariables={outOfSequenceQueryVariables}
									type="patronRequestsLibraryOutOfSequence"
									coreType="patronRequests"
									columns={[...customColumns, ...standardPatronRequestColumns]}
									selectable={true}
									pageSize={20}
									noDataMessage={t("patron_requests.no_rows")}
									noResultsMessage={t("patron_requests.no_results")}
									searchPlaceholder={t(
										"patron_requests.search_placeholder_status",
									)}
									columnVisibilityModel={
										defaultPatronRequestLibraryColumnVisibility
									}
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
							</SubAccordionDetails>
						</SubAccordion>
						{/* In progress patron requests (Active) */}
						<SubAccordion
							variant="outlined"
							expanded={expandedAccordions[13]}
							onChange={handleAccordionChange(13)}
							disableGutters
						>
							<SubAccordionSummary
								aria-controls="in-progress-patron-requests"
								id="in-progress-patron-requests"
								expandIcon={
									<IconContext.Provider value={{ size: "2em" }}>
										<MdExpandMore />
									</IconContext.Provider>
								}
							>
								<Typography variant="h3" fontWeight={"bold"}>
									{t("libraries.patronRequests.active", {
										number: totalSizes["patronRequestsLibraryActive"],
									})}
								</Typography>
							</SubAccordionSummary>
							<SubAccordionDetails>
								<ServerPaginationGrid
									query={getPatronRequests}
									presetQueryVariables={inProgressQueryVariables}
									type="patronRequestsLibraryActive"
									coreType="patronRequests"
									columns={[...customColumns, ...standardPatronRequestColumns]}
									selectable={true}
									pageSize={20}
									noDataMessage={t("patron_requests.no_rows")}
									noResultsMessage={t("patron_requests.no_results")}
									searchPlaceholder={t(
										"patron_requests.search_placeholder_status",
									)}
									columnVisibilityModel={
										defaultPatronRequestLibraryColumnVisibility
									}
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
							</SubAccordionDetails>
						</SubAccordion>
						{/* Finished / Completed patron requests */}
						<SubAccordion
							variant="outlined"
							expanded={expandedAccordions[14]}
							onChange={handleAccordionChange(14)}
							disableGutters
						>
							<SubAccordionSummary
								aria-controls="finished-patron-requests"
								id="finished-patron-requests"
								expandIcon={
									<IconContext.Provider value={{ size: "2em" }}>
										<MdExpandMore />
									</IconContext.Provider>
								}
							>
								<Typography variant="h3" fontWeight={"bold"}>
									{t("libraries.patronRequests.completed", {
										number: totalSizes["patronRequestsLibraryCompleted"],
									})}
								</Typography>
							</SubAccordionSummary>
							<SubAccordionDetails>
								<ServerPaginationGrid
									query={getPatronRequests}
									presetQueryVariables={finishedQueryVariables}
									type="patronRequestsLibraryCompleted"
									coreType="patronRequests"
									columns={[...customColumns, ...standardPatronRequestColumns]}
									selectable={true}
									pageSize={20}
									noDataMessage={t("patron_requests.no_rows")}
									noResultsMessage={t("patron_requests.no_results")}
									searchPlaceholder={t(
										"patron_requests.search_placeholder_status",
									)}
									columnVisibilityModel={{
										...defaultPatronRequestLibraryColumnVisibility,
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
							</SubAccordionDetails>
						</SubAccordion>
					</StyledAccordionDetails>
				</StyledAccordion>
			) : null}
			<Box>
				{showConfirmationBorrowing ? (
					<Confirmation
						open={showConfirmationBorrowing}
						onClose={() => closeConfirmation("borrowing")}
						onConfirm={(reason, changeCategory, changeReferenceUrl) =>
							handleParticipationConfirmation(
								"borrowing",
								library?.agency?.isBorrowingAgency
									? "disableBorrowing"
									: "enableBorrowing",
								reason,
								changeCategory,
								changeReferenceUrl,
							)
						} // Needs to be handleConfirm "borrowing" and ideally saying which one it is
						type="participationStatus"
						participation={
							library?.agency?.isBorrowingAgency
								? "disableBorrowing"
								: "enableBorrowing"
						}
						library={library?.shortName}
						code={library?.agency?.code}
					/>
				) : null}
				{showConfirmationSupplying ? (
					<Confirmation
						open={showConfirmationSupplying}
						onClose={() => closeConfirmation("supplying")}
						onConfirm={(reason, changeCategory, changeReferenceUrl) =>
							handleParticipationConfirmation(
								"supplying",
								library?.agency?.isSupplyingAgency
									? "disableSupplying"
									: "enableSupplying",
								reason,
								changeCategory,
								changeReferenceUrl,
							)
						} // Needs to be handleConfirm "borrowing" and ideally saying which one it is
						type={"participationStatus"}
						participation={
							library?.agency?.isSupplyingAgency
								? "disableSupplying"
								: "enableSupplying"
						}
						library={library?.fullName}
						code={library?.agency?.code}
					/>
				) : null}
			</Box>
			{/* // Success alerts for toggling participation */}
			<TimedAlert
				open={borrowEnabled}
				severityType="success"
				autoHideDuration={6000}
				alertText={
					<Trans
						i18nKey="libraries.circulation.confirmation.alert.borrowing_enabled"
						values={{ library: library?.fullName }}
						components={{ bold: <strong /> }}
					/>
				}
				key={"borrow-enabled-success-alert"}
				onCloseFunc={() => setBorrowEnabled(false)}
			/>
			<TimedAlert
				open={borrowDisabled}
				severityType="success"
				autoHideDuration={6000}
				alertText={
					<Trans
						i18nKey="libraries.circulation.confirmation.alert.borrowing_disabled"
						values={{ library: library?.fullName }}
						components={{ bold: <strong /> }}
					/>
				}
				key={"borrow-disabled-success-alert"}
				onCloseFunc={() => setBorrowDisabled(false)}
			/>
			<TimedAlert
				open={supplyEnabled}
				severityType="success"
				autoHideDuration={6000}
				alertText={
					<Trans
						i18nKey="libraries.circulation.confirmation.alert.supplying_enabled"
						values={{ library: library?.fullName }}
						components={{ bold: <strong /> }}
					/>
				}
				key={"supply-enabled-success-alert"}
				onCloseFunc={() => setSupplyEnabled(false)}
			/>
			<TimedAlert
				open={supplyDisabled}
				severityType="success"
				autoHideDuration={6000}
				alertText={
					<Trans
						i18nKey="libraries.circulation.confirmation.alert.supplying_disabled"
						values={{ library: library?.fullName }}
						components={{ bold: <strong /> }}
					/>
				}
				key={"supply-disabled-success-alert"}
				onCloseFunc={() => setSupplyDisabled(false)}
			/>
			{/* // Error alerts for toggling participation */}
			<TimedAlert
				open={borrowEnabledError}
				severityType="error"
				autoHideDuration={6000}
				alertText={
					<Trans
						i18nKey="libraries.circulation.confirmation.alert.borrowing_enabled_fail"
						values={{ library: library?.fullName }}
						components={{ bold: <strong /> }}
					/>
				}
				key={"borrow-enabled-error-alert"}
				onCloseFunc={() => setBorrowEnabledError(false)}
			/>
			<TimedAlert
				open={supplyEnabledError}
				severityType="error"
				autoHideDuration={6000}
				alertText={
					<Trans
						i18nKey="libraries.circulation.confirmation.alert.supplying_enabled_fail"
						values={{ library: library?.fullName }}
						components={{ bold: <strong /> }}
					/>
				}
				key={"supply-enabled-error-alert"}
				onCloseFunc={() => setSupplyEnabledError(false)}
			/>
			<TimedAlert
				open={borrowDisabledError}
				severityType="error"
				autoHideDuration={6000}
				alertText={
					<Trans
						i18nKey="libraries.circulation.confirmation.alert.borrowing_disabled_fail"
						values={{ library: library?.fullName }}
						components={{ bold: <strong /> }}
					/>
				}
				key={"borrow-disabled-error-alert"}
				onCloseFunc={() => setBorrowDisabledError(false)}
			/>
			<TimedAlert
				open={supplyDisabledError}
				severityType="error"
				autoHideDuration={6000}
				alertText={
					<Trans
						i18nKey="libraries.circulation.confirmation.alert.supplying_disabled_fail"
						values={{ library: library?.fullName }}
						components={{ bold: <strong /> }}
					/>
				}
				key={"supply-disabled-error-alert"}
				onCloseFunc={() => setSupplyDisabledError(false)}
			/>
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
	const libraryId = ctx.params.libraryId;
	return {
		props: {
			libraryId,
			...translations,
		},
	};
}
