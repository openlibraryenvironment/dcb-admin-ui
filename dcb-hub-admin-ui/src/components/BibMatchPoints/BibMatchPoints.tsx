import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	AccordionSummary,
	Alert,
	Box,
	Button,
	CircularProgress,
	Stack,
	TextField,
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
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** What this bib can cluster on: two bibs sharing a value here are a match. Fetched on open. */
export default function BibMatchPoints({ bibId }: { bibId: string }) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const [expanded, setExpanded] = useState(false);
	const { data, isLoading, isError } = useQuery(
		bibMatchPointsQuery(client, bibId, expanded),
	);

	// Another bib to compare with: what it shares with this one is why the two cluster or not
	const [otherInput, setOtherInput] = useState("");
	const [otherBibId, setOtherBibId] = useState<string | null>(null);
	const other = useQuery(
		bibMatchPointsQuery(client, otherBibId ?? "", !!otherBibId),
	);
	const otherValues = new Set((other.data ?? []).map((point) => point.value));
	const sharedCount = (data ?? []).filter((point) =>
		otherValues.has(point.value),
	).length;
	const otherIsValid = UUID.test(otherInput.trim());

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
						<Box
							component="form"
							noValidate
							aria-label={t("bibRecords.match_points.compare")}
							onSubmit={(event) => {
								event.preventDefault();
								if (otherIsValid)
									setOtherBibId(otherInput.trim().toLowerCase());
							}}
							sx={{ mb: 2 }}
						>
							<Stack
								direction={{ xs: "column", sm: "row" }}
								spacing={1}
								sx={{ alignItems: { sm: "flex-start" } }}
							>
								<TextField
									id="compare-bib-id"
									size="small"
									label={t("bibRecords.match_points.compare_with")}
									value={otherInput}
									onChange={(event) => setOtherInput(event.target.value)}
									error={otherInput.trim() !== "" && !otherIsValid}
									helperText={
										otherInput.trim() !== "" && !otherIsValid
											? t("bibRecords.match_points.compare_invalid")
											: undefined
									}
									sx={{ minWidth: { sm: 360 } }}
								/>
								<Button
									type="submit"
									variant="contained"
									disabled={!otherIsValid}
								>
									{t("bibRecords.match_points.compare")}
								</Button>
							</Stack>
						</Box>
						<div role="status" aria-live="polite">
							{otherBibId && other.isLoading && (
								<Typography>{t("common.loading")}</Typography>
							)}
							{otherBibId && other.isError && (
								<Alert severity="error">
									{t("bibRecords.match_points.compare_failed")}
								</Alert>
							)}
							{otherBibId && other.data && (
								<Alert
									severity={sharedCount > 0 ? "info" : "warning"}
									sx={{ mb: 2 }}
								>
									{t("bibRecords.match_points.shared_count", {
										count: sharedCount,
										total: data.length,
									})}
								</Alert>
							)}
						</div>
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
										{other.data && (
											<TableCell component="th" scope="col">
												{t("bibRecords.match_points.shared")}
											</TableCell>
										)}
									</TableRow>
								</TableHead>
								<TableBody>
									{data.map((point) => (
										<TableRow key={`${point.domain}-${point.value}`}>
											<TableCell>{point.domain ?? ""}</TableCell>
											<TableCell>{point.sourceValueHint ?? ""}</TableCell>
											<TableCell>{point.value}</TableCell>
											{other.data && (
												<TableCell>
													{otherValues.has(point.value)
														? t("ui.actions.yes")
														: t("ui.actions.no")}
												</TableCell>
											)}
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
