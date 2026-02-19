import dayjs from "dayjs";

// This is what a Cluster Audit Log entry looks like
interface ClusterAuditLogEntry {
	id: string;
	processType: string;
	processId: string;
	subjectId: string;
	message: string;
	timestamp: string;
}

interface ClusterAuditLogResponse {
	ingest: Record<string, ClusterAuditLogEntry[]>;
}

export const parseClusteringAuditLog = (
	data: ClusterAuditLogResponse | null,
): any[] => {
	if (!data || !data.ingest) return [];

	const rows: any[] = [];

	Object.keys(data.ingest).forEach((subjectId) => {
		const events = data.ingest[subjectId];

		events.forEach((event) => {
			let eventType = "Info";
			let matchedBibId = "";
			let matchCriteria = "";
			let matchValue = "";

			const msg = event.message;

			if (msg.includes("High confidence match")) {
				eventType = "Match - high confidence";

				// Format: ... match with Bib [UUID] on [CRITERIA] = [VALUE]
				const bibSplit = msg.split("match with Bib [");
				if (bibSplit.length > 1) {
					const afterBib = bibSplit[1];
					matchedBibId = afterBib.split("]")[0];
					const criteriaSplit = afterBib.split("] on [");
					if (criteriaSplit.length > 1) {
						const afterCriteria = criteriaSplit[1];
						matchCriteria = afterCriteria.split("]")[0];

						const valueSplit = afterCriteria.split("] = [");
						if (valueSplit.length > 1) {
							matchValue = valueSplit[1].split("]")[0].trim();
						}
					}
				}
			} else if (msg.includes("low confidence matches")) {
				eventType = "Match - Low Confidence";
			} else if (msg.includes("outdated bibs")) {
				eventType = "Warning";
			} else if (msg.includes("No existing cluster")) {
				eventType = "New Cluster";
			} else if (msg.includes("Matched single cluster")) {
				eventType = "Existing Cluster";
				// Extract the cluster ID if needed
				const clusterSplit = msg.split("Matched single cluster [");
				if (clusterSplit.length > 1) {
					matchValue = clusterSplit[1].split("]")[0];
				}
			}

			rows.push({
				id: event.id,
				subjectId: subjectId, // The Incoming Bib
				timestamp: event.timestamp,
				formattedTimestamp: dayjs(event.timestamp).format("YYYY-MM-DD HH:mm"),
				eventType: eventType,
				message: msg,
				matchedBibId: matchedBibId || null,
				matchCriteria: matchCriteria || null,
				matchValue: matchValue || null,
				processType: event.processType,
				processId: event.processId,
			});
		});
	});

	// Return flat array, DataGrid will handle grouping/sorting
	return rows.sort(
		(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
	);
};
