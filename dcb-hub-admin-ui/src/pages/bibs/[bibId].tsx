import { useLazyQuery, useQuery } from "@apollo/client";
import { AdminLayout } from "@layout";
import { Bib } from "@models/Bib";
import { AccordionSummary, Grid, Link, Stack, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useState } from "react";
import { ExpandMore } from "@mui/icons-material";
import { getBibMainDetails, getBibSourceRecord } from "src/queries/queries";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import {
	StyledAccordion,
	StyledAccordionDetails,
	StyledAccordionButton,
} from "@components/StyledAccordion/StyledAccordion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import getConfig from "next/config";

type BibDetails = {
	bibId: Bib;
};

export default function SourceBibDetails({ bibId }: BibDetails) {
	const { t } = useTranslation();
	const { loading, data, error } = useQuery(getBibMainDetails, {
		variables: {
			query: "id:" + bibId,
		},
		errorPolicy: "all",
		// pollInterval: 600000, // Polling disabled on bib record page to reduce server load.
	});
	const { publicRuntimeConfig } = getConfig();

	const [
		fetchSourceRecord,
		{ loading: sourceRecordLoading, data: sourceRecordData },
	] = useLazyQuery(getBibSourceRecord);

	const router = useRouter();
	const { status } = useSession({
		required: true,
		onUnauthenticated() {
			// Push to logout page if not authenticated.
			router.push("/auth/logout");
		},
	});

	const bib: Bib = data?.sourceBibs?.content?.[0];
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
			if (index === 8 && !prevExpanded[8]) {
				fetchSourceRecord({
					variables: {
						query: "id:" + bibId + " && title:*",
						// This is a workaround to deal with Apollo treating these two queries as having the same cache query key
						// And thus re-fetching one when the other is fired because it thinks that the cache has been changed.
						// By specifying an additional useless parameter as an AND, we get round this.
						// But only as an AND with the UUID- so it will only fetch the bib matching the UUID
					},
				});
			}
			return newExpanded;
		});
	};

	// Works for closing + expanding as it sets values to their opposite
	const expandAll = () => {
		setExpandedAccordions((prevExpanded) =>
			prevExpanded.map(() => !prevExpanded[0]),
		);
	};
	if (loading || status == "loading") {
		return (
			<AdminLayout hideBreadcrumbs>
				<Loading
					title={t("ui.info.loading.document", {
						document_type: t("bibRecords.bibs_one").toLowerCase(),
					})}
					subtitle={t("ui.info.wait")}
				/>
			</AdminLayout>
		);
	}

	return error || bib == null || bib == undefined ? (
		<AdminLayout hideBreadcrumbs>
			{error ? (
				<Error
					title={t("ui.error.cannot_retrieve_record")}
					message={t("ui.info.connection_issue")}
					description={t("ui.info.try_later")}
					action={t("ui.action.go_back")}
					goBack="/bibs"
				/>
			) : (
				<Error
					title={t("ui.error.cannot_find_record")}
					message={t("ui.error.invalid_UUID")}
					description={t("ui.info.check_address")}
					action={t("ui.action.go_back")}
					goBack="/bibs"
				/>
			)}
		</AdminLayout>
	) : (
		<AdminLayout title={bib?.title}>
			<Stack direction="row" justifyContent="end">
				<StyledAccordionButton onClick={expandAll}>
					{expandedAccordions[0] ? t("details.collapse") : t("details.expand")}
				</StyledAccordionButton>
			</Stack>
			<Grid
				container
				spacing={{ xs: 2, md: 3 }}
				columns={{ xs: 3, sm: 6, md: 9, lg: 12 }}
				sx={{ marginBottom: "5px" }}
			>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.source_bib_uuid")}
						</Typography>
						<RenderAttribute attribute={bib?.id} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.title")}
						</Typography>
						<RenderAttribute attribute={bib?.title} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.author")}
						</Typography>
						<RenderAttribute attribute={bib?.author} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.source_system_uuid")}
						</Typography>
						<RenderAttribute attribute={bib?.sourceSystemId} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.source_record_id")}
						</Typography>
						<RenderAttribute attribute={bib?.sourceRecordId} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.contributor_uuid")}
						</Typography>
						{publicRuntimeConfig.DCB_SEARCH_BASE ? (
							<Typography variant="attributeText" component="div">
								<Link
									href={`/search/${bib?.contributesTo?.id}/cluster`}
									underline="hover"
									onClick={(e) => {
										e.stopPropagation();
									}}
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
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.contributor_title")}
						</Typography>
						<RenderAttribute attribute={bib?.contributesTo?.title} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.process_version")}
						</Typography>
						<RenderAttribute attribute={bib?.processVersion} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.metadata_score")}
						</Typography>
						<RenderAttribute attribute={bib?.metadataScore} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.publisher")}
						</Typography>
						<RenderAttribute attribute={bib?.publisher} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.publication_place")}
						</Typography>
						<RenderAttribute attribute={bib?.placeOfPublication} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.publication_date")}
						</Typography>
						<RenderAttribute attribute={bib?.dateOfPublication} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.edition")}
						</Typography>
						<RenderAttribute attribute={bib?.edition} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.large_print")}
						</Typography>
						<RenderAttribute attribute={bib?.isLargePrint} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.cluster_reason")}
						</Typography>
						<RenderAttribute attribute={bib?.clusterReason} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.record_type")}
						</Typography>
						<RenderAttribute attribute={bib?.typeOfRecord} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.date_created")}
						</Typography>
						<RenderAttribute attribute={bib?.dateCreated} />
					</Stack>
				</Grid>
				<Grid size={{ xs: 2, sm: 4, md: 4 }}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.date_updated")}
						</Typography>
						<RenderAttribute attribute={bib?.dateUpdated} />
					</Stack>
				</Grid>
			</Grid>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[0]}
				onChange={handleAccordionChange(0)}
				disableGutters
			>
				<AccordionSummary
					aria-controls="source-bibs-json-details"
					id="source-bibs-json-details"
					expandIcon={<ExpandMore fontSize="large" />}
				>
					<Typography variant="h3" sx={{ fontWeight: "bold" }}>
						{t("details.canonical_metadata")}
					</Typography>
				</AccordionSummary>
				<StyledAccordionDetails>
					<pre>{JSON.stringify(bib?.canonicalMetadata, null, 2)}</pre>
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[8]}
				onChange={handleAccordionChange(8)}
				disableGutters
			>
				<AccordionSummary
					aria-controls="source-bibs-source-record-json-details"
					id="source-bibs-source-record-json-details"
					expandIcon={<ExpandMore fontSize="large" />}
				>
					<Typography variant="h3" sx={{ fontWeight: "bold" }}>
						{t("details.source_record")}
					</Typography>
				</AccordionSummary>
				<StyledAccordionDetails>
					{sourceRecordLoading ? (
						<Loading
							title={t("ui.info.loading.document", {
								document_type: t("details.source_record").toLowerCase(),
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
	const bibId = ctx.params.bibId;
	return {
		props: {
			bibId,
			...translations,
		},
	};
}
