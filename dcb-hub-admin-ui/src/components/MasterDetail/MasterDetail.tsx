import {
	Link,
	List,
	ListItem,
	ListItemText,
	Stack,
	Typography,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { useGridApiContext } from "@mui/x-data-grid-pro";
import { useTranslation } from "next-i18next";
import { useCallback, useEffect, useState } from "react";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";
import MasterDetailLayout from "./MasterDetailLayout";
import dayjs from "dayjs";
import { formatDuration } from "src/helpers/formatDuration";
import ChangesSummary from "@components/ChangesSummary/ChangesSummary";
import {
	StyledAccordion,
	StyledAccordionDetails,
	StyledAccordionSummary,
} from "@components/StyledAccordion/StyledAccordion";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";
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
					<Grid xs={2} sm={4} md={4}>
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
		case "bibs":
			return (
				<MasterDetailLayout width={width}>
					<Grid xs={2} sm={4} md={4}>
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
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.bib_record_id")}
							</Typography>
							<Link href={`/bibs/${row?.id}`}>
								<RenderAttribute attribute={row?.id} />
							</Link>
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.author")}
							</Typography>
							<Typography variant="attributeText">
								<RenderAttribute attribute={row?.author} />
							</Typography>
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.identifiers")}
							</Typography>
							<Typography variant="attributeText">
								<List dense>
									{row.canonicalMetadata.identifiers.map(
										(id: { namespace: string; value: string }) => (
											<ListItem key={`${id.namespace}-${id.value}`}>
												<ListItemText
													primary={`${id.namespace}: ${id.value}`}
												/>
											</ListItem>
										),
									)}
								</List>
							</Typography>
						</Stack>
					</Grid>
					<Grid xs={4} sm={8} md={12}>
						<StyledAccordion
							variant="outlined"
							defaultExpanded={false}
							disableGutters
						>
							<StyledAccordionSummary
								aria-controls="source-bibs-source-record-json-details"
								id="source-bibs-source-record-json-details"
								expandIcon={
									<IconContext.Provider value={{ size: "2em" }}>
										<MdExpandMore />
									</IconContext.Provider>
								}
							>
								<Typography variant="accordionSummary">
									{t("details.source_record")}
								</Typography>
							</StyledAccordionSummary>
							<StyledAccordionDetails>
								{JSON.stringify(row?.sourceRecord?.json, null, 2)}
							</StyledAccordionDetails>
						</StyledAccordion>
					</Grid>
					<Grid xs={4} sm={8} md={12}>
						<StyledAccordion
							variant="outlined"
							defaultExpanded={false}
							disableGutters
						>
							<StyledAccordionSummary
								aria-controls="search-canonical-metadata-details"
								id="search-canonical-metadata-details"
								expandIcon={
									<IconContext.Provider value={{ size: "2em" }}>
										<MdExpandMore />
									</IconContext.Provider>
								}
							>
								<Typography variant="accordionSummary">
									{t("details.canonical_metadata")}
								</Typography>
							</StyledAccordionSummary>
							<StyledAccordionDetails>
								{JSON.stringify(row?.canonicalMetadata, null, 2)}
							</StyledAccordionDetails>
						</StyledAccordion>
					</Grid>
				</MasterDetailLayout>
			);
		case "dataChangeLog":
			return (
				<MasterDetailLayout width={width}>
					<ChangesSummary changes={row?.changes} action={row?.actionInfo} />
				</MasterDetailLayout>
			);
		case "groups":
			return (
				<MasterDetailLayout width={width}>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">{t("groups.id")}</Typography>
							<Typography variant="attributeText">
								<RenderAttribute attribute={row?.id} />
							</Typography>
						</Stack>
					</Grid>
					{row?.type?.toLowerCase() === "consortium" ? (
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.consortium.name")}
								</Typography>
								<RenderAttribute attribute={row?.consortium?.name} />
							</Stack>
						</Grid>
					) : null}
					{row?.type?.toLowerCase() === "consortium" ? (
						<Grid xs={2} sm={4} md={4}>
							<Stack direction={"column"}>
								<Typography variant="attributeTitle">
									{t("libraries.consortium.id")}
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
					<Grid xs={2} sm={4} md={4}>
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
						<Grid xs={2} sm={4} md={4}>
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
						<Grid xs={2} sm={4} md={4}>
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
						<Grid xs={2} sm={4} md={4}>
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
						<Grid xs={2} sm={4} md={4}>
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
						<Grid xs={2} sm={4} md={4}>
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
						<Grid xs={2} sm={4} md={4}>
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
					<Grid xs={2} sm={4} md={4}>
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
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.location_uuid")}
							</Typography>
							<RenderAttribute attribute={row?.id} />
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.location_type")}
							</Typography>
							<RenderAttribute attribute={row?.type} />
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
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
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.request_created")}
							</Typography>
							<RenderAttribute
								attribute={dayjs(row?.dateCreated).format("YYYY-MM-DD HH:mm")}
							/>
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.patron_hostlms")}
							</Typography>
							<RenderAttribute attribute={row?.patronHostlmsCode} />
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.borrowing_patron_barcode")}
							</Typography>
							<RenderAttribute
								attribute={row?.requestingIdentity?.localBarcode}
							/>
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.title")}
							</Typography>
							<RenderAttribute attribute={row?.clusterRecord?.title} />
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.supplying_agency_code")}
							</Typography>
							<RenderAttribute attribute={row?.suppliers[0]?.localAgency} />
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.previous_status")}
							</Typography>
							<RenderAttribute attribute={row?.previousStatus} />
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.status")}
							</Typography>
							<RenderAttribute attribute={row?.status} />
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.next_expected_status")}
							</Typography>
							<RenderAttribute
								attribute={row?.nextExpectedStatus?.toString()}
							/>
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.error")}
							</Typography>
							<RenderAttribute attribute={row?.errorMessage} />
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.is_transition_out_of_sequence")}
							</Typography>
							<RenderAttribute attribute={row?.outOfSequenceFlag?.toString()} />
						</Stack>
					</Grid>

					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.polling_checks_in_status")}
							</Typography>
							<RenderAttribute
								attribute={row?.pollCountForCurrentStatus?.toString()}
							/>
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.time_in_status")}
							</Typography>
							<RenderAttribute
								attribute={formatDuration(row?.elapsedTimeInCurrentStatus)}
							/>
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.item_manually_selected")}
							</Typography>
							<RenderAttribute
								attribute={row.isManuallySelectedItem?.toString()}
							/>
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.request_updated")}
							</Typography>
							<RenderAttribute
								attribute={dayjs(row?.dateUpdated).format("YYYY-MM-DD HH:mm")}
							/>
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
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
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.context")}
							</Typography>
							<RenderAttribute attribute={row?.owningContext} />
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.agency_code")}
							</Typography>
							<RenderAttribute attribute={row?.agency?.code} />
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.agency_name")}
							</Typography>
							<RenderAttribute attribute={row?.agency?.description} />
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("details.location_name")}
							</Typography>
							<RenderAttribute attribute={row?.location?.name} />
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.barcode")}
							</Typography>
							<RenderAttribute attribute={row?.barcode} />
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.call_no")}
							</Typography>
							<RenderAttribute attribute={row?.callNumber} />
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.local_item_type_code")}
							</Typography>
							<RenderAttribute attribute={row?.localItemTypeCode} />
						</Stack>
					</Grid>
					<Grid xs={2} sm={4} md={4}>
						<Stack direction={"column"}>
							<Typography variant="attributeTitle">
								{t("search.local_item_type_name")}
							</Typography>
							<RenderAttribute attribute={row?.localItemType} />
						</Stack>
					</Grid>
				</MasterDetailLayout>
			);

		default:
			return null;
	}
}
