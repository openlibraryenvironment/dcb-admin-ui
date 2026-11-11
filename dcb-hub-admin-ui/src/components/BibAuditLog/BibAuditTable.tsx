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
import ClusteringEventChip from "@components/ClusteringEventChip/ClusteringEventChip";
import Link from "@components/Link/Link";
import { classifyClusteringMessage } from "@helpers/parseClusteringAuditLog";

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
							{t("search.event_type")}
						</TableCell>
						<TableCell component="th" scope="col">
							{t("bibRecords.audit_log.message")}
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{entries.map((entry) => {
						// The same messages the cluster's explanation reads
						const event = classifyClusteringMessage(entry.message);
						return (
							<TableRow key={entry.id}>
								<TableCell>
									{dayjs(entry.timestamp).format("YYYY-MM-DD HH:mm:ss")}
								</TableCell>
								<TableCell>{entry.processType}</TableCell>
								<TableCell>
									{event.kind !== "other" && (
										<ClusteringEventChip kind={event.kind} />
									)}
								</TableCell>
								<TableCell>
									{entry.message}
									{event.matchedBibId && (
										<>
											{" "}
											<Link
												to="/bibs/$bibId"
												params={{ bibId: event.matchedBibId }}
											>
												{t("bibRecords.audit_log.open_bib")}
											</Link>
										</>
									)}
									{event.matchedClusterId && (
										<>
											{" "}
											<Link
												to="/search/$clusterId/cluster"
												params={{ clusterId: event.matchedClusterId }}
											>
												{t("bibRecords.audit_log.open_cluster")}
											</Link>
										</>
									)}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
