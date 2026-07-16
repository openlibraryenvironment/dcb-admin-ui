import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AccordionSummary, Grid, Stack, Typography } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

import PageContainer from "@layout/PageContainer/PageContainer";
import Link from "@components/Link/Link";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import {
	StyledAccordion,
	StyledAccordionDetails,
	StyledAccordionButton,
} from "@components/StyledAccordion/StyledAccordion";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { getBibMainDetails } from "@queries/getBibMainDetails";
import { getBibSourceRecord } from "@queries/getBibSourceRecord";
import { getAgency } from "@queries/getAgency";
import { getLibraryBasics } from "@queries/getLibraryBasics";

import { Bib } from "@models/Bib";
import { Agency } from "@models/Agency";
import { Library } from "@models/Library";
import type {
	LoadAgencyQueryVariables,
	LoadBibMainDetailsQueryVariables,
	LoadBibSourceRecordQueryVariables,
	LoadLibraryBasicsQueryVariables,
} from "@generated/graphql";

export const Route = createFileRoute("/__authenticated/bibs/$bibId")({
	component: SourceBibDetails,
});

function SourceBibDetails() {
	const { t } = useTranslation();
	const { bibId } = Route.useParams();
	const gqlClient = useGraphQLClient();
	// Runtime config (not build-time import.meta.env, which is undefined in the
	// runtime-configured production image - see search/index.tsx).
	const { cfg } = useRouter().options.context as { cfg: any };

	const [isCanonicalExpanded, setIsCanonicalExpanded] = useState(true);
	const [isSourceRecordExpanded, setIsSourceRecordExpanded] = useState(false);

	const {
		data: bibData,
		isLoading: bibLoading,
		error: bibError,
	} = useQuery({
		queryKey: ["bib", bibId],
		queryFn: () =>
			gqlClient.request<any, LoadBibMainDetailsQueryVariables>(
				getBibMainDetails,
				{ query: `id:${bibId}` },
			),
		enabled: !!bibId,
	});

	const bib: Bib = bibData?.sourceBibs?.content?.[0];
	const sourceSystemId = bib?.sourceSystemId;
	const sourceSystemUrl = sourceSystemId ? `/hostlmss/${sourceSystemId}` : "";

	const { data: agencyData } = useQuery({
		queryKey: ["agency", "byHostLms", sourceSystemId],
		queryFn: () =>
			gqlClient.request<any, LoadAgencyQueryVariables>(getAgency, {
				query: `hostLms: ${sourceSystemId}`,
			}),
		enabled: !!sourceSystemId,
	});

	const bibAgency: Agency = agencyData?.agencies?.content?.[0];
	const agencyCode = bibAgency?.code;

	const { data: libraryData } = useQuery({
		queryKey: ["library", "byAgencyCode", agencyCode],
		queryFn: () =>
			gqlClient.request<any, LoadLibraryBasicsQueryVariables>(
				getLibraryBasics,
				{
					query: `agencyCode:${agencyCode}`,
				},
			),
		enabled: !!agencyCode,
	});

	const bibLibrary: Library = libraryData?.libraries?.content?.[0];

	const { data: sourceRecordData, isLoading: sourceRecordLoading } = useQuery({
		queryKey: ["bibSourceRecord", bibId],
		queryFn: () =>
			gqlClient.request<any, LoadBibSourceRecordQueryVariables>(
				getBibSourceRecord,
				{ query: `id:${bibId}` },
			),
		enabled: isSourceRecordExpanded && !!bibId,
	});

	const toggleExpandAll = () => {
		const targetState = !isCanonicalExpanded;
		setIsCanonicalExpanded(targetState);
		setIsSourceRecordExpanded(targetState);
	};

	if (bibLoading) {
		return (
			<PageContainer hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("bibRecords.bibs_one").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</PageContainer>
		);
	}

	if (bibError || !bib) {
		return (
			<PageContainer hideBreadcrumbs>
				<Error
					title={
						bibError
							? t("ui.error.cannot_retrieve_record")
							: t("ui.error.cannot_find_record")
					}
					message={
						bibError
							? t("ui.info.connection_issue")
							: t("ui.error.invalid_UUID")
					}
					description={
						bibError ? t("ui.info.try_later") : t("ui.info.check_address")
					}
					action={t("ui.actions.go_back")}
					goBack="/bibs"
				/>
			</PageContainer>
		);
	}

	return (
		<PageContainer title={bib?.title}>
			<Stack
				direction="row"
				sx={{
					justifyContent: "end",
				}}
			>
				<StyledAccordionButton onClick={toggleExpandAll}>
					{isCanonicalExpanded
						? t("ui.data_grid.collapse")
						: t("ui.data_grid.expand")}
				</StyledAccordionButton>
			</Stack>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				sx={{ mb: "5px" }}
			>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("bibRecords.source_bib_uuid")}
						</Typography>
						<RenderAttribute attribute={bib?.id} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("search.title")}
						</Typography>
						<RenderAttribute attribute={bib?.title} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("search.author")}
						</Typography>
						<RenderAttribute attribute={bib?.author} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("bibRecords.source_library")}
						</Typography>
						{bibLibrary?.fullName ? (
							<Link
								href={`/libraries/${bibLibrary.id}`}
								title={bibLibrary.fullName}
								underline="hover"
							>
								<RenderAttribute attribute={bibLibrary.fullName} />
							</Link>
						) : (
							<RenderAttribute attribute={bibLibrary?.fullName} />
						)}
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("bibRecords.source_system_uuid")}
						</Typography>
						{sourceSystemUrl === "" ? (
							<RenderAttribute attribute={bib?.sourceSystemId} />
						) : (
							<Link
								href={sourceSystemUrl}
								title={t("ui.link.host_lms_tip")}
								underline="hover"
							>
								<RenderAttribute attribute={bib?.sourceSystemId} />
							</Link>
						)}
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("bibRecords.source_record_id")}
						</Typography>
						<RenderAttribute attribute={bib?.sourceRecordId} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("bibRecords.contributor_uuid")}
						</Typography>
						{cfg?.VITE_DCB_SEARCH_BASE ? (
							<Typography variant="attributeText" component="div">
								<Link
									href={`/search/${bib?.contributesTo?.id}/cluster`}
									underline="hover"
									onClick={(e: any) => e.stopPropagation()}
								>
									<RenderAttribute attribute={bib?.contributesTo?.id} />
								</Link>
							</Typography>
						) : (
							<RenderAttribute attribute={bib?.contributesTo?.id} />
						)}
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("requesting.contributors")}
						</Typography>
						<RenderAttribute attribute={bib?.contributesTo?.title} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("bibRecords.process_version")}
						</Typography>
						<RenderAttribute attribute={bib?.processVersion} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("bibRecords.metadata_score")}
						</Typography>
						<RenderAttribute attribute={bib?.metadataScore} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("requesting.publisher")}
						</Typography>
						<RenderAttribute attribute={bib?.publisher} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("requesting.publication_place")}
						</Typography>
						<RenderAttribute attribute={bib?.placeOfPublication} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("requesting.publication_date")}
						</Typography>
						<RenderAttribute attribute={bib?.dateOfPublication} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("bibRecords.edition")}
						</Typography>
						<RenderAttribute attribute={bib?.edition} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("bibRecords.large_print")}
						</Typography>
						<RenderAttribute attribute={bib?.isLargePrint} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("bibRecords.record_type")}
						</Typography>
						<RenderAttribute attribute={bib?.typeOfRecord} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("ui.info.date_created")}
						</Typography>
						<RenderAttribute attribute={bib?.dateCreated} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction="column">
						<Typography variant="attributeTitle">
							{t("ui.info.date_updated")}
						</Typography>
						<RenderAttribute attribute={bib?.dateUpdated} />
					</Stack>
				</Grid>
			</Grid>
			<StyledAccordion
				variant="outlined"
				expanded={isCanonicalExpanded}
				onChange={() => setIsCanonicalExpanded(!isCanonicalExpanded)}
				disableGutters
			>
				<AccordionSummary
					aria-controls="source-bibs-json-details"
					id="source-bibs-json-details"
					expandIcon={<ExpandMore fontSize="large" />}
				>
					<Typography variant="h3" sx={{ fontWeight: "bold" }}>
						{t("patron_request.canonical_metadata")}
					</Typography>
				</AccordionSummary>
				<StyledAccordionDetails>
					<pre>{JSON.stringify(bib?.canonicalMetadata, null, 2)}</pre>
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion
				variant="outlined"
				expanded={isSourceRecordExpanded}
				onChange={() => setIsSourceRecordExpanded(!isSourceRecordExpanded)}
				disableGutters
			>
				<AccordionSummary
					aria-controls="source-bibs-source-record-json-details"
					id="source-bibs-source-record-json-details"
					expandIcon={<ExpandMore fontSize="large" />}
				>
					<Typography variant="h3" sx={{ fontWeight: "bold" }}>
						{t("bibRecords.source_record")}
					</Typography>
				</AccordionSummary>
				<StyledAccordionDetails>
					{sourceRecordLoading ? (
						<Loading
							title={t("ui.info.loading.document", {
								document_type: t("bibRecords.source_record").toLowerCase(),
							})}
							subtitle={t("ui.info.wait")}
						/>
					) : (
						<pre>
							{JSON.stringify(
								sourceRecordData?.sourceBibs?.content?.[0]?.sourceRecord,
								null,
								2,
							)}
						</pre>
					)}
				</StyledAccordionDetails>
			</StyledAccordion>
		</PageContainer>
	);
}
