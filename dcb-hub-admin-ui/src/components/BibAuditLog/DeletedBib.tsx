import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Stack, Typography } from "@mui/material";

import PageContainer from "@layout/PageContainer/PageContainer";
import Link from "@components/Link/Link";
import type { BibAuditEntry } from "@/queryOptions/bibAuditLog";
import BibAuditTable from "./BibAuditTable";

/**
 * A bib id dcb-service no longer holds, but has audit entries for. A bib is hard-deleted
 * while its audit entries are kept, so the entries prove it existed; dcb-service does not
 * audit the deletion, so when and why it went cannot be shown.
 */
export default function DeletedBib({ entries }: { entries: BibAuditEntry[] }) {
	const { t } = useTranslation();
	const lastRecorded = dayjs(entries[entries.length - 1].timestamp).format(
		"YYYY-MM-DD HH:mm:ss",
	);

	return (
		<PageContainer title={t("bibRecords.deleted.title")}>
			<Stack spacing={2}>
				<Typography>
					{t("bibRecords.deleted.explanation", { date: lastRecorded })}
				</Typography>
				<Typography variant="h2" id="deleted-bib-audit-log">
					{t("bibRecords.deleted.audit_log")}
				</Typography>
				<BibAuditTable entries={entries} labelledBy="deleted-bib-audit-log" />
				<Link to="/bibs">{t("bibRecords.deleted.back")}</Link>
			</Stack>
		</PageContainer>
	);
}
