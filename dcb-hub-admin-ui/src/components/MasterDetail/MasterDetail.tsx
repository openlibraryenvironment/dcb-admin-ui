import {
	AccordionDetails,
	Grid,
	Link,
	List,
	ListItem,
	ListItemText,
	Stack,
	Typography,
} from "@mui/material";
import { useGridApiContext } from "@mui/x-data-grid-premium";
import { useTranslation } from "next-i18next";
import { useCallback, useEffect, useState } from "react";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import MasterDetailLayout from "./MasterDetailLayout";
import dayjs from "dayjs";
import { formatDuration } from "src/helpers/formatDuration";
import ChangesSummary from "@components/ChangesSummary/ChangesSummary";
import {
	StyledAccordionDetails,
	StyledDataGridAccordion,
	StyledDataGridAccordionSummary,
} from "@components/StyledAccordion/StyledAccordion";
import { ExpandMore } from "@mui/icons-material";
import { LocationCell } from "@components/LocationCell/LocationCell";
import ReactMarkdown from "react-markdown";

type MasterDetailType = {
	row: any;
	type: string;
};

export default function MasterDetail({ row, type }: MasterDetailType) {
	const apiRef = useGridApiContext();
	const [width, setWidth] = useState(() => {
		const dimensions = apiRef.current.getRootDimensions();
		return dimensions?.viewportInnerSize.width;
	});

	const handleViewportInnerSizeChange = useCallback(() => {
		const dimensions = apiRef.current.getRootDimensions();
		setWidth(dimensions?.viewportInnerSize.width);
	}, [apiRef]);

	useEffect(() => {
		return apiRef.current.subscribeEvent(
			"viewportInnerSizeChange",
			handleViewportInnerSizeChange,
		);
	}, [apiRef, handleViewportInnerSizeChange]);

	const { t } = useTranslation();

	switch (type) {
		case "agencies":
			return (
				<MasterDetailLayout width={width}>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.agency_uuid")}
							</Typography>
							<Typography variant="attributeText">
								<RenderAttribute attribute={row?.id} />
							</Typography>
						</Stack>
					</Grid>
				</MasterDetailLayout>
			);
		case "alarms":
			return (
				<MasterDetailLayout width={width}>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("alarms.code")}
							</Typography>
							<Typography variant="attributeText">
								<RenderAttribute attribute={row?.code} />
							</Typography>
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("alarms.expires")}
							</Typography>
							<Typography variant="attributeText">
								<RenderAttribute attribute={row?.expires} />
							</Typography>
						</Stack>
					</Grid>

					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("alarms.details")}
							</Typography>
							<pre>{JSON.stringify(row?.alarmDetails, null, 2)}</pre>
						</Stack>
					</Grid>
				</MasterDetailLayout>
			);
		case "bibs":
			return (
				<MasterDetailLayout width={width}>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.source_bib_uuid")}
							</Typography>
							<Typography variant="attributeText">
								<RenderAttribute attribute={row?.id} />
							</Typography>
						</Stack>
					</Grid>
				</MasterDetailLayout>
			);
		case "cluster":
			return (
				<MasterDetailLayout width={width}>
					<Grid container spacing={2} role="row">
						<Grid size={{ xs: 2, sm: 4, md: 4 }} role="gridcell">
							<Stack direction="column">
								<Typography variant="attributeTitle">
									{t("search.bib_record_id")}
								</Typography>
								<Typography variant="attributeText" component="div">
									<Link
										href={`/bibs/${row?.id}`}
										underline="hover"
										onClick={(e) => {
											e.stopPropagation();
										}}
									>
										<RenderAttribute attribute={row?.id} />
									</Link>
								</Typography>
							</Stack>
						</Grid>
						<Grid size={{ xs: 2, sm: 4, md: 4 }} role="gridcell">
							<Stack direction="column">
								<Typography variant="attributeTitle">
									{t("details.author")}
								</Typography>
								<Typography variant="attributeText">
									<RenderAttribute attribute={row?.author} />
								</Typography>
							</Stack>
						</Grid>
						<Grid size={{ xs: 4, sm: 8, md: 12 }} role="gridcell">
							<Stack direction="column">
								<Typography variant="attributeTitle">
									{t("search.identifiers")}
								</Typography>
								<List sx={{ pl: 0, ml: 0 }} dense disablePadding>
									{row.canonicalMetadata.identifiers.map(
										(id: { namespace: string; value: string }) => (
											<ListItem
												sx={{ pl: 0 }}
												key={`${id.namespace}-${id.value}`}
												disablePadding
											>
												<ListItemText
													primary={`${id.namespace}: ${id.value}`}
												/>
											</ListItem>
										),
									)}
								</List>
							</Stack>
						</Grid>
						<Grid size={{ xs: 4, sm: 8, md: 12 }} role="gridcell">
							<StyledDataGridAccordion elevation={0}>
								<StyledDataGridAccordionSummary
									expandIcon={<ExpandMore />}
									aria-controls="source-bibs-source-record-json-content"
									id="source-bibs-source-record-json-header"
								>
									<Typography>{t("details.source_record")}</Typography>
								</StyledDataGridAccordionSummary>
								<AccordionDetails id="source-bibs-source-record-json-content">
									<pre>{JSON.stringify(row?.sourceRecord, null, 2)}</pre>
								</AccordionDetails>
							</StyledDataGridAccordion>
						</Grid>
						<Grid size={{ xs: 4, sm: 8, md: 12 }} role="gridcell">
							<StyledDataGridAccordion elevation={0}>
								<StyledDataGridAccordionSummary
									expandIcon={<ExpandMore />}
									aria-controls="search-canonical-metadata-content"
									id="search-canonical-metadata-header"
								>
									<Typography>{t("details.canonical_metadata")}</Typography>
								</StyledDataGridAccordionSummary>
								<AccordionDetails id="search-canonical-metadata-content">
									<pre>{JSON.stringify(row?.canonicalMetadata, null, 2)}</pre>
								</AccordionDetails>
							</StyledDataGridAccordion>
						</Grid>
					</Grid>
				</MasterDetailLayout>
			);
		case "dataChangeLog":
			return (
				<MasterDetailLayout width={width}>
					<ChangesSummary
						changes={row?.changes}
						action={row?.actionInfo}
						context="dataChangeLog"
					/>
				</MasterDetailLayout>
			);
		case "groups":
			return (
				<MasterDetailLayout width={width}>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">{t("groups.id")}</Typography>
							<Typography variant="attributeText">
								<RenderAttribute attribute={row?.id} />
							</Typography>
						</Stack>
					</Grid>
					{row?.type?.toLowerCase() === "consortium" ? (
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("consortium.name")}
								</Typography>
								<RenderAttribute attribute={row?.consortium?.name} />
							</Stack>
						</Grid>
					) : null}
					{row?.type?.toLowerCase() === "consortium" ? (
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("consortium.id")}
								</Typography>
								<RenderAttribute attribute={row?.consortium?.id} />
							</Stack>
						</Grid>
					) : null}
				</MasterDetailLayout>
			);
		case "hostlmss":
			return (
				<MasterDetailLayout width={width}>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("hostlms.id")}
							</Typography>
							<Typography variant="attributeText">
								<RenderAttribute attribute={row?.id} />
							</Typography>
						</Stack>
					</Grid>
					{row?.clientConfig?.["base-url-application-services"] != null && (
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("hostlms.client_config.base_application")}
								</Typography>
								<Typography variant="attributeText">
									<RenderAttribute
										attribute={
											row?.clientConfig?.["base-url-application-services"]
										}
									/>
								</Typography>
							</Stack>
						</Grid>
					)}
					{row?.clientConfig?.["base-url"] != null && (
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("hostlms.client_config.base")}
								</Typography>
								<Typography variant="attributeText">
									<RenderAttribute
										attribute={row?.clientConfig?.["base-url"]}
									/>
								</Typography>
							</Stack>
						</Grid>
					)}
					{row?.clientConfig?.roles != null && (
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("hostlms.client_config.roles")}
								</Typography>
								<Typography variant="attributeText">
									<RenderAttribute
										attribute={String(row?.clientConfig?.roles)}
									/>
								</Typography>
							</Stack>
						</Grid>
					)}
					{row?.clientConfig?.["contextHierarchy"] != null && (
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("hostlms.client_config.context_hierarchy")}
								</Typography>
								<Typography variant="attributeText">
									<RenderAttribute
										attribute={String(row?.clientConfig?.["contextHierarchy"])}
									/>
								</Typography>
							</Stack>
						</Grid>
					)}
					{row?.clientConfig?.["default-agency-code"] != null && (
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("hostlms.client_config.default_agency_code")}
								</Typography>
								<Typography variant="attributeText">
									<RenderAttribute
										attribute={row?.clientConfig?.["default-agency-code"]}
									/>
								</Typography>
							</Stack>
						</Grid>
					)}
					{row?.clientConfig?.ingest != null && (
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("hostlms.client_config.ingest")}
								</Typography>
								<Typography variant="attributeText">
									<RenderAttribute
										attribute={String(row?.clientConfig?.ingest)}
									/>
								</Typography>
							</Stack>
						</Grid>
					)}
				</MasterDetailLayout>
			);
		case "libraries":
			return (
				<MasterDetailLayout width={width}>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("libraries.library_id")}
							</Typography>
							<RenderAttribute attribute={row?.id} />
						</Stack>
					</Grid>
				</MasterDetailLayout>
			);
		case "locations":
			return (
				<MasterDetailLayout width={width}>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.location_uuid")}
							</Typography>
							<RenderAttribute attribute={row?.id} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.location_uuid")}
							</Typography>
							<RenderAttribute attribute={row?.id} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.location_type")}
							</Typography>
							<RenderAttribute attribute={row?.type} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.location_agency_name")}
							</Typography>
							<RenderAttribute attribute={row?.agency?.name} />
						</Stack>
					</Grid>
				</MasterDetailLayout>
			);
		case "patronRequests":
			return (
				<MasterDetailLayout width={width}>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.request_created")}
							</Typography>
							<RenderAttribute
								attribute={dayjs(row?.dateCreated).format("YYYY-MM-DD HH:mm")}
							/>
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.patron_hostlms")}
							</Typography>
							<RenderAttribute attribute={row?.patronHostlmsCode} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.borrowing_patron_barcode")}
							</Typography>
							<RenderAttribute
								attribute={row?.requestingIdentity?.localBarcode}
							/>
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.title")}
							</Typography>
							<RenderAttribute attribute={row?.clusterRecord?.title} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.supplying_agency_code")}
							</Typography>
							<RenderAttribute attribute={row?.suppliers[0]?.localAgency} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("patron_requests.pickup_location_name")}
							</Typography>
							<LocationCell locationId={row?.pickupLocationCode} linkable />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.previous_status")}
							</Typography>
							<RenderAttribute attribute={row?.previousStatus} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.status")}
							</Typography>
							<RenderAttribute attribute={row?.status} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.next_expected_status")}
							</Typography>
							<RenderAttribute
								attribute={row?.nextExpectedStatus?.toString()}
							/>
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.error")}
							</Typography>
							<RenderAttribute attribute={row?.errorMessage} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.is_transition_out_of_sequence")}
							</Typography>
							<RenderAttribute attribute={row?.outOfSequenceFlag?.toString()} />
						</Stack>
					</Grid>

					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.polling_checks_in_status")}
							</Typography>
							<RenderAttribute
								attribute={row?.pollCountForCurrentStatus?.toString()}
							/>
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.time_in_status")}
							</Typography>
							<RenderAttribute
								attribute={formatDuration(row?.elapsedTimeInCurrentStatus)}
							/>
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.item_manually_selected")}
							</Typography>
							<RenderAttribute
								attribute={row.isManuallySelectedItem?.toString()}
							/>
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.request_updated")}
							</Typography>
							<RenderAttribute
								attribute={dayjs(row?.dateUpdated).format("YYYY-MM-DD HH:mm")}
							/>
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.request_uuid")}
							</Typography>
							<RenderAttribute attribute={row?.id} />
						</Stack>
					</Grid>
				</MasterDetailLayout>
			);
		case "items":
			return (
				<MasterDetailLayout width={width}>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.context")}
							</Typography>
							<RenderAttribute attribute={row?.owningContext} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.agency_code")}
							</Typography>
							<RenderAttribute attribute={row?.agency?.code} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.agency_name")}
							</Typography>
							<RenderAttribute attribute={row?.agency?.description} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.location_name")}
							</Typography>
							<RenderAttribute attribute={row?.location?.name} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.location_code")}
							</Typography>
							<RenderAttribute attribute={row?.location?.code} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.barcode")}
							</Typography>
							<RenderAttribute attribute={row?.barcode} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.call_no")}
							</Typography>
							<RenderAttribute attribute={row?.callNumber} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.local_item_type_code")}
							</Typography>
							<RenderAttribute attribute={row?.localItemTypeCode} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.local_item_type_name")}
							</Typography>
							<RenderAttribute attribute={row?.localItemType} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.volume_raw")}
							</Typography>
							<RenderAttribute attribute={row?.rawVolumeStatement} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.volume_parsed")}
							</Typography>
							<RenderAttribute attribute={row?.parsedVolumeStatement} />
						</Stack>
					</Grid>
					{row?.statusCorrectAsOf ? (
						<Grid size={{ xs: 2, sm: 4, md: 4 }}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("ui.info.correct_as_of")}
								</Typography>
								<RenderAttribute
									attribute={dayjs(row?.statusCorrectAsOf).format(
										"YYYY-MM-DD HH:mm",
									)}
								/>
							</Stack>
						</Grid>
					) : null}
					{row?.status?.code != "AVAILABLE" ? (
						<Grid size={{ xs: 4, sm: 8, md: 12 }} role="gridcell">
							<StyledDataGridAccordion elevation={0}>
								<StyledDataGridAccordionSummary
									expandIcon={<ExpandMore />}
									aria-controls="search-suppression_decision_log_entries"
									id="search-suppression_decision_log_entries"
								>
									<Typography>
										{t("search.suppression.decision_log")}
									</Typography>
								</StyledDataGridAccordionSummary>
								<AccordionDetails id="item_decision_log">
									{JSON.stringify(row?.decisionLogEntries, null, 2)}
								</AccordionDetails>
							</StyledDataGridAccordion>
						</Grid>
					) : null}
					{row?.status?.code != "AVAILABLE" ? (
						<Grid size={{ xs: 4, sm: 8, md: 12 }} role="gridcell">
							<StyledDataGridAccordion elevation={0}>
								<StyledDataGridAccordionSummary
									expandIcon={<ExpandMore />}
									aria-controls="search-suppression_raw_values"
									id="search-suppression_raw_values"
								>
									<Typography>
										{t("search.suppression.raw_data_values")}
									</Typography>
								</StyledDataGridAccordionSummary>
								<AccordionDetails id="item_raw_values">
									{JSON.stringify(row?.rawDataValues, null, 2)}
								</AccordionDetails>
							</StyledDataGridAccordion>
						</Grid>
					) : null}
				</MasterDetailLayout>
			);
		case "versionInfo":
			return (
				<MasterDetailLayout width={width}>
					{row?.repository === "dcb-service" ? (
						<>
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("environment.latest_version")}
									</Typography>
									<RenderAttribute attribute={row?.latestData?.name} />
								</Stack>
							</Grid>

							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("environment.latest_version_github")}
									</Typography>
									<RenderAttribute
										attribute={
											"https://github.com/openlibraryenvironment/dcb-service/releases/tag/" +
											row?.latestData?.name
										}
										type="url"
									/>
								</Stack>
							</Grid>
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("environment.changelog")}
									</Typography>
									<RenderAttribute
										attribute={
											"https://github.com/openlibraryenvironment/dcb-service/blob/main/changelog.md"
										}
										type="url"
									/>
								</Stack>
							</Grid>
						</>
					) : (
						<>
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("environment.latest_version_released")}
									</Typography>
									<RenderAttribute
										attribute={dayjs(row?.latestData?.published_at).format(
											"YYYY-MM-DD HH:mm",
										)}
									/>
								</Stack>
							</Grid>
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("environment.latest_version_github")}
									</Typography>
									<RenderAttribute
										attribute={
											"https://github.com/openlibraryenvironment/dcb-admin-ui/releases/" +
											row?.latestData?.name
										}
										type="url"
									/>
								</Stack>
							</Grid>
							<Grid size={{ xs: 2, sm: 4, md: 4 }}>
								<Stack direction={"column"}>
									<Typography variant="attributeTitle">
										{t("details.author")}
									</Typography>
									<RenderAttribute attribute={row?.latestData?.author?.login} />
								</Stack>
							</Grid>
							<Grid size={{ xs: 4, sm: 8, md: 12 }} role="gridcell">
								<StyledDataGridAccordion>
									<StyledDataGridAccordionSummary expandIcon={<ExpandMore />}>
										<Typography>{t("openrs.dcb.release_notes")}</Typography>
									</StyledDataGridAccordionSummary>
									<StyledAccordionDetails>
										<ReactMarkdown>
											{row?.latestData?.body || "No release notes available."}
										</ReactMarkdown>
									</StyledAccordionDetails>
								</StyledDataGridAccordion>
							</Grid>
						</>
					)}
				</MasterDetailLayout>
			);
		case "ClusterExplainer":
			return (
				<MasterDetailLayout width={width}>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.formatted_timestamp")}
							</Typography>
							<RenderAttribute attribute={row?.formattedTimestamp} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.cluster_audit_message")}
							</Typography>
							<RenderAttribute attribute={row?.message} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.identifier")}
							</Typography>
							<RenderAttribute attribute={row?.matchCriteria} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("ui.data_grid.value")}
							</Typography>
							<RenderAttribute attribute={row?.matchValue} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.event_type")}
							</Typography>
							<RenderAttribute attribute={row?.eventType} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }} role="gridcell">
						<Stack direction="column">
							<Typography variant="attributeTitle">
								{t("search.bib_record_id")}
							</Typography>
							<Typography variant="attributeText" component="div">
								<Link
									href={`/bibs/${row?.id}`}
									underline="hover"
									onClick={(e) => {
										e.stopPropagation();
									}}
								>
									<RenderAttribute attribute={row?.subjectId} />
								</Link>
							</Typography>
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }} role="gridcell">
						<Stack direction="column">
							<Typography variant="attributeTitle">
								{t("search.bib_matched_against")}
							</Typography>
							<Typography variant="attributeText" component="div">
								<Link
									href={`/bibs/${row?.id}`}
									underline="hover"
									onClick={(e) => {
										e.stopPropagation();
									}}
								>
									<RenderAttribute attribute={row?.id} />
								</Link>
							</Typography>
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.process_type")}
							</Typography>
							<RenderAttribute attribute={row?.processType} />
						</Stack>
					</Grid>
					<Grid size={{ xs: 2, sm: 4, md: 4 }}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.process_id")}
							</Typography>
							<RenderAttribute attribute={row?.processId} />
						</Stack>
					</Grid>
				</MasterDetailLayout>
			);

		default:
			return null;
	}
}
