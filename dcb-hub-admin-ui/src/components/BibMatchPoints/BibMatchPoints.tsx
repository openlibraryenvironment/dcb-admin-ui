import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	AccordionSummary,
	Alert,
	CircularProgress,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

import {
	StyledAccordion,
	StyledAccordionDetails,
} from "@components/StyledAccordion/StyledAccordion";
import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { bibMatchPointsQuery } from "@/queryOptions/bibMatchPoints";

const SUMMARY_ID = "bib-match-points-summary";

/** What this bib can cluster on: two bibs sharing a value here are a match. Fetched on open. */
export default function BibMatchPoints({ bibId }: { bibId: string }) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const [expanded, setExpanded] = useState(false);
	const { data, isLoading, isError } = useQuery(
		bibMatchPointsQuery(client, bibId, expanded),
	);

	return (
		<StyledAccordion
			variant="outlined"
			expanded={expanded}
			onChange={() => setExpanded(!expanded)}
			disableGutters
		>
			<AccordionSummary
				aria-controls="bib-match-points-details"
				id={SUMMARY_ID}
				expandIcon={<ExpandMore fontSize="large" />}
			>
				<Typography variant="h3" sx={{ fontWeight: "bold" }}>
					{t("bibRecords.match_points.title")}
				</Typography>
			</AccordionSummary>
			<StyledAccordionDetails id="bib-match-points-details">
				{isLoading ? (
					<CircularProgress aria-label={t("common.loading")} />
				) : isError ? (
					<Alert severity="error">{t("bibRecords.match_points.error")}</Alert>
				) : !data?.length ? (
					<Typography>{t("bibRecords.match_points.none")}</Typography>
				) : (
					<>
						<Typography sx={{ mb: 2 }}>
							{t("bibRecords.match_points.explanation")}
						</Typography>
						<TableContainer>
							<Table size="small" aria-labelledby={SUMMARY_ID}>
								<TableHead>
									<TableRow>
										<TableCell component="th" scope="col">
											{t("bibRecords.match_points.domain")}
										</TableCell>
										<TableCell component="th" scope="col">
											{t("bibRecords.match_points.source_value")}
										</TableCell>
										<TableCell component="th" scope="col">
											{t("bibRecords.match_points.value")}
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{data.map((point) => (
										<TableRow key={`${point.domain}-${point.value}`}>
											<TableCell>{point.domain ?? ""}</TableCell>
											<TableCell>{point.sourceValueHint ?? ""}</TableCell>
											<TableCell>{point.value}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					</>
				)}
			</StyledAccordionDetails>
		</StyledAccordion>
	);
}
