import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from "@mui/material";

import type { BibAuditEntry } from "@/queryOptions/bibAuditLog";

export default function BibAuditTable({
	entries,
	labelledBy,
}: {
	entries: BibAuditEntry[];
	labelledBy: string;
}) {
	const { t } = useTranslation();

	return (
		<TableContainer>
			<Table size="small" aria-labelledby={labelledBy}>
				<TableHead>
					<TableRow>
						<TableCell component="th" scope="col">
							{t("bibRecords.audit_log.time")}
						</TableCell>
						<TableCell component="th" scope="col">
							{t("bibRecords.audit_log.process")}
						</TableCell>
						<TableCell component="th" scope="col">
							{t("bibRecords.audit_log.message")}
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{entries.map((entry) => (
						<TableRow key={entry.id}>
							<TableCell>
								{dayjs(entry.timestamp).format("YYYY-MM-DD HH:mm:ss")}
							</TableCell>
							<TableCell>{entry.processType}</TableCell>
							<TableCell>{entry.message}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
