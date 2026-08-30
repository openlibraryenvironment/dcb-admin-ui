import { useTranslation } from "react-i18next";
import { Box, Stack, Typography } from "@mui/material";

import CollectionTotalsTiles from "./CollectionTotalsTiles";
import ClusterQualityPanel from "./ClusterQualityPanel";
import CollectionProfilePanel from "./CollectionProfilePanel";
import FormatMixPanel from "./FormatMixPanel";
import CollectionOverlapPanel from "./CollectionOverlapPanel";
import LazyPanel from "./LazyPanel";

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

				<LazyPanel minHeight={160}>
					<CollectionTotalsTiles />
				</LazyPanel>

				<LazyPanel minHeight={360}>
					<Box
						sx={{
							display: "grid",
							gap: 3,
							gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
						}}
					>
						{/* Confidence first: it qualifies every number in this section. */}
						<ClusterQualityPanel />
						<CollectionProfilePanel libraryCode={libraryCode} />
					</Box>
				</LazyPanel>

				<LazyPanel minHeight={340}>
					<Box
						sx={{
							display: "grid",
							gap: 3,
							gridTemplateColumns: {
								xs: "1fr",
								lg: singleLibrary ? "repeat(2, 1fr)" : "1fr",
							},
						}}
					>
						<FormatMixPanel libraryCode={libraryCode} />
						{singleLibrary && (
							<CollectionOverlapPanel libraryCode={singleLibrary} />
						)}
					</Box>
				</LazyPanel>
			</Stack>
		</Box>
	);
}
