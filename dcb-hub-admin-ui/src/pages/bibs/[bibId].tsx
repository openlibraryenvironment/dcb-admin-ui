import { useQuery } from "@apollo/client";
import { AdminLayout } from "@layout";
import { Bib } from "@models/Bib";
import { Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useState } from "react";
import { IconContext } from "react-icons";
import { MdExpandMore } from "react-icons/md";
import { getBibById } from "src/queries/queries";
import RenderAttribute from "src/helpers/RenderAttribute/RenderAttribute";
import Loading from "@components/Loading/Loading";
import Error from "@components/Error/Error";
import {
	StyledAccordion,
	StyledAccordionSummary,
	StyledAccordionDetails,
	StyledAccordionButton,
} from "@components/StyledAccordion/StyledAccordion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

type BibDetails = {
	bibId: Bib;
};

export default function SourceBibDetails({ bibId }: BibDetails) {
	const { t } = useTranslation();
	const { loading, data, error } = useQuery(getBibById, {
		variables: {
			query: "id:" + bibId,
		},
		pollInterval: 120000,
	});

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
			<AdminLayout>
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
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.source_bib_uuid")}
						</Typography>
						<RenderAttribute attribute={bib?.id} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.title")}
						</Typography>
						<RenderAttribute attribute={bib?.title} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.author")}
						</Typography>
						<RenderAttribute attribute={bib?.author} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.source_system_uuid")}
						</Typography>
						<RenderAttribute attribute={bib?.sourceSystemId} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.source_record_id")}
						</Typography>
						<RenderAttribute attribute={bib?.sourceRecordId} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.contributor_uuid")}
						</Typography>
						<RenderAttribute attribute={bib?.contributesTo?.id} />
					</Stack>
				</Grid>
				<Grid xs={2} sm={4} md={4}>
					<Stack direction={"column"}>
						<Typography variant="attributeTitle">
							{t("details.contributor_title")}
						</Typography>
						<RenderAttribute attribute={bib?.contributesTo?.title} />
					</Stack>
				</Grid>
			</Grid>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[0]}
				onChange={handleAccordionChange(0)}
				disableGutters
			>
				<StyledAccordionSummary
					aria-controls="source-bibs-json-details"
					id="source-bibs-json-details"
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
					<pre>{JSON.stringify(bib?.canonicalMetadata, null, 2)}</pre>
				</StyledAccordionDetails>
			</StyledAccordion>
			<StyledAccordion
				variant="outlined"
				expanded={expandedAccordions[8]}
				onChange={handleAccordionChange(8)}
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
					<pre>{JSON.stringify(bib?.sourceRecord, null, 2)}</pre>
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
