import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
	AccordionSummary,
	Alert,
	CircularProgress,
	Typography,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

import {
	StyledAccordion,
	StyledAccordionDetails,
} from "@components/StyledAccordion/StyledAccordion";
import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { bibAuditLogQuery } from "@/queryOptions/bibAuditLog";
import BibAuditTable from "./BibAuditTable";

/** What the last ingest of this bib recorded, fetched when the section is opened. */
export default function BibAuditLog({ bibId }: { bibId: string }) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const [expanded, setExpanded] = useState(false);
	const { data, isLoading, isError } = useQuery(
		bibAuditLogQuery(client, bibId, expanded),
	);

	return (
		<StyledAccordion
			variant="outlined"
			expanded={expanded}
			onChange={() => setExpanded(!expanded)}
			disableGutters
		>
			<AccordionSummary
				aria-controls="bib-audit-log-details"
				id="bib-audit-log-summary"
				expandIcon={<ExpandMore fontSize="large" />}
			>
				<Typography variant="h3" sx={{ fontWeight: "bold" }}>
					{t("bibRecords.audit_log.title")}
				</Typography>
			</AccordionSummary>
			<StyledAccordionDetails id="bib-audit-log-details">
				{isLoading ? (
					<CircularProgress aria-label={t("common.loading")} />
				) : isError ? (
					<Alert severity="error">{t("bibRecords.audit_log.error")}</Alert>
				) : !data?.length ? (
					<Typography>{t("bibRecords.audit_log.none")}</Typography>
				) : (
					<BibAuditTable entries={data} labelledBy="bib-audit-log-summary" />
				)}
			</StyledAccordionDetails>
		</StyledAccordion>
	);
}
