import { useApolloClient, useQuery } from "@apollo/client";
import { ClientDataGrid } from "@components/ClientDataGrid";
import Error from "@components/Error/Error";
import Link from "@components/Link/Link";
import Loading from "@components/Loading/Loading";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { AdminLayout } from "@layout";
import {
	Stack,
	Button,
	Typography,
	CircularProgress,
	Tooltip,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import axios from "axios";
import dayjs from "dayjs";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import getConfig from "next/config";
import { useState } from "react";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";
import { getPatronRequestById } from "src/queries/queries";
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
import { formatDuration } from "src/helpers/formatDuration";
import { cleanupStatuses, untrackedStatuses } from "src/helpers/statuses";

type PatronRequestDetails = {
	patronRequestId: string;
};

export default function PatronRequestDetails({
	patronRequestId,
}: PatronRequestDetails) {
	const { t } = useTranslation();
	const { publicRuntimeConfig } = getConfig();
	const client = useApolloClient();
	const { data: session, status }: { data: any; status: any } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});
	const [loadingUpdate, setLoadingUpdate] = useState(false);
	const [loadingCleanup, setLoadingCleanup] = useState(false);
	const [updateSuccessAlertVisibility, setUpdateSuccessAlertVisibility] =
		useState(false);
	const [cleanupSuccessAlertVisibility, setCleanupSuccessAlertVisibility] =
		useState(false);
	const [updateErrorAlertVisibility, setErrorAlertVisibility] = useState(false);
	const [cleanupErrorAlertVisibility, setCleanupErrorAlertVisibility] =
		useState(false);
	const router = useRouter();

	const { loading, data, error } = useQuery(getPatronRequestById, {
		variables: {
			query: "id:" + patronRequestId,
		},
		pollInterval: 180000,
	});

	// define PR data type.

	const patronRequest = data?.patronRequests?.content?.[0];
	const members = patronRequest?.clusterRecord?.members;

	const [expandedAccordions, setExpandedAccordions] = useState([
		true, // General
		false, // Borrowing -> Patron
		false, // Pickup
		true, // Supplying
		true, // Borrowing
		true, // Audit log
		false, // Bib record
		false, // Bib source record
		false, // Supplying -> Item
		false, // Supplying -> Patron
		false, // Borrowing -> Virtual item
		false, // Pickup -> Virtual patron
		false, // Pickup -> Virtual item
	]);

	// Functions to handle expanding both individual accordions and all accordions
	const handleAccordionChange = (index: number) => () => {
		setExpandedAccordions((prevExpanded) => {
			const newExpanded = [...prevExpanded];
			newExpanded[index] = !newExpanded[index];
			return newExpanded;
		});
	};

	// Works for closing + expanding as it sets values to their opposite
	const expandAll = () => {
		setExpandedAccordions((prevExpanded) =>
			prevExpanded.map(() => !prevExpanded[0]),
		);
	};

	const bibClusterRecordUrl = publicRuntimeConfig.DCB_SEARCH_BASE
		? "/search?q=" + patronRequest?.bibClusterId
		: "";

	const updateUrl =
		publicRuntimeConfig.DCB_API_BASE +
		"/patrons/requests/" +
		patronRequestId +
		"/update";
	const cleanupUrl =
		publicRuntimeConfig.DCB_API_BASE +
		"/patrons/requests/" +
		patronRequestId +
		"/transition/cleanup";

	const handleUpdate: any = async () => {
		setLoadingUpdate(true);
		try {
			await axios.post<any>(
				updateUrl,
				{},
				{
					headers: { Authorization: `Bearer ${session?.accessToken}` },
				},
			);
			setUpdateSuccessAlertVisibility(true);
		} catch (error) {
			console.error("Error starting update", error);
			console.log("Request data: ", data);
			setErrorAlertVisibility(true);
		}

		console.log("Request to update: ", data);
		client.refetchQueries({
			include: ["LoadPatronRequestsById"],
		});
		setLoadingUpdate(false);
	};

	const handleCleanup: any = async () => {
		setLoadingCleanup(true);
		try {
			await axios.post<any>(
				cleanupUrl,
				{},
				{
					headers: { Authorization: `Bearer ${session?.accessToken}` },
				},
			);
			setLoadingCleanup(false);
			setCleanupSuccessAlertVisibility(true);
		} catch (error) {
			console.error("Error starting cleanup", error);
			console.log("Request data: ", data);
			setCleanupErrorAlertVisibility(true);
		}
		client.refetchQueries({
			include: ["LoadPatronRequestsById"],
		});
		setLoadingCleanup(false);
	};

	if (loading || status === "loading") {
		return (
			<AdminLayout>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("patron_requests.pr_one"),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return error || patronRequest == null || patronRequest == undefined ? (
		<AdminLayout hideBreadcrumbs>
			{error ? (
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.action.go_back")}
					goBack="/patronRequests"
				/>
			) : (
				<Error
					title={t("ui.error.cannot_find_record")}
					message={t("ui.error.invalid_UUID")}
					description={t("ui.info.check_address")}
					action={t("ui.action.go_back")}
					goBack="/patronRequests"
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout title={patronRequest?.clusterRecord?.title}>
			<Stack direction="row" justifyContent="end">
				<StyledAccordionButton onClick={expandAll}>
					{expandedAccordions[0] ? t("details.collapse") : t("details.expand")}
				</StyledAccordionButton>
			</Stack>
			<StyledAccordion // General
				variant="outlined"
				expanded={expandedAccordions[0]}
				onChange={handleAccordionChange(0)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="request-general-details"
					id="request_details_general"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="accordionSummary">
						{t("details.general")}
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
									{t("details.patron_hostlms")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.patronHostlmsCode} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.borrowing_patron_barcode")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.requestingIdentity?.localBarcode}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.supplying_agency_code")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.suppliers[0]?.localAgency}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.request_created")}
								</Typography>
								<RenderAttribute
									attribute={dayjs(patronRequest?.dateCreated).format(
										"YYYY-MM-DD HH:mm",
									)}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.request_updated")}
								</Typography>
								<RenderAttribute
									attribute={dayjs(patronRequest?.dateUpdated).format(
										"YYYY-MM-DD HH:mm",
									)}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.next_poll")}
								</Typography>
								<RenderAttribute
									attribute={dayjs(patronRequest?.nextScheduledPoll).format(
										"YYYY-MM-DD HH:mm",
									)}
								/>
							</Stack>
							<Tooltip
								title={
									!untrackedStatuses.includes(patronRequest?.status)
										? ""
										: t("details.check_for_updates_disabled", {
												status: patronRequest?.status,
											}) // Tooltip text when disabled
								}
							>
								<span>
									<Button
										variant="outlined"
										color="primary"
										sx={{ marginTop: 1 }}
										onClick={handleUpdate}
										aria-disabled={loadingUpdate ? true : false}
										disabled={
											loadingUpdate ||
											untrackedStatuses.includes(patronRequest?.status)
												? true
												: false
										}
									>
										{t("details.check_for_updates")}
										{loadingUpdate ? (
											<CircularProgress
												color="inherit"
												size={13}
												sx={{ marginLeft: "10px" }}
											/>
										) : null}
									</Button>
								</span>
							</Tooltip>
							<TimedAlert
								open={
									updateSuccessAlertVisibility || cleanupSuccessAlertVisibility
								}
								severityType="success"
								autoHideDuration={6000}
								alertText={
									updateSuccessAlertVisibility
										? t("details.check_successful")
										: t("patron_requests.cleanup_successful")
								}
								key={
									updateSuccessAlertVisibility
										? "update-success-alert"
										: "cleanup-success-alert"
								}
								onCloseFunc={
									updateSuccessAlertVisibility
										? () => setUpdateSuccessAlertVisibility(false)
										: () => setCleanupSuccessAlertVisibility(false)
								}
							/>
							<TimedAlert
								open={updateErrorAlertVisibility || cleanupErrorAlertVisibility}
								severityType="error"
								autoHideDuration={6000}
								alertText={
									updateErrorAlertVisibility
										? t("details.check_unsuccessful")
										: t("patron_requests.cleanup_unsuccessful")
								}
								key={
									updateErrorAlertVisibility
										? "update-error-alert"
										: "cleanup-error-alert"
								}
								onCloseFunc={
									updateErrorAlertVisibility
										? () => setErrorAlertVisibility(false)
										: () => setCleanupErrorAlertVisibility(false)
								}
							/>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.previous_status")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.previousStatus} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.status")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.status} />
							</Stack>
							{session?.profile?.roles?.includes("CONSORTIUM_ADMIN") ? (
								<Tooltip
									title={
										cleanupStatuses.includes(patronRequest?.status)
											? // Must be both request with ERROR or non-terminal state and a user with CONSORTIUM_ADMIN
												t("patron_requests.cleanup_info")
											: t("patron_requests.cleanup_disabled") // Tooltip text when disabled
									}
								>
									<span>
										<Button
											variant="outlined"
											color="primary"
											sx={{ marginTop: 1 }}
											onClick={handleCleanup}
											aria-disabled={loadingCleanup ? true : false}
											disabled={
												loadingCleanup ||
												!cleanupStatuses.includes(patronRequest?.status)
													? true
													: false
											}
										>
											{t("patron_requests.cleanup")}
											{loadingCleanup ? (
												<CircularProgress
													color="inherit"
													size={13}
													sx={{ marginLeft: "10px" }}
												/>
											) : null}
										</Button>
									</span>
								</Tooltip>
							) : null}
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.next_expected_status")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.nextExpectedStatus?.toString()}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.status_changed")}
								</Typography>
								<RenderAttribute
									attribute={dayjs(
										patronRequest?.currentStatusTimestamp,
									).format("YYYY-MM-DD HH:mm:ss.SSS")}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.time_in_status")}
								</Typography>
								<RenderAttribute
									attribute={formatDuration(
										patronRequest?.elapsedTimeInCurrentStatus,
									)}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.polling_checks_in_status")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.pollCountForCurrentStatus?.toString()}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.active_workflow")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.activeWorkflow} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.is_transition_out_of_sequence")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.outOfSequenceFlag?.toString()}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.resolution_count")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.resolutionCount?.toString()}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.error")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.errorMessage} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.requestor_note")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.requestorNote} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.description")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.description} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.request_uuid")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.id} />
							</Stack>
						</Grid>
					</Grid>
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion // Bib record
				variant="outlined"
				expanded={expandedAccordions[6]}
				onChange={handleAccordionChange(6)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="request-bib-record"
					id="request_bib_record"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="accordionSummary">
						{t("details.bib_record")}
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
									{t("details.title")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.clusterRecord?.title}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.record_created")}
								</Typography>
								<RenderAttribute
									attribute={dayjs(
										patronRequest?.clusterRecord?.dateCreated,
									).format("YYYY-MM-DD HH:mm")}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.record_updated")}
								</Typography>
								<RenderAttribute
									attribute={dayjs(
										patronRequest?.clusterRecord?.dateUpdated,
									).format("YYYY-MM-DD HH:mm")}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.bib_cluster_uuid")}
								</Typography>
								{bibClusterRecordUrl == "" ? (
									<RenderAttribute attribute={patronRequest?.bibClusterId} />
								) : (
									<Link
										href={bibClusterRecordUrl}
										key="bibClusterRecordLink"
										title={t("link.discovery_tip")}
									>
										<RenderAttribute attribute={patronRequest?.bibClusterId} />
									</Link>
								)}
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.selected_bib_uuid")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.clusterRecord?.selectedBib}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.source_record_id")}
								</Typography>
								<RenderAttribute
									attribute={
										patronRequest?.clusterRecord?.members[0]?.sourceRecordId
									}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.source_system_id")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.clusterRecord?.sourceSystemId}
								/>
							</Stack>
						</Grid>
					</Grid>
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[7]}
						onChange={handleAccordionChange(7)}
						disableGutters
					>
						<SubAccordionSummary
							aria-controls="request-source-record"
							id="request_source_record"
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
						>
							<Typography variant="h3" sx={{ fontWeight: "bold" }}>
								{t("details.source_record")}
							</Typography>
						</SubAccordionSummary>
						<SubAccordionDetails>
							{members &&
							members.some(
								(member: { sourceRecord: any }) => member.sourceRecord !== null,
							) ? (
								members.map(
									(member: { sourceRecord: any }, index: number) =>
										member.sourceRecord && (
											<pre key={index}>
												{JSON.stringify(member.sourceRecord, null, 2)}
											</pre>
										),
								)
							) : (
								<Typography variant="body1">
									{t("details.source_record_not_found")}
								</Typography>
							)}
						</SubAccordionDetails>
					</SubAccordion>
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion // Supplying
				variant="outlined"
				expanded={expandedAccordions[3]}
				onChange={handleAccordionChange(3)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="request-supplier-details"
					id="request_details_supplier"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="accordionSummary">
						{t("details.supplying")}
					</Typography>
				</StyledAccordionSummary>
				{/* We may have to change this for multiple suppliers. Could make it a grid. */}
				<StyledAccordionDetails>
					<Grid
						container
						spacing={{ xs: 2, md: 3 }}
						columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
					>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.supplying_agency_code")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.suppliers[0]?.localAgency}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("hostlms.code")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.suppliers[0]?.hostLmsCode}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.active")}
								</Typography>
								<RenderAttribute
									attribute={String(patronRequest?.suppliers[0]?.isActive)}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.date_created")}
								</Typography>
								<RenderAttribute
									attribute={dayjs(
										patronRequest?.suppliers[0]?.dateCreated,
									).format("YYYY-MM-DD HH:mm")}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.date_updated")}
								</Typography>
								<RenderAttribute
									attribute={dayjs(
										patronRequest?.suppliers[0]?.dateUpdated,
									).format("YYYY-MM-DD HH:mm")}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.local_request_status")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.suppliers[0]?.localStatus}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.local_request_status_raw")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.suppliers[0]?.rawLocalStatus}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.supplier_uuid")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.suppliers[0]?.id} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.local_bib_id")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.suppliers[0]?.localBibId}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.local_supplier_id")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.suppliers[0]?.localId}
								/>
							</Stack>
						</Grid>
					</Grid>
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[8]}
						onChange={handleAccordionChange(8)}
					>
						<SubAccordionSummary
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
							aria-controls={"supplying-item"}
							id={"supplying-item"}
						>
							<Typography variant="h3" sx={{ fontWeight: "bold" }}>
								{t("details.item")}
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
											{t("details.local_item_barcode")}
										</Typography>
										<RenderAttribute
											attribute={patronRequest?.suppliers[0]?.localItemBarcode}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.local_item_loc")}
										</Typography>
										<RenderAttribute
											attribute={
												patronRequest?.suppliers[0]?.localItemLocationCode
											}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.local_item_status")}
										</Typography>
										<RenderAttribute
											attribute={patronRequest?.suppliers[0]?.localItemStatus}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.local_item_status_raw")}
										</Typography>
										<RenderAttribute
											attribute={
												patronRequest?.suppliers[0]?.rawLocalItemStatus
											}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.local_item_type")}
										</Typography>
										<RenderAttribute
											attribute={patronRequest?.suppliers[0]?.localItemType}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.supplier_ctype")}
										</Typography>
										<RenderAttribute
											attribute={patronRequest?.suppliers[0]?.canonicalItemType}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.local_item_id")}
										</Typography>
										<RenderAttribute
											attribute={patronRequest?.suppliers[0]?.localItemId}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.item_manually_selected")}
										</Typography>
										<RenderAttribute
											attribute={patronRequest.isManuallySelectedItem?.toString()}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.item_manual_agency_code")}
										</Typography>
										<RenderAttribute
											attribute={patronRequest?.localItemAgencyCode}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.item_manual_hostlms_code")}
										</Typography>
										<RenderAttribute
											attribute={patronRequest?.localItemHostlmsCode}
										/>
									</Stack>
								</Grid>
							</Grid>
						</SubAccordionDetails>
					</SubAccordion>
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[9]}
						onChange={handleAccordionChange(9)}
					>
						<SubAccordionSummary
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
							aria-controls={"supplying-virtual-patron"}
							id={"supplying-virtual-patron"}
						>
							<Typography variant="h3" sx={{ fontWeight: "bold" }}>
								{t("details.virtual_patron")}
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
											{t("details.local_id")}
										</Typography>
										<RenderAttribute
											attribute={
												patronRequest?.suppliers[0]?.virtualPatron?.localId
											}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.local_barcode")}
										</Typography>
										<RenderAttribute
											attribute={
												patronRequest?.suppliers[0]?.virtualPatron?.localBarcode
											}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.borrowing_patron_type")}
										</Typography>
										<RenderAttribute
											attribute={
												patronRequest?.suppliers[0]?.virtualPatron?.localPtype
											}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{"DCB patron type"}
										</Typography>
										<RenderAttribute
											attribute={
												patronRequest?.suppliers[0]?.virtualPatron
													?.canonicalPtype
											}
										/>
									</Stack>
								</Grid>
							</Grid>
						</SubAccordionDetails>
					</SubAccordion>
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion // Borrowing
				variant="outlined"
				expanded={expandedAccordions[4]}
				onChange={handleAccordionChange(4)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="request-details-borrowing"
					id="request_details_borrowing"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="accordionSummary">
						{t("details.borrowing", "Borrowing")}
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
									{t("hostlms.code")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.patronHostlmsCode} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.borrowing_request_id")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.localRequestId} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.borrowing_request_status")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.localRequestStatus}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.borrowing_request_status_raw")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.rawLocalRequestStatus}
								/>
							</Stack>
						</Grid>
					</Grid>
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[1]}
						onChange={handleAccordionChange(1)}
					>
						<SubAccordionSummary
							aria-controls="request-patron-details"
							id="request_details_patron"
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
						>
							<Typography variant="h3" sx={{ fontWeight: "bold" }}>
								{t("details.patron")}
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
											{t("details.borrowing_patron_id")}
										</Typography>
										<RenderAttribute
											attribute={patronRequest?.requestingIdentity?.localId}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.borrowing_patron_barcode")}
										</Typography>
										<RenderAttribute
											attribute={
												patronRequest?.requestingIdentity?.localBarcode
											}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.borrowing_patron_type")}
										</Typography>
										<RenderAttribute
											attribute={patronRequest?.requestingIdentity?.localPtype}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.patron_canonical_ptype")}
										</Typography>
										<RenderAttribute
											attribute={
												patronRequest?.requestingIdentity?.canonicalPtype
											}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.patron_uuid")}
										</Typography>
										<RenderAttribute attribute={patronRequest?.patron?.id} />
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.requestor_uuid")}
										</Typography>
										<RenderAttribute
											attribute={patronRequest?.requestingIdentity?.id}
										/>
									</Stack>
								</Grid>
							</Grid>
						</SubAccordionDetails>
					</SubAccordion>
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[10]}
						onChange={handleAccordionChange(10)}
					>
						<SubAccordionSummary
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
							aria-controls={"borrowing-patron"}
							id={"borrowing-virtual-item"}
						>
							<Typography variant="h3" sx={{ fontWeight: "bold" }}>
								{t("details.virtual_item")}
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
											{t("details.borrowing_virtual_id")}
										</Typography>
										<RenderAttribute attribute={patronRequest?.localItemId} />
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.borrowing_virtual_type")}
										</Typography>
										<RenderAttribute attribute={patronRequest?.localItemType} />
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.borrowing_virtual_item_status")}
										</Typography>
										<RenderAttribute
											attribute={patronRequest?.localItemStatus}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.borrowing_virtual_item_status_raw")}
										</Typography>
										<RenderAttribute
											attribute={patronRequest?.rawLocalItemStatus}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.borrowing_virtual_bib_id")}
										</Typography>
										<RenderAttribute attribute={patronRequest?.localBibId} />
									</Stack>
								</Grid>
							</Grid>
						</SubAccordionDetails>
					</SubAccordion>
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion // Pickup
				variant="outlined"
				expanded={expandedAccordions[2]}
				onChange={handleAccordionChange(2)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="request-pickup-details"
					id="request_details_pickup"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="accordionSummary">
						{t("details.pickup")}
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
									{t("details.pickup_code_uuid")}
								</Typography>
								{patronRequest?.pickupLocationCode ? (
									<Link
										href={`/locations/${patronRequest?.pickupLocationCode}`}
									>
										<RenderAttribute
											attribute={patronRequest?.pickupLocationCode}
										/>
									</Link>
								) : (
									<RenderAttribute
										attribute={patronRequest?.pickupLocationCode}
									/>
								)}
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.pickup_request_id")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.pickupRequestId} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.pickup_request_status")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.pickupRequestStatus}
								/>
							</Stack>
						</Grid>
					</Grid>
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[11]}
						onChange={handleAccordionChange(11)}
					>
						<SubAccordionSummary
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
							aria-controls={"pickup-virtual-patron"}
							id={"pickup-virtual-patron"}
						>
							<Typography variant="h3" sx={{ fontWeight: "bold" }}>
								{t("details.virtual_patron")}
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
											{t("details.pickup_patron_id")}
										</Typography>
										<RenderAttribute
											attribute={patronRequest?.pickupPatronId}
										/>
									</Stack>
								</Grid>
							</Grid>
						</SubAccordionDetails>
					</SubAccordion>
					<SubAccordion
						variant="outlined"
						expanded={expandedAccordions[12]}
						onChange={handleAccordionChange(12)}
					>
						<SubAccordionSummary
							expandIcon={
								<IconContext.Provider value={{ size: "2em" }}>
									<MdExpandMore />
								</IconContext.Provider>
							}
							aria-controls={"pickup-virtual-item"}
							id={"pickup-virtual-item"}
						>
							<Typography variant="h3" sx={{ fontWeight: "bold" }}>
								{t("details.virtual_item")}
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
											{t("details.pickup_item_id")}
										</Typography>
										<RenderAttribute attribute={patronRequest?.pickupItemId} />
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.pickup_item_type")}
										</Typography>
										<RenderAttribute
											attribute={patronRequest?.pickupItemType}
										/>
									</Stack>
								</Grid>
								<Grid xs={2} sm={4} md={4}>
									<Stack direction={"column"}>
										<Typography variant="attributeTitle">
											{t("details.pickup_item_status")}
										</Typography>
										<RenderAttribute
											attribute={patronRequest?.pickupItemStatus}
										/>
									</Stack>
								</Grid>
							</Grid>
						</SubAccordionDetails>
					</SubAccordion>
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion // Audit log
				variant="outlined"
				expanded={expandedAccordions[5]}
				onChange={handleAccordionChange(5)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="request-audit_log"
					id="request_audit_log"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography id="auditlog" variant="accordionSummary">
						{t("details.audit_log")}
					</Typography>
				</StyledAccordionSummary>
				<StyledAccordionDetails>
					<ClientDataGrid
						data={patronRequest?.audit}
						columns={[
							{
								field: "auditDate",
								headerName: "Audit date",
								minWidth: 60,
								flex: 0.2,
								valueGetter: (value: string, row: { auditDate: string }) => {
									const auditDate = row.auditDate;
									return dayjs(auditDate).format("YYYY-MM-DD HH:mm:ss.SSS");
								},
							},
							{
								field: "briefDescription",
								headerName: "Description",
								minWidth: 100,
								flex: 0.4,
							},
							{
								field: "fromStatus",
								headerName: "fromStatus",
								minWidth: 50,
								flex: 0.25,
							},
							{
								field: "toStatus",
								headerName: "toStatus",
								minWidth: 50,
								flex: 0.25,
							},
						]}
						type="Audit"
						// This grid could show click-through details of its own for each audit log entry
						selectable={true}
						noDataTitle={t("details.audit_log_no_data")}
						noDataMessage={t("details.audit_log_no_rows")}
						sortModel={[{ field: "auditDate", sort: "desc" }]}
						operationDataType="Audit"
					/>
					<pre>{JSON.stringify(patronRequest?.audit?.auditData, null, 2)}</pre>
				</StyledAccordionDetails>
			</StyledAccordion>
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
	const patronRequestId = ctx.params.patronRequestId;
	return {
		props: {
			patronRequestId,
			...translations,
		},
	};
}
