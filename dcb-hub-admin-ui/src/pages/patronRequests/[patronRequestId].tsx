import { useApolloClient, useQuery } from "@apollo/client";
import { ClientDataGrid } from "@components/ClientDataGrid";
import Link from "@components/Link/Link";
import { AdminLayout } from "@layout";
import {
	Stack,
	Button,
	Typography,
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Card,
	useTheme,
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

type PatronRequestDetails = {
	patronRequestId: string;
};

export default function PatronRequestDetails({
	patronRequestId,
}: PatronRequestDetails) {
	const { t } = useTranslation();
	const theme = useTheme();
	const { publicRuntimeConfig } = getConfig();
	const client = useApolloClient();
	const { data: session }: { data: any } = useSession();

	const { loading, data } = useQuery(getPatronRequestById, {
		variables: {
			query: "id:" + patronRequestId,
		},
		pollInterval: 120000,
	});

	// define PR data type.

	const patronRequest = data?.patronRequests?.content?.[0];
	const members = patronRequest?.clusterRecord?.members;

	const [expandedAccordions, setExpandedAccordions] = useState([
		true,
		true,
		true,
		true,
		true,
		true,
		true,
		false,
		false,
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

	// Check for the presence of a configured discovery scaffold URL. If it's there, render the URL: if not return blank.
	const bibClusterRecordUrl = publicRuntimeConfig.DISCOVERY_SCAFFOLD_URL
		? publicRuntimeConfig.DISCOVERY_SCAFFOLD_URL +
			"resourceDescription/" +
			patronRequest?.bibClusterId
		: "";
	const updateUrl =
		publicRuntimeConfig.DCB_API_BASE +
		"/patrons/requests/" +
		patronRequestId +
		"/update";
	const handleUpdate: any = async () => {
		const data = await axios.post<any>(
			updateUrl,
			{},
			{
				headers: { Authorization: `Bearer ${session?.accessToken}` },
			},
		);
		console.log("Request to update: " + data);
		// We may wish to add a loading spinner to this button in future. Ideally this would also be a GraphQL mutation.
		client.refetchQueries({
			include: ["LoadPatronRequestsById"],
		});
	};

	return loading ? (
		<AdminLayout title={t("common.loading")} />
	) : (
		<AdminLayout title={patronRequest?.clusterRecord?.title}>
			<Stack direction="row" justifyContent="end">
				<Button onClick={expandAll}>
					{expandedAccordions[0] ? t("details.collapse") : t("details.expand")}
				</Button>
			</Stack>
			<Accordion
				variant="outlined"
				sx={{ border: "0" }}
				expanded={expandedAccordions[0]}
				onChange={handleAccordionChange(0)}
			>
				<AccordionSummary
					sx={{
						backgroundColor: theme.palette.primary.detailsAccordionSummary,
					}}
					aria-controls="request-general-details"
					id="request_details_general"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							{" "}
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h2" sx={{ fontWeight: "bold" }}>
						{t("details.general")}
					</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Grid
						container
						spacing={{ xs: 2, md: 3 }}
						columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
					>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.request_id")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.id} />
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
									{t("details.description")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.description} />
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
									{t("details.status")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.status} />
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
									{t("details.active_workflow")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.activeWorkflow} />
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
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Button
									variant="outlined"
									color="primary"
									onClick={handleUpdate}
								>
									{t("details.start_update")}
								</Button>
							</Stack>
						</Grid>
					</Grid>
				</AccordionDetails>
			</Accordion>
			<Accordion
				variant="outlined"
				sx={{ border: "0" }}
				expanded={expandedAccordions[6]}
				onChange={handleAccordionChange(6)}
			>
				<AccordionSummary
					sx={{
						backgroundColor: theme.palette.primary.detailsAccordionSummary,
					}}
					aria-controls="request-bib-record"
					id="request_bib_record"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							{" "}
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h2" sx={{ fontWeight: "bold" }}>
						{" "}
						{t("details.bib_record")}{" "}
					</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Grid
						container
						spacing={{ xs: 2, md: 3 }}
						columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
					>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.bib_cluster_id")}
								</Typography>
								{bibClusterRecordUrl == "" ? (
									<RenderAttribute attribute={patronRequest?.bibClusterId} />
								) : (
									<Link
										href={bibClusterRecordUrl}
										key="bibClusterRecordLink"
										target="_blank"
										rel="noreferrer"
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
									{t("details.title")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.clusterRecord?.title}
								/>
							</Stack>
						</Grid>
						{patronRequest?.clusterRecord?.members[0]?.author != null ? (
							<Grid xs={2} sm={4} md={4}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("details.author")}
									</Typography>
									<RenderAttribute
										attribute={patronRequest?.clusterRecord?.members[0]?.author}
									/>
								</Stack>
							</Grid>
						) : null}
						{/* Add similar Grid items for other Typography elements */}
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
									{t("details.selected_bib")}
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
					<Card variant="outlined">
						<Accordion
							variant="outlined"
							sx={{ border: "0" }}
							expanded={expandedAccordions[7]}
							onChange={handleAccordionChange(7)}
						>
							<AccordionSummary
								sx={{
									backgroundColor:
										theme.palette.primary.detailsAccordionSummary,
								}}
								aria-controls="request-source-record"
								id="request_source_record"
								expandIcon={
									<IconContext.Provider value={{ size: "2em" }}>
										{" "}
										<MdExpandMore />
									</IconContext.Provider>
								}
							>
								<Typography variant="h3" sx={{ fontWeight: "bold" }}>
									{" "}
									{t("details.source_record")}{" "}
								</Typography>
							</AccordionSummary>
							<AccordionDetails>
								{members &&
								members.some(
									(member: { sourceRecord: any }) =>
										member.sourceRecord !== null,
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
							</AccordionDetails>
						</Accordion>
					</Card>
				</AccordionDetails>
			</Accordion>
			<Accordion
				variant="outlined"
				sx={{ border: "0" }}
				expanded={expandedAccordions[1]}
				onChange={handleAccordionChange(1)}
			>
				<AccordionSummary
					sx={{
						backgroundColor: theme.palette.primary.detailsAccordionSummary,
					}}
					aria-controls="request-patron-details"
					id="request_details_patron"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							{" "}
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h2" sx={{ fontWeight: "bold" }}>
						{" "}
						{t("details.patron")}{" "}
					</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Grid
						container
						spacing={{ xs: 2, md: 3 }}
						columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
					>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.patron_id")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.patron?.id} />
							</Stack>
						</Grid>
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
									{t("details.requestor_id")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.requestingIdentity?.id}
								/>
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.local_item_id")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.localItemId} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.local_item_status")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.localItemStatus} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.local_bib_id")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.localBibId} />
							</Stack>
						</Grid>
					</Grid>
				</AccordionDetails>
			</Accordion>
			<Accordion
				variant="outlined"
				sx={{ border: "0" }}
				expanded={expandedAccordions[2]}
				onChange={handleAccordionChange(2)}
			>
				<AccordionSummary
					sx={{
						backgroundColor: theme.palette.primary.detailsAccordionSummary,
					}}
					aria-controls="request-pickup-details"
					id="request_details_pickup"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							{" "}
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h2" sx={{ fontWeight: "bold" }}>
						{" "}
						{t("details.pickup")}{" "}
					</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Grid
						container
						spacing={{ xs: 2, md: 3 }}
						columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
					>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.pickup_code")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.pickupLocationCode}
								/>
							</Stack>
						</Grid>
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
									{t("details.pickup_item_status")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.pickupItemStatus} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.pickup_item_type")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.pickupItemType} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.pickup_patron_id")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.pickupPatronId} />
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
				</AccordionDetails>
			</Accordion>
			<Accordion
				variant="outlined"
				sx={{ border: "0" }}
				expanded={expandedAccordions[3]}
				onChange={handleAccordionChange(3)}
			>
				<AccordionSummary
					sx={{
						backgroundColor: theme.palette.primary.detailsAccordionSummary,
					}}
					aria-controls="request-supplier-details"
					id="request_details_supplier"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							{" "}
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h2" sx={{ fontWeight: "bold" }}>
						{" "}
						{t("details.supplier")}{" "}
					</Typography>
				</AccordionSummary>
				{/* We may have to change this for multiple suppliers. Could make it a grid. */}
				<AccordionDetails>
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
									{t("details.supplier_id")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.suppliers[0]?.id} />
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
									{t("details.hostlms_code")}
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
									attribute={patronRequest?.suppliers[0]?.localItemLocationCode}
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
									{t("details.local_supplier_id")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.suppliers[0]?.localId}
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
					</Grid>
				</AccordionDetails>
			</Accordion>
			<Accordion
				variant="outlined"
				sx={{ border: "0" }}
				expanded={expandedAccordions[4]}
				onChange={handleAccordionChange(4)}
			>
				<AccordionSummary
					sx={{
						backgroundColor: theme.palette.primary.detailsAccordionSummary,
					}}
					aria-controls="request-details-borrowing"
					id="request_details_borrowing"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							{" "}
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h2" sx={{ fontWeight: "bold" }}>
						{" "}
						{t("details.borrowing", "Borrowing")}{" "}
					</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Grid
						container
						spacing={{ xs: 2, md: 3 }}
						columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
					>
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
									{t("details.borrowing_patron_id")}
								</Typography>
								<RenderAttribute
									attribute={patronRequest?.requestingIdentity?.id}
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
									{t("details.borrowing_virtual_id")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.localItemId} />
							</Stack>
						</Grid>
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("details.borrowing_virtual_item_status")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.localItemStatus} />
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
									{t("details.borrowing_virtual_bib_id")}
								</Typography>
								<RenderAttribute attribute={patronRequest?.localBibId} />
							</Stack>
						</Grid>
					</Grid>
				</AccordionDetails>
			</Accordion>
			<Accordion
				variant="outlined"
				sx={{ border: "0" }}
				expanded={expandedAccordions[5]}
				onChange={handleAccordionChange(5)}
			>
				<AccordionSummary
					sx={{
						backgroundColor: theme.palette.primary.detailsAccordionSummary,
					}}
					aria-controls="request-audit_log"
					id="request_audit_log"
					expandIcon={
						<IconContext.Provider value={{ size: "2em" }}>
							{" "}
							<MdExpandMore />
						</IconContext.Provider>
					}
				>
					<Typography variant="h2" sx={{ fontWeight: "bold" }}>
						{" "}
						{t("details.audit_log")}{" "}
					</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<ClientDataGrid
						data={patronRequest?.audit}
						columns={[
							{
								field: "auditDate",
								headerName: "Audit date",
								minWidth: 60,
								flex: 0.2,
								valueGetter: (params: { row: { auditDate: string } }) => {
									const auditDate = params.row.auditDate;
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
						selectable={false}
						noDataTitle={t("details.audit_log_no_data")}
						noDataMessage={t("details.audit_log_no_rows")}
						sortModel={[{ field: "auditDate", sort: "desc" }]}
					/>
					<pre>{JSON.stringify(patronRequest?.audit?.auditData, null, 2)}</pre>
				</AccordionDetails>
			</Accordion>
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
