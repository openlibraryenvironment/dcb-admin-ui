import { useTranslation } from "react-i18next";
import { Box, Stack, Typography } from "@mui/material";

import CollectionTotalsTiles from "./CollectionTotalsTiles";
import ClusterQualityPanel from "./ClusterQualityPanel";
import CollectionProfilePanel from "./CollectionProfilePanel";
import FormatMixPanel from "./FormatMixPanel";
import CollectionOverlapPanel from "./CollectionOverlapPanel";
import PanelRow from "./PanelRow";
import { isInsightsPanelShown as shown } from "@helpers/featureFlags";

/**
 * Collection analysis - its own section, and deliberately separate from everything above
 * it on this page.
 *
 * Every other panel aggregates patron_request: what the consortium has been ASKED for.
 * These five aggregate bib_record: what it HOLDS. They take no date window, they are
 * consortium-wide except for the overlap, and they cost a pass over a 20M-row table, which
 * is why dcb-service serves them one at a time behind a cache. Mixing them into the demand
 * panels would invite a reader to compare a count of requests with a count of works.
 *
 * The whole section is lazy: nothing here is fetched until an admin scrolls to it.
 */
export default function CollectionAnalysisSection({
	libraryCode,
}: {
	// Scope CSV from the selector. A single code narrows the format mix and unlocks the
	// overlap panel, which needs one library to be the left-hand side of the comparison.
	libraryCode?: string;
}) {
	const { t } = useTranslation();

	const singleLibrary =
		libraryCode && !libraryCode.includes(",") ? libraryCode : undefined;

	return (
		<Box component="section" aria-labelledby="insights-collection-heading">
			<Stack spacing={3}>
				<Box>
					<Typography
						id="insights-collection-heading"
						variant="h5"
						component="h2"
						gutterBottom
					>
						{t("insights.collection.section_title")}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{t("insights.collection.section_subtitle")}
					</Typography>
				</Box>

				<PanelRow minHeight={160}>
					{shown("collection.totals") && <CollectionTotalsTiles />}
				</PanelRow>

				{/* Confidence first: it qualifies every number in this section. */}
				<PanelRow minHeight={360}>
					{shown("collection.clusterQuality") && <ClusterQualityPanel />}
					{shown("collection.profile") && (
						<CollectionProfilePanel libraryCode={libraryCode} />
					)}
				</PanelRow>

				<PanelRow minHeight={340}>
					{shown("collection.formatMix") && (
						<FormatMixPanel libraryCode={libraryCode} />
					)}
					{shown("collection.overlap") && singleLibrary && (
						<CollectionOverlapPanel libraryCode={singleLibrary} />
					)}
				</PanelRow>
			</Stack>
		</Box>
	);
}
